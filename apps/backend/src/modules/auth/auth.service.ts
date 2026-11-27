import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  type OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { DataSource, QueryFailedError } from 'typeorm';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { AdminInvitation } from './entities/admin-invitation.entity';
import type { AdminSession, AdminStatus } from '../../interface/auth';
import { AdminUser } from './entities/admin-user.entity';
import { hashPassword, verifyPassword } from './password';

export const sessionName = 'ks_session';
export const sessionSeconds = 24 * 60 * 60;
const tokenIssuer = 'knowledge-share-admin';
const inviteSeconds = 24 * 60 * 60;

const epochSeconds = () => Math.floor(Date.now() / 1000);
const newToken = () => randomBytes(32).toString('hex');
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function isDuplicate(error: unknown): boolean {
  return error instanceof QueryFailedError && error.driverError.code === 'ER_DUP_ENTRY';
}

function accountView(user: AdminUser): AdminSession {
  return { id: user.id, username: user.username, role: user.role };
}

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly jwtSecret: string;

  constructor(
    private readonly database: DataSource,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = config.get<string>('AUTH_JWT_SECRET') || newToken();
  }

  async onApplicationBootstrap() {
    const users = this.database.getRepository(AdminUser);
    if (await users.existsBy({ role: 'super_admin' })) return;

    const password = this.config.get<string>('AUTH_BOOTSTRAP_PASSWORD') || 'admin';
    if (this.config.get('app.nodeEnv') === 'production' && password.length < 12) {
      throw new Error('首次生产启动需要配置至少 12 字符的 AUTH_BOOTSTRAP_PASSWORD。');
    }

    try {
      await users.insert({
        id: randomUUID(),
        username: 'admin',
        passwordHash: await hashPassword(password),
        role: 'super_admin',
      });
    } catch (error) {
      if (!isDuplicate(error) || !(await users.existsBy({ role: 'super_admin' }))) throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.database
      .getRepository(AdminUser)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username: input.username })
      .getOne();
    const valid = await verifyPassword(input.password, user?.passwordHash);
    if (!valid || user?.status !== 'active') {
      throw new UnauthorizedException('用户名或密码错误。');
    }

    const issuedAt = epochSeconds();
    const token = jwt.sign({ iat: issuedAt }, this.jwtSecret, {
      algorithm: 'HS256',
      issuer: tokenIssuer,
      subject: user.id,
      expiresIn: sessionSeconds,
    });
    return { token, user: { ...accountView(user), expiresAt: (issuedAt + sessionSeconds) * 1000 } };
  }

  async currentUser(token?: string) {
    if (!token) throw new UnauthorizedException('请先登录。');
    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
        issuer: tokenIssuer,
      });
    } catch {
      throw new UnauthorizedException('请先登录。');
    }
    if (typeof payload === 'string' || !payload.sub || typeof payload.exp !== 'number') {
      throw new UnauthorizedException('请先登录。');
    }

    const user = await this.database.getRepository(AdminUser).findOneBy({
      id: payload.sub,
      status: 'active',
    });
    if (!user) throw new UnauthorizedException('请先登录。');
    return accountView(user);
  }

  async createInvitation() {
    const token = newToken();
    const expiresAt = epochSeconds() + inviteSeconds;
    await this.database
      .getRepository(AdminInvitation)
      .insert({ tokenHash: tokenHash(token), expiresAt });
    return { token, expiresAt: new Date(expiresAt * 1000).toISOString() };
  }

  async register(input: RegisterDto) {
    const hash = tokenHash(input.token);
    const available = await this.database
      .getRepository(AdminInvitation)
      .findOneBy({ tokenHash: hash });
    if (!available || available.usedAt !== null || available.expiresAt <= epochSeconds()) {
      throw new GoneException('邀请链接已失效或已使用。');
    }

    const passwordHash = await hashPassword(input.password);
    try {
      return await this.database.transaction(async (manager) => {
        const invite = await manager.findOne(AdminInvitation, {
          where: { tokenHash: hash },
          lock: { mode: 'pessimistic_write' },
        });
        const now = epochSeconds();
        if (!invite || invite.usedAt !== null || invite.expiresAt <= now) {
          throw new GoneException('邀请链接已失效或已使用。');
        }
        const users = manager.getRepository(AdminUser);
        const user = users.create({
          id: randomUUID(),
          username: input.username,
          passwordHash,
          role: 'admin',
        });
        await users.insert(user);
        await manager.update(AdminInvitation, { tokenHash: hash }, { usedAt: now });
        return accountView(user);
      });
    } catch (error) {
      if (isDuplicate(error)) throw new ConflictException('用户名已存在。');
      throw error;
    }
  }

  async listUsers() {
    const users = await this.database.getRepository(AdminUser).find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return users.map((user) => ({ ...accountView(user), status: user.status }));
  }

  async updateStatus(id: string, status: AdminStatus) {
    await this.database.transaction(async (manager) => {
      const user = await manager.findOne(AdminUser, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('账号不存在。');
      if (user.role === 'super_admin') throw new ForbiddenException('超级管理员状态不可修改。');
      await manager.update(AdminUser, { id }, { status });
    });
  }
}
