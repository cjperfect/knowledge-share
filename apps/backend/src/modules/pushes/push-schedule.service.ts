import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { LessThanOrEqual, Repository } from 'typeorm';
import type { RedisConfig } from '../../config/configuration';
import { Activity } from '../activities/entities/activity.entity';
import { ContentPush } from './entities/content-push.entity';

const queueName = 'content-push';
const jobName = 'publish';
const jobIdPrefix = 'push-';

interface PushJobData {
  pushId: string;
}

/**
 * 内容推送的 Redis 延迟队列。
 *
 * MySQL 仍是唯一事实来源：创建/更新定时推送时写库，再按 scheduledAt 投递 BullMQ
 * 延迟任务；任务到点后通过条件更新抢占执行权，因此多实例、重试和兜底扫表都不会
 * 把同一条推送处理两次。
 */
@Injectable()
export class PushScheduleService implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(PushScheduleService.name);
  private readonly prefix: string;
  private queue: Queue<PushJobData> | null = null;
  private worker: Worker<PushJobData> | null = null;
  private queueConnection: IORedis | null = null;
  private workerConnection: IORedis | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ContentPush) private readonly pushes: Repository<ContentPush>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
  ) {
    this.prefix = this.config.get<RedisConfig>('redis')?.prefix || 'knowledge-share';
  }

  onModuleInit(): void {
    const redis = this.config.get<RedisConfig>('redis');
    if (!redis?.url) {
      this.logger.warn('REDIS_URL 未配置，定时推送将仅依赖每分钟扫表兜底');
      return;
    }

    /**
     * Queue 使用可在断连时快速失败的连接；Worker 使用 BullMQ 要求的
     * maxRetriesPerRequest=null，避免阻塞取任务被 ioredis 主动中断。
     */
    this.queueConnection = new IORedis(redis.url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.workerConnection = new IORedis(redis.url, {
      maxRetriesPerRequest: null,
    });
    this.queueConnection.on('error', (error) => {
      this.logger.warn(`Redis 队列连接异常: ${error.message}`);
    });
    this.workerConnection.on('error', (error) => {
      this.logger.warn(`Redis Worker 连接异常: ${error.message}`);
    });

    const bullPrefix = `${this.prefix}:bull`;
    this.queue = new Queue<PushJobData>(queueName, {
      connection: this.queueConnection,
      prefix: bullPrefix,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    });
    this.worker = new Worker<PushJobData>(
      queueName,
      async (job) => {
        await this.publish(job.data.pushId);
      },
      {
        connection: this.workerConnection,
        prefix: bullPrefix,
        concurrency: 5,
      },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `定时推送任务失败 job=${job?.id ?? 'unknown'}: ${error.message}`,
        error.stack,
      );
    });
    this.worker.on('error', (error) => {
      this.logger.warn(`Redis Worker 异常: ${error.message}`);
    });
    this.logger.log(`Redis 定时推送队列已启用: ${bullPrefix}:${queueName}`);
  }

  onApplicationBootstrap(): void {
    // 启动后先补一次，覆盖 Redis 重启丢任务或上次进程异常退出的情况。
    void this.reconcile().catch((error: unknown) => {
      this.logger.error(
        '启动时同步定时推送失败',
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => undefined);
    await this.queue?.close().catch(() => undefined);
    this.queueConnection?.disconnect();
    this.workerConnection?.disconnect();
  }

  /** 新建或改期时写入延迟任务；重复 jobId 会先移除旧任务。 */
  async schedule(pushId: string, scheduledAt: Date | null): Promise<void> {
    if (!this.queue || !scheduledAt) return;
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    try {
      await this.queue.remove(`${jobIdPrefix}${pushId}`);
      await this.queue.add(
        jobName,
        { pushId },
        {
          jobId: `${jobIdPrefix}${pushId}`,
          delay,
        },
      );
      this.logger.log(`定时推送已入队: ${pushId}，延迟 ${Math.round(delay / 1000)} 秒`);
    } catch (error) {
      // 数据库记录仍然存在，每分钟的兜底扫描会补发；这里不让接口因为 Redis 故障失败。
      this.logger.error(
        `定时推送入队失败: ${pushId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** 取消草稿化、立即发送或删除后的延迟任务。 */
  async cancel(pushId: string): Promise<void> {
    if (!this.queue) return;
    try {
      await this.queue.remove(`${jobIdPrefix}${pushId}`);
    } catch (error) {
      this.logger.warn(
        `取消定时推送任务失败: ${pushId} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 兜底同步：到期的直接抢占执行，未来的确保队列里有任务。
   * 由每分钟 cron 调用，Redis 正常时队列会先到点执行，这里通常只补漏。
   */
  async reconcile(): Promise<void> {
    const scheduled = await this.pushes.find({
      where: { status: 'scheduled' },
      select: { id: true, scheduledAt: true },
    });
    const now = Date.now();
    for (const push of scheduled) {
      if (!push.scheduledAt) continue;
      if (push.scheduledAt.getTime() <= now) {
        await this.publish(push.id);
      } else {
        await this.ensureJob(push.id, push.scheduledAt);
      }
    }
  }

  private async ensureJob(pushId: string, scheduledAt: Date): Promise<void> {
    if (!this.queue) return;
    try {
      const job = await this.queue.getJob(`${jobIdPrefix}${pushId}`);
      if (job) return;
      await this.schedule(pushId, scheduledAt);
    } catch (error) {
      this.logger.warn(
        `检查定时推送任务失败: ${pushId} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 到期执行入口：先条件更新 status=scheduled -> sent，只有真正抢到的那次才
   * 执行后续投递，避免队列重试、cron 兜底和多实例并发造成重复发送。
   */
  private async publish(pushId: string): Promise<void> {
    const push = await this.pushes.findOne({
      where: { id: pushId },
      select: { id: true, status: true, scheduledAt: true, activityId: true },
    });
    if (!push || push.status !== 'scheduled' || !push.scheduledAt) return;

    const now = new Date();
    if (push.scheduledAt.getTime() > now.getTime()) {
      await this.ensureJob(push.id, push.scheduledAt);
      return;
    }

    const result = await this.pushes.update(
      { id: push.id, status: 'scheduled', scheduledAt: LessThanOrEqual(now) },
      { status: 'sent', sentAt: push.scheduledAt },
    );
    if (!result.affected) return;

    if (push.activityId) {
      await this.activities.update({ id: push.activityId }, { status: 'pushed' });
    }

    // TODO(消息投递): 定时时间已到，但实际发送渠道尚未确定（站内通知/订阅消息/短信/邮件）。
    // 确认后在这里调用统一的 deliverPush(push)，内部要带幂等键，并覆盖立即发送、
    // 定时发送和失败重试；发送失败时把记录改为 failed，而不是继续标记已发送。
  }
}
