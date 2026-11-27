import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CommissionAmount } from './entities/commission-amount.entity';
import { CommissionPayout } from './entities/commission-payout.entity';
import { CommissionSetting } from './entities/commission-setting.entity';
import { InvitesController } from './invites.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([CommissionAmount, CommissionPayout, CommissionSetting]),
  ],
  controllers: [InvitesController],
})
export class InvitesModule {}
