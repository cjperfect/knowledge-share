import { BadRequestException, Injectable } from '@nestjs/common';
import { Between, DataSource } from 'typeorm';
import { matchActivityId } from '../activities/activities.service';
import { ActivitySignup } from '../activities/entities/activity-signup.entity';
import { Activity } from '../activities/entities/activity.entity';
import { isActivityId } from '../activities/pipes/activity-id.pipe';
import { ContentPush } from '../pushes/entities/content-push.entity';
import type { HomeOverviewQueryDto } from './dto/home-overview.dto';

function currentWeek() {
  const today = new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) + 'T00:00:00Z',
  );
  today.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const startDate = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() + 6);
  return { startDate, endDate: today.toISOString().slice(0, 10) };
}

@Injectable()
export class HomeService {
  constructor(private readonly database: DataSource) {}

  async getOverview(query: HomeOverviewQueryDto) {
    const defaults = currentWeek();
    const { activityId, startDate = defaults.startDate, endDate = defaults.endDate } = query;
    if (startDate > endDate) throw new BadRequestException('起始日期不能晚于结束日期。');
    if (activityId && !isActivityId(activityId)) throw new BadRequestException('活动 ID 无效。');

    const signups = this.database
      .getRepository(ActivitySignup)
      .createQueryBuilder('signup')
      .innerJoin('signup.activity', 'activity')
      .select("DATE_FORMAT(signup.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'registrations')
      .addSelect('SUM(signup.inviter_id IS NOT NULL)', 'sharedRegistrations')
      .where('signup.created_at >= :startDate', { startDate })
      .andWhere('signup.created_at < DATE_ADD(:endDate, INTERVAL 1 DAY)', { endDate })
      .groupBy("DATE_FORMAT(signup.created_at, '%Y-%m-%d')")
      .orderBy('date', 'ASC');
    const pushes = this.database
      .getRepository(ContentPush)
      .createQueryBuilder('push')
      .where('push.status = :status', { status: 'sent' })
      .andWhere('push.sent_at >= :startDate', { startDate })
      .andWhere('push.sent_at < DATE_ADD(:endDate, INTERVAL 1 DAY)', { endDate });
    if (activityId) {
      signups.andWhere('signup.activity_id = CAST(:activityId AS UNSIGNED)', { activityId });
      pushes.andWhere('push.activity_id = CAST(:activityId AS UNSIGNED)', { activityId });
    }

    const [activities, pushCount, raw] = await Promise.all([
      this.database.getRepository(Activity).countBy({
        eventDate: Between(startDate, endDate),
        ...(activityId && { id: matchActivityId(activityId) }),
      }),
      pushes.getCount(),
      signups.getRawMany<{ date: string; registrations: string; sharedRegistrations: string }>(),
    ]);
    const activityTrend = raw.map(({ date, registrations, sharedRegistrations }) => ({
      date,
      registrations: Number(registrations),
      sharedRegistrations: Number(sharedRegistrations),
    }));
    const registrations = activityTrend.reduce((total, row) => total + row.registrations, 0);
    const sharedRegistrations = activityTrend.reduce(
      (total, row) => total + row.sharedRegistrations,
      0,
    );
    return {
      activityId: activityId ?? null,
      range: { startDate, endDate },
      metrics: { activities, registrations, pushCount, sharedRegistrations },
      activityTrend,
    };
  }
}
