import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Result } from '../../util/result';
import { ActivitySignup } from '../activities/entities/activity-signup.entity';
import { Activity } from '../activities/entities/activity.entity';
import { publicActivityView } from '../activities/activity-view';
import { Product } from '../products/entities/product.entity';
import { productView } from '../products/product-view';

interface PublicRewardRow {
  inviterName: string;
  inviterPhone: string;
  baseAmount: string;
  paid: number | string;
  payoutRatePercent: number | string | null;
}

@Controller('public/site')
export class PublicContentController {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    @InjectRepository(ActivitySignup) private readonly signups: Repository<ActivitySignup>,
    private readonly database: DataSource,
  ) {}

  @Get('products')
  async listProducts() {
    const items = await this.products.find({
      order: { updatedAt: 'DESC', id: 'DESC' },
      take: 24,
    });
    return Result.ok(items.map(productView));
  }

  @Get('products/:id')
  async product(@Param('id') id: string) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException('产品不存在。');
    return Result.ok(productView(product));
  }

  @Get('invite-rewards')
  @Header('Cache-Control', 'no-store')
  async inviteRewards() {
    const [rows, settings] = await Promise.all([
      this.database.query<PublicRewardRow[]>(`
        SELECT
          inviter.name AS inviterName,
          inviter.phone AS inviterPhone,
          COALESCE(amount.base_amount, activity.price, 0) AS baseAmount,
          COALESCE(payout.paid, 0) AS paid,
          payout.rate_bps AS payoutRatePercent
        FROM activity_signups child
        INNER JOIN activity_signups inviter ON inviter.id = child.inviter_id
        LEFT JOIN commission_amounts amount ON amount.signup_id = child.id
        LEFT JOIN commission_payouts payout ON payout.phone = inviter.phone
        WHERE child.inviter_id IS NOT NULL
      `),
      this.database.query<{ ratePercent: string | number }[]>(`
        SELECT rate_bps AS ratePercent
        FROM commission_settings
        WHERE id = 1
        LIMIT 1
      `),
    ]);
    const currentRatePercent = Number(settings[0]?.ratePercent ?? 0);
    const inviters = new Map<
      string,
      { name: string; phone: string; inviteCount: number; commission: number }
    >();
    for (const row of rows) {
      const baseAmount = Number(row.baseAmount) || 0;
      const paid = Boolean(Number(row.paid));
      const ratePercent =
        paid && row.payoutRatePercent !== null ? Number(row.payoutRatePercent) : currentRatePercent;
      const commission = Number(((baseAmount * ratePercent) / 100).toFixed(2));
      const key = row.inviterPhone;
      const inviter = inviters.get(key) ?? {
        name: row.inviterName || '匿名邀请人',
        phone: this.maskPhone(row.inviterPhone),
        inviteCount: 0,
        commission: 0,
      };
      inviter.inviteCount += 1;
      inviter.commission += commission;
      inviters.set(key, inviter);
    }
    const items = [...inviters.values()]
      .map((inviter) => ({
        ...inviter,
        commission: Number(inviter.commission.toFixed(2)),
      }))
      .sort(
        (a, b) =>
          b.commission - a.commission ||
          b.inviteCount - a.inviteCount ||
          a.name.localeCompare(b.name, 'zh-CN'),
      );
    return Result.ok({ items });
  }

  @Get('activities')
  async listActivities() {
    const items = await this.activities.find({
      where: { deletedAt: IsNull(), status: In(['ended', 'pushed']) },
      order: { eventDate: 'DESC', id: 'DESC' },
      take: 50,
    });
    const counts = items.length
      ? await this.signups
          .createQueryBuilder('signup')
          .select('CAST(signup.activity_id AS CHAR)', 'id')
          .addSelect('COUNT(*)', 'total')
          .where('signup.activity_id IN (:...ids)', {
            ids: items.map((activity) => activity.id),
          })
          .groupBy('signup.activity_id')
          .getRawMany<{ id: string; total: string }>()
      : [];
    const countMap = new Map(counts.map((row) => [row.id, Number(row.total)]));
    return Result.ok(
      items.map((activity) => publicActivityView(activity, countMap.get(activity.id) ?? 0)),
    );
  }

  private maskPhone(phone: string) {
    if (phone.length < 7) return '***';
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  @Get('activities/:id')
  async activity(@Param('id') id: string) {
    if (!/^[1-9]\d*$/.test(id)) throw new NotFoundException('活动不存在。');
    const activity = await this.activities.findOneBy({
      id: id as `${number}`,
      status: In(['ended', 'pushed']),
    });
    if (!activity) throw new NotFoundException('活动不存在。');
    const signupCount = await this.signups.count({ where: { activityId: activity.id } });
    return Result.ok(publicActivityView(activity, signupCount, true));
  }
}
