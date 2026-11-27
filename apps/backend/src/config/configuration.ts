export type NodeEnv = 'development' | 'test' | 'production';

export interface AppRuntimeConfig {
  nodeEnv: NodeEnv;
  port: number;
  /** 允许的跨域来源，留空表示不做限制 */
  corsOrigins: string[];
}

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  /** 仅在非生产环境生效，生产必须走 migration */
  synchronize: boolean;
  logging: boolean;
}

export interface AiConfig {
  /** OpenAI 兼容接口的基址，例如 https://api.openai.com/v1 */
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  /** 关闭深度思考，避免推理 token 挤占正文输出 */
  disableThinking: boolean;
}

export interface StorageConfig {
  /** 本地磁盘或华为云 OBS，部署时通过 IMAGE_STORAGE 切换。 */
  driver: 'local' | 'obs';
  obs: {
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    /** 可选：CDN 或自定义公开访问域名。 */
    publicBaseUrl: string;
  };
}

export interface RedisConfig {
  /** 留空表示不启用 Redis 队列，定时推送退回每分钟扫表。 */
  url: string;
  /** 多环境共用一个 Redis 时用前缀隔离 BullMQ key。 */
  prefix: string;
}

export interface Configuration {
  app: AppRuntimeConfig;
  database: DatabaseConfig;
  ai: AiConfig;
  storage: StorageConfig;
  redis: RedisConfig;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 强类型配置工厂。
 * 布尔值统一在这里转换，避免 ConfigService 拿到字符串 'false' 造成的误判。
 */
export default function configuration(): Configuration {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnv;

  return {
    app: {
      nodeEnv,
      port: toNumber(process.env.PORT, 3001),
      corsOrigins: toList(process.env.CORS_ORIGIN),
    },
    database: {
      url: (process.env.DATABASE_URL ?? '').trim(),
      ssl: toBoolean(process.env.DATABASE_SSL, false),
      synchronize: toBoolean(process.env.DATABASE_SYNCHRONIZE, false),
      logging: toBoolean(process.env.DATABASE_LOGGING, false),
    },
    ai: {
      baseUrl: (process.env.AI_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3').trim(),
      apiKey: (process.env.AI_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? '').trim(),
      model: (process.env.AI_MODEL ?? 'doubao-seed-2-1-lite-260915').trim(),
      timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 60_000),
      disableThinking: toBoolean(process.env.AI_DISABLE_THINKING, true),
    },
    storage: {
      driver: process.env.IMAGE_STORAGE === 'obs' ? 'obs' : 'local',
      obs: {
        endpoint: (process.env.OBS_ENDPOINT ?? '').trim(),
        bucket: (process.env.OBS_BUCKET ?? '').trim(),
        accessKeyId: (process.env.OBS_ACCESS_KEY_ID ?? '').trim(),
        secretAccessKey: (process.env.OBS_SECRET_ACCESS_KEY ?? '').trim(),
        publicBaseUrl: (process.env.OBS_PUBLIC_BASE_URL ?? '').trim(),
      },
    },
    redis: {
      url: (process.env.REDIS_URL ?? '').trim(),
      prefix: (process.env.REDIS_PREFIX ?? 'knowledge-share').trim(),
    },
  };
}
