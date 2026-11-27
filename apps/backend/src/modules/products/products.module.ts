import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
})
export class ProductsModule {}
