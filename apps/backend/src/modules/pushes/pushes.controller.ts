import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { Result } from '../../util/result';
import { closeSse, openSse, sendSse } from '../../util/sse';
import { cleanSummaryDelta } from '../../util/plain-summary';
import { AiService } from '../ai/ai.service';
import { PUSH_BODY_SYSTEM_PROMPT } from '../../prompt/push-body';
import { PUSH_SUMMARY_SYSTEM_PROMPT } from '../../prompt/push-summary';
import { OptimizePushBodyDto, OptimizePushSummaryDto, PushDto, PushListDto } from './dto/push.dto';
import {
  buildPushBodyPrompt,
  buildPushSummaryPrompt,
  generatePushBody,
  generatePushSummary,
} from './push-optimize';
import { PushesService } from './pushes.service';

@Controller('pushes')
@UseGuards(AuthWriteGuard, SessionGuard)
export class PushesController {
  constructor(
    private readonly pushes: PushesService,
    private readonly ai: AiService,
  ) {}

  @Get()
  async list(@Query() filters: PushListDto) {
    return Result.ok(await this.pushes.list(filters));
  }

  @Get(':id')
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    return Result.ok(await this.pushes.detail(id));
  }

  @Post()
  async create(@Body() input: PushDto) {
    return Result.ok(await this.pushes.create(input));
  }

  @Post('optimize-summary/stream')
  @HttpCode(200)
  async optimizeSummaryStream(@Body() input: OptimizePushSummaryDto, @Res() res: Response) {
    openSse(res);
    try {
      for await (const delta of this.ai.streamChat(buildPushSummaryPrompt(input), {
        system: PUSH_SUMMARY_SYSTEM_PROMPT,
        temperature: 0.45,
        maxTokens: 300,
        fallback: () => generatePushSummary(input),
      })) {
        if (res.destroyed || res.writableEnded) break;
        const text = cleanSummaryDelta(delta);
        if (text) sendSse(res, { delta: text });
      }
    } catch (error) {
      sendSse(res, {
        error: error instanceof Error ? error.message : 'AI 优化失败，请稍后重试。',
      });
    } finally {
      closeSse(res);
    }
  }

  @Post('optimize-body/stream')
  @HttpCode(200)
  async optimizeBodyStream(@Body() input: OptimizePushBodyDto, @Res() res: Response) {
    openSse(res);
    try {
      for await (const delta of this.ai.streamChat(buildPushBodyPrompt(input), {
        system: PUSH_BODY_SYSTEM_PROMPT,
        temperature: 0.5,
        maxTokens: 1600,
        fallback: () => generatePushBody(input),
      })) {
        if (res.destroyed || res.writableEnded) break;
        sendSse(res, { delta });
      }
    } catch (error) {
      sendSse(res, {
        error: error instanceof Error ? error.message : 'AI 优化失败，请稍后重试。',
      });
    } finally {
      closeSse(res);
    }
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() input: PushDto) {
    return Result.ok(await this.pushes.update(id, input));
  }

  @Post(':id/retry')
  @HttpCode(200)
  async retry(@Param('id', ParseUUIDPipe) id: string) {
    return Result.ok(await this.pushes.retry(id));
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.pushes.remove(id);
    return Result.ok(null);
  }
}
