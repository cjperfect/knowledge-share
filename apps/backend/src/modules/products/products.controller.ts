import {
  Body,
  Controller,
  Delete,
  Get,
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
import { blocksToMarkdown } from '../../util/markdown';
import { Result } from '../../util/result';
import { ProductDto } from './dto/product.dto';
import { Product, productThemes } from './entities/product.entity';
import { productView } from './product-view';

@Controller('products')
export class ProductsController {
  constructor(@InjectRepository(Product) private readonly products: Repository<Product>) {}

  @Get()
  async list() {
    const items = await this.products.find({
      order: { updatedAt: 'DESC', id: 'DESC' },
    });
    return Result.ok(items.map(productView));
  }

  @Get(':id')
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException('产品不存在。');
    return Result.ok(productView(product));
  }

  @Post()
  @UseGuards(AuthWriteGuard, SessionGuard)
  async create(@Body() input: ProductDto) {
    const id = randomUUID();
    const theme = productThemes[parseInt(id[0], 16) % productThemes.length];
    const { contentMarkdown, ...fields } = input;
    return Result.ok(
      await this.products.save({
        id,
        theme,
        ...fields,
        contentMarkdown: contentMarkdown?.trim() || blocksToMarkdown(fields.document),
      }),
    );
  }

  @Patch(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() input: ProductDto) {
    return this.products.manager.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('产品不存在。');
      const { contentMarkdown, ...fields } = input;
      return Result.ok(
        await manager.save(Product, {
          ...product,
          ...fields,
          contentMarkdown: contentMarkdown?.trim() || blocksToMarkdown(fields.document),
        }),
      );
    });
  }

  @Delete(':id')
  @UseGuards(AuthWriteGuard, SessionGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.products.delete({ id });
    if (!result.affected) throw new NotFoundException('产品不存在。');
    return Result.ok(null);
  }
}
