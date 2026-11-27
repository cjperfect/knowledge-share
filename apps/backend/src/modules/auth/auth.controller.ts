import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Result } from '../../util/result';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { LoginThrottle } from '../../common/guards/login-throttle.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { AuthService, sessionName } from './auth.service';

@Controller('auth')
@UseGuards(AuthWriteGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(LoginThrottle)
  async login(@Body() body: LoginDto) {
    const { token, user } = await this.auth.login(body);
    return Result.ok({ ...user, token });
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(sessionName, { path: '/' });
    return Result.ok(null);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return Result.ok(await this.auth.register(body));
  }
}

@Controller('admin')
@UseGuards(AuthWriteGuard, SessionGuard, SuperAdminGuard)
export class AdminUsersController {
  constructor(private readonly auth: AuthService) {}

  @Get('users')
  @Header('Cache-Control', 'no-store')
  async list() {
    return Result.ok(await this.auth.listUsers());
  }

  @Patch('users/:id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateAdminStatusDto) {
    await this.auth.updateStatus(id, body.status);
    return Result.ok(null);
  }

  @Post('invitations')
  @Header('Cache-Control', 'no-store')
  async createInvitation() {
    return Result.ok(await this.auth.createInvitation());
  }
}
