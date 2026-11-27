import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { create } from 'qrcode';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { Result } from '../../util/result';
import { ActivityInviteService } from './activity-invite.service';
import { ActivityInviteQueryDto, ActivityPosterQrDto } from './dto/activity-invite.dto';
import { CreateActivitySignupDto } from './dto/create-activity-signup.dto';
import { ActivityIdPipe } from './pipes/activity-id.pipe';

function buildQr(config: ConfigService, request: Request, token: string) {
  const origin = request.get('origin') ?? `${request.protocol}://${request.get('host')}`;
  const url = URL.parse('/join', config.get<string>('PUBLIC_WEB_URL') || origin);
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new BadRequestException('无法确定活动报名链接的站点地址。');
  }
  url.searchParams.set('activity', token);
  try {
    const qr = create(url.href, { errorCorrectionLevel: 'M' });
    return {
      url: url.href,
      size: qr.modules.size,
      modules: Buffer.from(qr.modules.data).toString('base64'),
    };
  } catch {
    throw new BadRequestException('报名链接过长，无法制作二维码。');
  }
}

@Controller('public/activities')
@UseGuards(AuthWriteGuard)
export class ActivityInviteController {
  constructor(
    private readonly invitations: ActivityInviteService,
    private readonly config: ConfigService,
  ) {}

  @Get('invite')
  async resolveInvite(@Query() { token }: ActivityInviteQueryDto) {
    return Result.ok(await this.invitations.resolve(token));
  }

  @Post('poster-qr')
  @HttpCode(200)
  async generatePersonalQr(@Req() request: Request, @Body() input: ActivityPosterQrDto) {
    const token = await this.invitations.personalToken(input, input.receipt);
    return Result.ok(buildQr(this.config, request, token));
  }

  @Post(':token/signups')
  @Header('Cache-Control', 'no-store')
  async signup(
    @Param() { token }: ActivityInviteQueryDto,
    @Body() signup: CreateActivitySignupDto,
  ) {
    return Result.ok(await this.invitations.signup(token, signup));
  }
}

@Controller('activities')
@UseGuards(AuthWriteGuard, SessionGuard)
export class ActivityOrganizerPosterController {
  constructor(
    private readonly invitations: ActivityInviteService,
    private readonly config: ConfigService,
  ) {}

  @Post(':id/poster-qr')
  @HttpCode(200)
  async generateQr(@Req() request: Request, @Param('id', ActivityIdPipe) id: string) {
    const token = await this.invitations.organizerToken(id);
    return Result.ok(buildQr(this.config, request, token));
  }
}
