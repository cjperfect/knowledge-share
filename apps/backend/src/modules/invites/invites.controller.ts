import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { Result } from '../../util/result';
import { ActivitySignup } from '../activities/entities/activity-signup.entity';
import { Activity } from '../activities/entities/activity.entity';
import { UpdateCommissionAmountDto } from './dto/commission-amount.dto';
import { UpdateCommissionPayoutDto } from './dto/commission-payout.dto';
import { UpdateCommissionRateDto } from './dto/commission-rate.dto';
import { CommissionAmount } from './entities/commission-amount.entity';
import { CommissionPayout } from './entities/commission-payout.entity';
import { CommissionSetting } from './entities/commission-setting.entity';

interface SignupRow {
  id: string;
  name: string;
  activityId: string;
  activityName: string;
  inviterId: string | null;
  registeredAt: string;
}

interface InviteNode extends SignupRow {
  inviterName: string | null;
  children: InviteNode[];
}

interface CommissionInviteeRow {
  inviterName: string;
  inviterPhone: string;
  signupId: string;
  inviteeName: string;
  activityName: string;
  invitedAt: string;
  baseAmount: string;
  paid: number | string;
  paidAt: string | null;
  payoutRatePercent: number | string | null;
}

@Controller('invites')
@UseGuards(SessionGuard)
export class InvitesController {
  constructor(private readonly database: DataSource) {}

  @Get('commission-summary')
  @Header('Cache-Control', 'no-store')
  async commissionSummary() {
    const [rows, ratePercent] = await Promise.all([
      this.database.query<CommissionInviteeRow[]>(`
        SELECT
          inviter.name AS inviterName,
          inviter.phone AS inviterPhone,
          child.id AS signupId,
          child.name AS inviteeName,
          activity.name AS activityName,
          DATE_FORMAT(child.created_at, '%Y-%m-%d %H:%i') AS invitedAt,
          COALESCE(amount.base_amount, activity.price, 0) AS baseAmount,
          COALESCE(payout.paid, 0) AS paid,
          DATE_FORMAT(payout.paid_at, '%Y-%m-%d %H:%i') AS paidAt,
          payout.rate_bps AS payoutRatePercent
        FROM activity_signups child
        INNER JOIN activity_signups inviter ON inviter.id = child.inviter_id
        INNER JOIN activities activity ON activity.id = child.activity_id
        LEFT JOIN commission_amounts amount ON amount.signup_id = child.id
        LEFT JOIN commission_payouts payout ON payout.phone = inviter.phone
        WHERE child.inviter_id IS NOT NULL
        ORDER BY child.created_at DESC, child.id ASC
      `),
      this.currentRatePercent(),
    ]);

    const inviters = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        paid: boolean;
        paidAt: string | null;
        ratePercent: number;
        invitees: {
          signupId: string;
          name: string;
          activityName: string;
          invitedAt: string;
          baseAmount: number;
          commission: number;
        }[];
        baseAmount: number;
        commission: number;
      }
    >();
    for (const row of rows) {
      const baseAmount = Number(row.baseAmount) || 0;
      const paid = Boolean(Number(row.paid));
      const effectiveRatePercent =
        paid && row.payoutRatePercent !== null ? Number(row.payoutRatePercent) : ratePercent;
      const commission = this.commissionFor(baseAmount, effectiveRatePercent);
      const key = row.inviterPhone;
      let inviter = inviters.get(key);
      if (!inviter) {
        inviter = {
          key,
          name: row.inviterName,
          phone: key,
          paid,
          paidAt: row.paidAt,
          ratePercent: effectiveRatePercent,
          invitees: [],
          baseAmount: 0,
          commission: 0,
        };
        inviters.set(key, inviter);
      }
      inviter.invitees.push({
        signupId: row.signupId,
        name: row.inviteeName,
        activityName: row.activityName,
        invitedAt: row.invitedAt,
        baseAmount,
        commission,
      });
      inviter.baseAmount += baseAmount;
      inviter.commission += commission;
    }

    const items = [...inviters.values()]
      .map((inviter) => ({
        ...inviter,
        inviteCount: inviter.invitees.length,
        baseAmount: this.money(inviter.baseAmount),
        commission: this.money(inviter.commission),
      }))
      .sort(
        (a, b) =>
          b.commission - a.commission ||
          b.inviteCount - a.inviteCount ||
          a.name.localeCompare(b.name, 'zh-CN'),
      );

    return Result.ok({
      ratePercent,
      inviterCount: items.length,
      inviteeCount: items.reduce((total, item) => total + item.inviteCount, 0),
      totalBaseAmount: this.money(items.reduce((total, item) => total + item.baseAmount, 0)),
      totalCommission: this.money(items.reduce((total, item) => total + item.commission, 0)),
      items,
    });
  }

  @Patch('commission-amounts/:signupId')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async updateCommissionAmount(
    @Param('signupId', new ParseUUIDPipe()) signupId: string,
    @Body() body: UpdateCommissionAmountDto,
  ) {
    const signup = await this.database.getRepository(ActivitySignup).findOne({
      where: { id: signupId },
      select: { id: true, inviterId: true },
    });
    if (!signup || !signup.inviterId) {
      throw new NotFoundException('被邀请用户不存在或不是一级邀请。');
    }
    const inviter = await this.database.getRepository(ActivitySignup).findOne({
      where: { id: signup.inviterId },
      select: { id: true, phone: true },
    });
    const payout = inviter
      ? await this.database
          .getRepository(CommissionPayout)
          .findOne({ where: { phone: inviter.phone }, select: { paid: true } })
      : null;
    if (payout?.paid) {
      throw new BadRequestException('该邀请人的佣金已发放，金额不可再修改。');
    }
    await this.database.getRepository(CommissionAmount).save({
      signupId,
      baseAmount: body.baseAmount.toFixed(2),
    });
    const ratePercent = await this.currentRatePercent();
    return Result.ok({
      signupId,
      baseAmount: this.money(body.baseAmount),
      ratePercent,
      commission: this.commissionFor(body.baseAmount, ratePercent),
    });
  }

  @Patch('commission-payouts')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async updateCommissionPayout(@Body() body: UpdateCommissionPayoutDto) {
    const repository = this.database.getRepository(CommissionPayout);
    const [current, currentRatePercent] = await Promise.all([
      repository.findOne({
        where: { phone: body.phone },
        select: { phone: true, paid: true, paidAt: true, ratePercent: true },
      }),
      this.currentRatePercent(),
    ]);
    const paidAt = body.paid ? (current?.paidAt ?? new Date()) : null;
    const payoutRatePercent = body.paid
      ? current?.paid && current.ratePercent !== null
        ? current.ratePercent
        : currentRatePercent
      : null;
    await repository.save({
      phone: body.phone,
      paid: body.paid,
      paidAt,
      ratePercent: payoutRatePercent,
    });
    // TODO(佣金状态通知): 仅在佣金从“未发放”变为“已发放”时给用户提示，具体渠道和文案尚未确定。
    // 判断条件建议为 Boolean(current?.paid) === false && body.paid === true；重复保存已发放状态
    // 或撤销发放时都不发送。目前只落库并返回后台。后续接入站内通知、短信或微信服务通知时放在这里，
    // 并保证幂等，避免重复提醒。
    return Result.ok({
      phone: body.phone,
      paid: body.paid,
      paidAt: paidAt ? paidAt.toISOString() : null,
      ratePercent: payoutRatePercent,
    });
  }

  @Patch('commission-rate')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async updateCommissionRate(@Body() body: UpdateCommissionRateDto) {
    const ratePercent = Number(body.ratePercent.toFixed(2));
    await this.database.getRepository(CommissionSetting).save({ id: 1, ratePercent });
    return Result.ok({ ratePercent });
  }

  private commissionFor(baseAmount: number, ratePercent: number) {
    return this.money((baseAmount * ratePercent) / 100);
  }

  private money(value: number) {
    return Number(value.toFixed(2));
  }

  private async currentRatePercent() {
    const setting = await this.database
      .getRepository(CommissionSetting)
      .findOne({ where: { id: 1 }, select: { id: true, ratePercent: true } });
    return setting?.ratePercent ?? 0;
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  async list() {
    const [activities, signups] = await Promise.all([
      this.database.getRepository(Activity).find({
        select: { id: true, name: true, eventDate: true },
        order: { eventDate: 'DESC', id: 'DESC' },
      }),
      this.database
        .getRepository(ActivitySignup)
        .createQueryBuilder('signup')
        .innerJoin('signup.activity', 'activity')
        .select('signup.id', 'id')
        .addSelect('signup.name', 'name')
        .addSelect('CAST(signup.activity_id AS CHAR)', 'activityId')
        .addSelect('activity.name', 'activityName')
        .addSelect('signup.inviter_id', 'inviterId')
        .addSelect("DATE_FORMAT(signup.created_at, '%Y-%m-%d %H:%i')", 'registeredAt')
        .orderBy('signup.created_at', 'ASC')
        .addOrderBy('signup.id', 'ASC')
        .getRawMany<SignupRow>(),
    ]);
    const groups = activities.map((activity) => ({
      activityId: activity.id,
      activityName: activity.name,
      activityDate: activity.eventDate,
      nodes: [] as InviteNode[],
    }));
    const groupsById = new Map(groups.map((group) => [group.activityId, group]));
    const nodes = new Map(
      signups.map((row) => [row.id, { ...row, inviterName: null, children: [] } as InviteNode]),
    );
    for (const node of nodes.values()) {
      const parent = node.inviterId ? nodes.get(node.inviterId) : undefined;
      if (parent && parent.activityId === node.activityId && parent.id !== node.id) {
        node.inviterName = parent.name;
        parent.children.push(node);
      } else {
        groupsById.get(node.activityId)?.nodes.push(node);
      }
    }
    return Result.ok(groups);
  }
}
