import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { AuthModule } from '../auth/auth.module';
import { ContentPush } from './entities/content-push.entity';
import { PushesController } from './pushes.controller';
import { PushesService } from './pushes.service';
import { PushScheduleService } from './push-schedule.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ContentPush, Activity])],
  controllers: [PushesController],
  providers: [PushesService, PushScheduleService],
  exports: [PushesService],
})
export class PushesModule {}
