import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Raw, Repository } from 'typeorm';
import type { CreateActivityDto, UpdateActivityDto } from './dto/activity-input.dto';
import type { ActivityQueryDto } from './dto/activity-query.dto';
import { blocksToMarkdown } from '../../util/markdown';
import { ActivitySignup } from './entities/activity-signup.entity';
import { Activity } from './entities/activity.entity';
import { activityView } from './activity-view';

export function matchActivityId(id: string) {
  return Raw<string>((column) => `${column} = CAST(:activityId AS UNSIGNED)`, { activityId: id });
}

function contains(value: string) {
  return `%${value.replace(/[!%_]/g, '!$&')}%`;
}

@Injectable()
export class ActivitiesService {
  constructor(@InjectRepository(Activity) private readonly activities: Repository<Activity>) {}

  async list({
    page,
    pageSize,
    keyword,
    sharer,
    date,
    startDate,
    endDate,
    status,
  }: ActivityQueryDto) {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('起始日期不能晚于结束日期。');
    }

    const query = this.activities
      .createQueryBuilder('activity')
      .orderBy('activity.eventDate', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (keyword) query.andWhere("activity.name LIKE :name ESCAPE '!'", { name: contains(keyword) });
    if (sharer)
      query.andWhere("activity.sharer LIKE :sharer ESCAPE '!'", { sharer: contains(sharer) });
    if (date) query.andWhere('activity.eventDate = :date', { date });
    if (startDate) query.andWhere('activity.eventDate >= :startDate', { startDate });
    if (endDate) query.andWhere('activity.eventDate <= :endDate', { endDate });
    if (status) {
      query.andWhere('activity.status IN (:...statuses)', {
        statuses: status === 'ended' ? ['ended', 'pushed'] : [status],
      });
    }

    const [activities, total] = await query.getManyAndCount();
    const counts = activities.length
      ? await this.activities.manager
          .getRepository(ActivitySignup)
          .createQueryBuilder('signup')
          .select('CAST(signup.activity_id AS CHAR)', 'id')
          .addSelect('COUNT(*)', 'total')
          .where('signup.activity_id IN (:...ids)', {
            ids: activities.map((activity) => activity.id),
          })
          .groupBy('signup.activity_id')
          .getRawMany<{ id: string; total: string }>()
      : [];
    const signupCounts = new Map(counts.map((row) => [row.id, Number(row.total)]));
    return {
      items: activities.map((activity) => ({
        ...activityView(activity),
        signupCount: signupCounts.get(activity.id) ?? 0,
      })),
      page,
      pageSize,
      total,
    };
  }

  async detail(id: string, status?: string) {
    const statusFilter =
      status === 'ended'
        ? In<Activity['status']>(['ended', 'pushed'])
        : (status as Activity['status'] | undefined);
    const activity = await this.activities.findOneBy({
      id: matchActivityId(id),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    if (!activity) throw new NotFoundException('活动不存在。');
    return activityView(activity, true);
  }

  async create({ date, price, ...input }: CreateActivityDto, createdBy: string) {
    return this.activities.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Activity)
        .values({ ...input, eventDate: date, price: price ?? 0, status: 'not_started', createdBy })
        .updateEntity(false)
        .execute();

      // Read on the same connection and let MySQL match the generated BIGINT exactly.
      const activity = await manager
        .createQueryBuilder(Activity, 'activity')
        .where('activity.id = LAST_INSERT_ID()')
        .getOneOrFail();
      return activityView(activity);
    });
  }

  async update(
    id: string,
    { name, sharer, date, summary, price, thumbnail, content, contentMarkdown }: UpdateActivityDto,
  ) {
    if (
      [name, sharer, date, summary, price, thumbnail, content, contentMarkdown].every(
        (value) => value === undefined,
      )
    ) {
      throw new BadRequestException('请至少填写一项要更新的活动信息。');
    }
    if (contentMarkdown !== undefined && content === undefined) {
      throw new BadRequestException('Markdown 需要和活动内容一起提交。');
    }

    await this.activities.manager.transaction(async (manager) => {
      const activity = await manager.findOne(Activity, {
        where: { id: matchActivityId(id), deletedAt: IsNull() },
      });
      if (!activity) throw new NotFoundException('活动不存在。');

      const hasBasicChanges = [name, sharer, date, summary, price, thumbnail].some(
        (value) => value !== undefined,
      );
      if (hasBasicChanges && activity.status !== 'not_started') {
        throw new ConflictException(
          activity.status === 'pushed'
            ? '活动已推送，不能再编辑活动信息。'
            : '活动已结束，不能再编辑活动信息。',
        );
      }
      if (content !== undefined && activity.status === 'pushed') {
        throw new ConflictException('活动已推送，不能再编辑回顾。');
      }

      if (name !== undefined) activity.name = name;
      if (sharer !== undefined) activity.sharer = sharer;
      if (date !== undefined) activity.eventDate = date;
      if (summary !== undefined) activity.summary = summary;
      if (price !== undefined) activity.price = price;
      if (thumbnail !== undefined) activity.thumbnail = thumbnail || null;
      if (content !== undefined) {
        activity.content = content.length ? content : null;
        activity.contentMarkdown = activity.content
          ? contentMarkdown?.trim() || blocksToMarkdown(activity.content)
          : null;
        activity.status =
          activity.status === 'pushed' ? 'pushed' : activity.content ? 'ended' : 'not_started';
      }
      await manager.save(activity);
    });

    return this.detail(id);
  }

  async remove(id: string) {
    const result = await this.activities.softDelete({
      id: matchActivityId(id),
      deletedAt: IsNull(),
    });
    if (!result.affected) throw new NotFoundException('活动不存在。');
  }
}
