import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { ActivitySignup } from '../../modules/activities/entities/activity-signup.entity';
import { Activity } from '../../modules/activities/entities/activity.entity';
import { AdminInvitation } from '../../modules/auth/entities/admin-invitation.entity';
import { AdminUser } from '../../modules/auth/entities/admin-user.entity';
import { CommissionAmount } from '../../modules/invites/entities/commission-amount.entity';
import { CommissionPayout } from '../../modules/invites/entities/commission-payout.entity';
import { CommissionSetting } from '../../modules/invites/entities/commission-setting.entity';
import { PosterTemplate } from '../../modules/poster-templates/entities/poster-template.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { ContentPush } from '../../modules/pushes/entities/content-push.entity';
import { SnakeNamingStrategy } from './snake-naming.strategy';

// TypeORM CLI 不走 Nest 的 ConfigModule，这里单独加载 .env
loadEnv({ path: ['.env.local', '.env'], quiet: true });

/**
 * TypeORM CLI 专用数据源（migration:generate / run / revert）。
 * 新增实体后需要同步补充到 entities 数组。
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  timezone: '+08:00',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    AdminUser,
    AdminInvitation,
    Activity,
    ActivitySignup,
    CommissionAmount,
    CommissionPayout,
    CommissionSetting,
    Product,
    PosterTemplate,
    ContentPush,
  ],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
  extra: { charset: 'utf8mb4' },
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
