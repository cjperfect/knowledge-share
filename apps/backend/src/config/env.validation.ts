import Joi from 'joi';

/**
 * 环境变量启动校验：缺关键项直接拒绝启动，避免运行到一半才发现配置错误。
 * 数值/布尔等类型转换在 configuration.ts 中完成。
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['mysql'] })
    .required()
    .messages({ 'any.required': 'DATABASE_URL 未配置，请参考 .env.example' }),
  DATABASE_SSL: Joi.string().allow('').default('false'),
  DATABASE_SYNCHRONIZE: Joi.string().allow('').default('false'),
  DATABASE_LOGGING: Joi.string().allow('').default('false'),

  AI_BASE_URL: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .default('https://ark.cn-beijing.volces.com/api/v3'),
  DEEPSEEK_API_KEY: Joi.string().trim().allow(''),
  AI_API_KEY: Joi.string().trim().allow(''),
  AI_MODEL: Joi.string().trim().max(120).default('doubao-seed-2-1-lite-260915'),
  AI_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(60000),
  AI_DISABLE_THINKING: Joi.string().allow('').default('true'),

  AUTH_JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().trim().min(32).required(),
    otherwise: Joi.string().trim().min(32).allow(''),
  }),
  ACTIVITY_LINK_SECRET: Joi.string().trim().min(32).allow(''),
  AUTH_BOOTSTRAP_PASSWORD: Joi.string().max(64).allow(''),
  CORS_ORIGIN: Joi.string().allow('').default(''),
  IMAGE_STORAGE: Joi.string().valid('local', 'obs').default('local'),
  OBS_ENDPOINT: Joi.string().trim().allow(''),
  OBS_BUCKET: Joi.string().trim().allow(''),
  OBS_ACCESS_KEY_ID: Joi.string().trim().allow(''),
  OBS_SECRET_ACCESS_KEY: Joi.string().trim().allow(''),
  OBS_PUBLIC_BASE_URL: Joi.string().trim().allow(''),
  REDIS_URL: Joi.string()
    .trim()
    .uri({ scheme: ['redis', 'rediss'] })
    .allow('')
    .default(''),
  REDIS_PREFIX: Joi.string().trim().max(80).default('knowledge-share'),
  PUBLIC_WEB_URL: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .allow(''),
}).unknown(true);
