import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { Result } from '../../util/result';
import { PosterTemplateDto } from './dto/poster-template.dto';
import { PosterTemplate } from './entities/poster-template.entity';
import { posterTemplateView } from './poster-template-view';

@Controller('poster-templates')
export class PosterTemplatesController {
  constructor(
    @InjectRepository(PosterTemplate)
    private readonly templates: Repository<PosterTemplate>,
  ) {}

  /** 海报制作读取当前启用模板；未启用时返回 null，前端使用内置默认样式。 */
  @Get('active')
  @Header('Cache-Control', 'no-store')
  async active() {
    const template = await this.templates.findOne({
      where: { enabled: true },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });
    return Result.ok(template ? posterTemplateView(template) : null);
  }

  @Get()
  @UseGuards(SessionGuard)
  async list() {
    const items = await this.templates
      .createQueryBuilder('template')
      .orderBy('template.enabled', 'DESC')
      .addOrderBy('template.updatedAt', 'DESC')
      .addOrderBy('template.id', 'DESC')
      .getMany();
    return Result.ok(items.map(posterTemplateView));
  }

  @Post()
  @UseGuards(AuthWriteGuard, SessionGuard)
  async create(@Body() input: PosterTemplateDto) {
    const template = await this.templates.save({
      id: randomUUID(),
      ...input,
      enabled: false,
      enabledKey: null,
    });
    return Result.ok(posterTemplateView(template));
  }

  @Patch(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() input: PosterTemplateDto) {
    const template = await this.templates.findOneBy({ id });
    if (!template) throw new NotFoundException('海报模板不存在。');
    const saved = await this.templates.save({ ...template, ...input });
    return Result.ok(posterTemplateView(saved));
  }

  /** 启用模板时在同一事务里停用其他模板，保证始终只有一张生效。 */
  @Post(':id/enable')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async enable(@Param('id', ParseUUIDPipe) id: string) {
    return this.templates.manager.transaction(async (manager) => {
      // 锁住整张模板表，避免并发启用时出现两张同时生效。
      const templates = await manager.find(PosterTemplate, {
        lock: { mode: 'pessimistic_write' },
      });
      const template = templates.find((item) => item.id === id);
      if (!template) throw new NotFoundException('海报模板不存在。');
      await manager
        .createQueryBuilder()
        .update(PosterTemplate)
        .set({ enabled: false, enabledKey: null })
        .where('enabled = :enabled', { enabled: true })
        .execute();
      await manager.update(PosterTemplate, { id }, { enabled: true, enabledKey: 1 });
      return Result.ok(posterTemplateView({ ...template, enabled: true }));
    });
  }

  @Delete(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.templates.delete({ id });
    if (!result.affected) throw new NotFoundException('海报模板不存在。');
    return Result.ok(null);
  }
}
