import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { blocksToMarkdown } from '../../util/markdown';
import { Activity } from '../activities/entities/activity.entity';
import type { PushDto, PushListDto } from './dto/push.dto';
import { ContentPush } from './entities/content-push.entity';
import { PushScheduleService } from './push-schedule.service';

const shanghaiDateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function pushView(push: ContentPush, includeMarkdown = false) {
  const { id, title, summary, document, tags, prompt, status, activityId } = push;
  const [date, time] = shanghaiDateTime
    .format(push.sentAt ?? push.scheduledAt ?? push.createdAt)
    .split(' ');
  return {
    id,
    title,
    summary,
    document,
    ...(includeMarkdown
      ? { contentMarkdown: push.contentMarkdown ?? blocksToMarkdown(document) }
      : {}),
    tags,
    prompt,
    status,
    activityId,
    date,
    time,
  };
}

function dispatchTimes({ date, time, status }: PushDto, original?: ContentPush) {
  if (status === 'scheduled') {
    const scheduledAt = new Date(`${date}T${time}:00+08:00`);
    if (scheduledAt.getTime() <= Date.now())
      throw new BadRequestException('发送时间需晚于当前时间。');
    return { scheduledAt, sentAt: null };
  }
  return {
    scheduledAt: null,
    sentAt: status === 'sent' ? (original?.sentAt ?? new Date()) : null,
  };
}

@Injectable()
export class PushesService {
  private readonly logger = new Logger(PushesService.name);

  constructor(
    @InjectRepository(ContentPush) private readonly pushes: Repository<ContentPush>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    private readonly schedule: PushScheduleService,
  ) {}

  /** 关联活动推送成功后，把活动状态标记为已推送。 */
  private async markActivityPushed(activityId?: string | null) {
    if (!activityId) return;
    await this.activities.update({ id: activityId }, { status: 'pushed' });
  }

  /** 定时任务入队或取消，数据库始终是最终状态。 */
  private async syncSchedule(push: Pick<ContentPush, 'id' | 'status' | 'scheduledAt'>) {
    if (push.status === 'scheduled' && push.scheduledAt) {
      await this.schedule.schedule(push.id, push.scheduledAt);
    } else {
      await this.schedule.cancel(push.id);
    }
  }

  /**
   * 每分钟兜底同步：Redis 正常时由延迟任务准点执行，这里只处理 Redis 重启丢任务、
   * 历史到期未发送和未来任务缺失等情况。
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'publish-due-content-pushes',
    timeZone: 'Asia/Shanghai',
  })
  async publishDue() {
    try {
      await this.schedule.reconcile();
    } catch (error) {
      this.logger.error('定时推送兜底失败', error instanceof Error ? error.stack : String(error));
    }
  }

  async list({ page, pageSize, status, keyword, startDate, endDate }: PushListDto) {
    if (startDate && endDate && startDate > endDate)
      throw new BadRequestException('起始日期不能晚于结束日期。');
    const displayTime = 'COALESCE(push.sent_at, push.scheduled_at, push.created_at)';
    const query = this.pushes
      .createQueryBuilder('push')
      .orderBy(displayTime, 'DESC')
      .addOrderBy('push.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (status) query.andWhere('push.status = :status', { status });
    if (keyword?.trim()) {
      query.andWhere(
        "(push.title LIKE :keyword ESCAPE '!' OR push.summary LIKE :keyword ESCAPE '!')",
        {
          keyword: `%${keyword.trim().replace(/[!%_]/g, '!$&')}%`,
        },
      );
    }
    if (startDate) query.andWhere(`${displayTime} >= :startDate`, { startDate });
    if (endDate) query.andWhere(`${displayTime} < DATE_ADD(:endDate, INTERVAL 1 DAY)`, { endDate });
    const [rows, total] = await query.getManyAndCount();
    return { items: rows.map((row) => pushView(row)), page, pageSize, total };
  }

  async detail(id: string) {
    const push = await this.pushes.findOneBy({ id });
    if (!push) throw new NotFoundException('推送不存在。');
    return pushView(push, true);
  }

  async create(input: PushDto) {
    if (input.status === 'failed') throw new BadRequestException('不能创建失败的推送记录。');
    if (input.activityId) {
      const activity = await this.activities.findOneBy({ id: input.activityId });
      if (activity?.status === 'pushed') {
        throw new ConflictException('活动已推送，不能再次推送。');
      }
    }
    const { date, time, contentMarkdown, ...fields } = input;
    const id = randomUUID();
    const saved = await this.pushes.save({
      id,
      ...fields,
      contentMarkdown: contentMarkdown?.trim() || blocksToMarkdown(fields.document),
      ...dispatchTimes({ date, time, ...fields }),
    });
    if (fields.status === 'sent') await this.markActivityPushed(fields.activityId);
    await this.syncSchedule(saved);
    return this.detail(id);
  }

  async update(id: string, input: PushDto) {
    const saved = await this.pushes.manager.transaction(async (manager) => {
      const push = await manager.findOne(ContentPush, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!push) throw new NotFoundException('推送不存在。');
      if (input.status === 'failed' && push.status !== 'failed')
        throw new ConflictException('推送状态已更新。');
      const { date, time, contentMarkdown, ...fields } = input;
      const bodyLocked = push.status === 'sent';
      if (bodyLocked) {
        if (input.status !== 'sent') throw new ConflictException('已发送的推送不能修改状态。');
        // 已发送的推送保留首次发送的正文，只允许更新标题、摘要、标签等信息。
        if (!isDeepStrictEqual(fields.document, push.document))
          throw new ConflictException('已发送的推送不能修改正文。');
        if (contentMarkdown !== undefined && contentMarkdown !== (push.contentMarkdown ?? ''))
          throw new ConflictException('已发送的推送不能修改正文。');
      }
      const next = await manager.save(ContentPush, {
        ...push,
        ...fields,
        document: bodyLocked ? push.document : fields.document,
        contentMarkdown: bodyLocked
          ? push.contentMarkdown
          : contentMarkdown?.trim() || blocksToMarkdown(fields.document),
        ...dispatchTimes({ date, time, ...fields }, push),
      });
      if (fields.status === 'sent') {
        const activityId = fields.activityId ?? push.activityId;
        if (activityId) {
          await manager.update(Activity, { id: activityId }, { status: 'pushed' });
        }
      }
      return next;
    });
    await this.syncSchedule(saved);
    return this.detail(id);
  }

  async retry(id: string) {
    const push = await this.pushes.findOneBy({ id });
    if (!push) throw new NotFoundException('推送不存在。');
    if (push.activityId) {
      const activity = await this.activities.findOneBy({ id: push.activityId });
      if (activity?.status === 'pushed') {
        throw new ConflictException('活动已推送，不能再次推送。');
      }
    }
    const result = await this.pushes.update(
      { id, status: 'failed' },
      { status: 'sent', sentAt: new Date(), scheduledAt: null },
    );
    if (!result.affected) throw new ConflictException('当前记录无法重新发送。');
    await this.markActivityPushed(push.activityId);
    await this.schedule.cancel(id);
    return this.detail(id);
  }

  async remove(id: string) {
    const result = await this.pushes.delete({ id });
    if (!result.affected) throw new NotFoundException('推送不存在。');
    await this.schedule.cancel(id);
  }
}
