import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ActivityInviteService } from './activity-invite.service';
import {
  ActivityInviteController,
  ActivityOrganizerPosterController,
} from './activity-invite.controller';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivitySignup } from './entities/activity-signup.entity';
import { Activity } from './entities/activity.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Activity, ActivitySignup])],
  controllers: [ActivitiesController, ActivityInviteController, ActivityOrganizerPosterController],
  providers: [ActivitiesService, ActivityInviteService],
})
export class ActivitiesModule {}
