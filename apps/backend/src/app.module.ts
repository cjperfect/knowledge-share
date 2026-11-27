import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './infra/database/database.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';
import { InvitesModule } from './modules/invites/invites.module';
import { ProductsModule } from './modules/products/products.module';
import { PosterTemplatesModule } from './modules/poster-templates/poster-templates.module';
import { PushesModule } from './modules/pushes/pushes.module';
import { PublicContentModule } from './modules/public-content/public-content.module';
import { UploadsModule } from './modules/uploads/uploads.module';

/**
 * 根模块：装配配置、数据库、健康检查与首页模块。统一响应用 Result 显式返回。
 * 后续按页面/业务域新建 modules/<domain> 后追加到 imports。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AiModule,
    AuthModule,
    ActivitiesModule,
    HealthModule,
    HomeModule,
    InvitesModule,
    ProductsModule,
    PosterTemplatesModule,
    PushesModule,
    PublicContentModule,
    UploadsModule,
  ],
})
export class AppModule {}
