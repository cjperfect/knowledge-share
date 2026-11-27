import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import type { AdminRequest } from '../../interface/auth';
import { Result } from '../../util/result';
import { closeSse, openSse, sendSse } from '../../util/sse';
import { cleanSummaryDelta } from '../../util/plain-summary';
import { AiService } from '../ai/ai.service';
import { ACTIVITY_REVIEW_SYSTEM_PROMPT } from '../../prompt/activity-review';
import { ACTIVITY_SUMMARY_SYSTEM_PROMPT } from '../../prompt/activity-summary';
import { buildActivityReviewPrompt, generateActivityReview } from './activity-review';
import { buildActivitySummaryPrompt, generateActivitySummary } from './activity-summary';
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  GenerateActivityReviewDto,
  GenerateActivitySummaryDto,
  UpdateActivityDto,
} from './dto/activity-input.dto';
import { ActivityDetailQueryDto, ActivityQueryDto } from './dto/activity-query.dto';
import { ActivityIdPipe } from './pipes/activity-id.pipe';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly ai: AiService,
  ) {}

  @Get()
  async list(@Query() query: ActivityQueryDto) {
    return Result.ok(await this.activities.list(query));
  }

  @Get(':id')
  async detail(@Param('id', ActivityIdPipe) id: string, @Query() query: ActivityDetailQueryDto) {
    return Result.ok(await this.activities.detail(id, query.status));
  }

  @Post()
  @UseGuards(AuthWriteGuard, SessionGuard)
  async create(@Body() body: CreateActivityDto, @Req() request: AdminRequest) {
    return Result.ok(await this.activities.create(body, request.admin!.id));
  }

  @Post('generate-summary/stream')
  @HttpCode(200)
  @UseGuards(AuthWriteGuard, SessionGuard)
  async generateSummaryStream(@Body() input: GenerateActivitySummaryDto, @Res() res: Response) {
    openSse(res);
    try {
      for await (const delta of this.ai.streamChat(buildActivitySummaryPrompt(input), {
        system: ACTIVITY_SUMMARY_SYSTEM_PROMPT,
        temperature: 0.5,
        maxTokens: 300,
        fallback: () => generateActivitySummary(input),
      })) {
        if (res.destroyed || res.writableEnded) break;
        const text = cleanSummaryDelta(delta);
        if (text) sendSse(res, { delta: text });
      }
    } catch (error) {
      sendSse(res, {
        error: error instanceof Error ? error.message : 'AI 生成失败，请稍后重试。',
      });
    } finally {
      closeSse(res);
    }
  }

  @Post('generate-review/stream')
  @HttpCode(200)
  @UseGuards(AuthWriteGuard, SessionGuard)
  async generateReviewStream(@Body() input: GenerateActivityReviewDto, @Res() res: Response) {
    openSse(res);
    try {
      for await (const delta of this.ai.streamChat(buildActivityReviewPrompt(input), {
        system: ACTIVITY_REVIEW_SYSTEM_PROMPT,
        temperature: 0.5,
        maxTokens: 1600,
        fallback: () => generateActivityReview(input),
      })) {
        if (res.destroyed || res.writableEnded) break;
        sendSse(res, { delta });
      }
    } catch (error) {
      sendSse(res, {
        error: error instanceof Error ? error.message : 'AI 生成失败，请稍后重试。',
      });
    } finally {
      closeSse(res);
    }
  }

  @Patch(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async update(@Param('id', ActivityIdPipe) id: string, @Body() body: UpdateActivityDto) {
    return Result.ok(await this.activities.update(id, body));
  }

  @Delete(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async remove(@Param('id', ActivityIdPipe) id: string) {
    await this.activities.remove(id);
    return Result.ok(null);
  }
}
