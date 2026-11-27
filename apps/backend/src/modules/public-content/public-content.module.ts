import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitySignup } from '../activities/entities/activity-signup.entity';
import { Activity } from '../activities/entities/activity.entity';
import { Product } from '../products/entities/product.entity';
import { PublicContentController } from './public-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Activity, ActivitySignup])],
  controllers: [PublicContentController],
})
export class PublicContentModule {}
