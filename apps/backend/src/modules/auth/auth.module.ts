import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController, AuthController } from './auth.controller';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { LoginThrottle } from '../../common/guards/login-throttle.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminInvitation } from './entities/admin-invitation.entity';
import { AdminUser } from './entities/admin-user.entity';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, AdminInvitation])],
  controllers: [AuthController, AdminUsersController],
  providers: [AuthService, AuthWriteGuard, LoginThrottle, SessionGuard, SuperAdminGuard],
  exports: [AuthService, AuthWriteGuard, SessionGuard],
})
export class AuthModule {}
