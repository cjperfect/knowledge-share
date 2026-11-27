import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { isUUID, validateSync } from 'class-validator';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { matchActivityId } from './activities.service';
import { ActivityInviteSnapshotDto, legacyActivityInvitePattern } from './dto/activity-invite.dto';
import type { CreateActivitySignupDto } from './dto/create-activity-signup.dto';
import { ActivitySignup } from './entities/activity-signup.entity';
import { CommissionAmount } from '../invites/entities/commission-amount.entity';
import { Activity } from './entities/activity.entity';
import { isActivityId } from './pipes/activity-id.pipe';

const beijingDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const issuer = 'knowledge-share-activities';
type ActivityTokenPurpose = 'activity-invite' | 'activity-signup-receipt';
interface ActivityClaims {
  activityId: string;
  inviterId?: string;
  signupId?: string;
}

function defaultInviter(sharer: string) {
  return sharer.trim() || '活动主办方';
}

@Injectable()
export class ActivityInviteService {
  private readonly secret: string;

  constructor(
    private readonly database: DataSource,
    config: ConfigService,
  ) {
    this.secret =
      config.get<string>('ACTIVITY_LINK_SECRET') ||
      config.get<string>('AUTH_JWT_SECRET') ||
      randomBytes(32).toString('hex');
  }

  async organizerToken(id: string) {
    const activity = await this.findActivity(this.database.manager, id);
    if (activity.status !== 'not_started') {
      throw new ConflictException('活动不是未开始状态，不能制作海报。');
    }
    return this.sign({ activityId: id }, 'activity-invite');
  }

  async personalToken(input: ActivityInviteSnapshotDto, receiptToken?: string) {
    if (!isActivityId(input.id)) {
      const { id, name, date, sharer, summary = '', price = 0, inviter } = input;
      const fields = [id, name, date, sharer, summary, inviter ?? defaultInviter(sharer), price];
      const token = Buffer.from(JSON.stringify(fields)).toString('base64url');
      if (!legacyActivityInvitePattern.test(token)) {
        throw new BadRequestException('活动信息过长，无法制作二维码。');
      }
      return token;
    }

    const receipt = receiptToken && this.verify(receiptToken, 'activity-signup-receipt');
    if (!receipt || receipt.activityId !== input.id || !receipt.signupId) {
      throw new ForbiddenException('报名凭证无效，请使用本场活动的报名凭证。');
    }

    const activity = await this.findActivity(this.database.manager, receipt.activityId);
    if (activity.status !== 'not_started') {
      throw new ConflictException('活动不是未开始状态，不能制作海报。');
    }
    const inviter = await this.findInviter(
      this.database.manager,
      receipt.activityId,
      receipt.signupId,
    );
    return this.sign({ activityId: receipt.activityId, inviterId: inviter.id }, 'activity-invite');
  }

  async resolve(token: string) {
    if (token.includes('.')) {
      const { activityId, inviterId } = this.readInvite(token);
      const manager = this.database.manager;
      const activity = await this.findActivity(manager, activityId);
      const inviter = inviterId
        ? await this.findInviter(manager, activityId, inviterId)
        : undefined;
      return {
        id: activity.id,
        name: activity.name,
        date: activity.eventDate,
        sharer: activity.sharer,
        summary: activity.summary,
        price: activity.price,
        status: activity.status,
        inviter: inviter?.name ?? null,
        registrationMode: 'live',
      };
    }
    return this.resolveLegacy(token);
  }

  async signup(token: string, { name, phone }: CreateActivitySignupDto) {
    if (!token.includes('.')) {
      throw new BadRequestException('请向邀请人获取新报名链接。');
    }

    const { activityId, inviterId } = this.readInvite(token);
    const id = randomUUID();
    try {
      await this.database.transaction(async (manager) => {
        const activity = await this.findActivity(manager, activityId, true);
        if (inviterId) await this.findInviter(manager, activityId, inviterId, true);
        // Older submissions may have retained the +86 prefix.
        if (
          await manager.existsBy(ActivitySignup, {
            activityId: matchActivityId(activityId),
            phone: `+86${phone}`,
          })
        ) {
          throw new ConflictException('此手机号已报名本场活动。');
        }
        await manager.insert(ActivitySignup, {
          id,
          activityId,
          name,
          phone,
          inviterId: inviterId ?? null,
        });
        if (inviterId) {
          await manager.insert(CommissionAmount, {
            signupId: id,
            baseAmount: activity.price.toFixed(2),
          });
        }
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('此手机号已报名本场活动。');
      }
      throw error;
    }

    return { name, receipt: this.sign({ activityId, signupId: id }, 'activity-signup-receipt') };
  }

  private async findActivity(manager: EntityManager, id: string, lock = false) {
    const activity = await manager.findOne(Activity, {
      where: { id: matchActivityId(id) },
      ...(lock && { lock: { mode: 'pessimistic_read' } }),
    });
    if (!activity) throw new NotFoundException('活动不存在或已下架。');
    return activity;
  }

  private async findInviter(manager: EntityManager, activityId: string, id: string, lock = false) {
    const signup = await manager.findOne(ActivitySignup, {
      where: { id, activityId: matchActivityId(activityId) },
      ...(lock && { lock: { mode: 'pessimistic_read' } }),
    });
    if (!signup) throw new NotFoundException('邀请人未报名本场活动。');
    return signup;
  }

  private sign(claims: ActivityClaims, purpose: ActivityTokenPurpose) {
    return jwt.sign(claims, this.secret, {
      algorithm: 'HS256',
      issuer,
      audience: purpose,
      noTimestamp: true,
    });
  }

  private verify(token: string, purpose: ActivityTokenPurpose): ActivityClaims | undefined {
    try {
      const claims = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer,
        audience: purpose,
      });
      if (
        typeof claims !== 'string' &&
        isActivityId(claims.activityId) &&
        (claims.inviterId === undefined || isUUID(claims.inviterId)) &&
        (claims.signupId === undefined || isUUID(claims.signupId))
      )
        return {
          activityId: claims.activityId,
          inviterId: claims.inviterId,
          signupId: claims.signupId,
        };
    } catch {
      return undefined;
    }
  }

  private readInvite(token: string) {
    const claims = this.verify(token, 'activity-invite');
    if (!claims) throw new NotFoundException('活动链接无效。');
    return claims;
  }

  private resolveLegacy(token: string) {
    if (token === 'signup-preview') {
      const day = new Date(beijingDate.format(new Date()) + 'T00:00:00Z');
      day.setUTCDate(day.getUTCDate() + 2);
      const sharer = '林晓';
      return {
        id: token,
        name: '保研面试与科研经历表达（示例）',
        date: day.toISOString().slice(0, 10),
        sharer,
        status: 'not_started',
        inviter: null,
        summary:
          '本次分享聚焦保研面试中的自我介绍、科研经历讲述和追问应对，结合真实面试题拆解背景、行动与结果的表达结构。',
        registrationMode: 'preview',
      };
    }

    let fields: unknown;
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(
        Buffer.from(token, 'base64url'),
      );
      fields = JSON.parse(decoded);
    } catch {
      throw new NotFoundException('活动链接无效。');
    }
    if (!Array.isArray(fields) || fields.length < 4) {
      throw new NotFoundException('活动链接无效。');
    }

    const [id, name, date, sharer, summary = '', inviter, price = 0] = fields;
    const activity = plainToInstance(ActivityInviteSnapshotDto, {
      id,
      name,
      date,
      sharer,
      summary,
      price,
      inviter,
    });
    if (validateSync(activity).length > 0) throw new NotFoundException('活动链接无效。');

    return {
      id: activity.id,
      name: activity.name,
      date: activity.date,
      sharer: activity.sharer,
      summary: activity.summary ?? '',
      price: activity.price ?? 0,
      status: 'not_started',
      inviter:
        activity.inviter && activity.inviter !== defaultInviter(activity.sharer)
          ? activity.inviter
          : null,
      registrationMode: isActivityId(activity.id) ? 'legacy' : 'preview',
    };
  }
}
