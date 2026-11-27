# Knowledge Share 后端服务

`apps/backend` 是基于 NestJS 的后端骨架。当前提供数据库连接、健康检查、管理端账号与邀请注册、首页 Mock 接口，以及 `common/result.ts` 统一成功响应。完整拆分、认证方案与接口契约见 [`docs/后端设计.md`](../../docs/后端设计.md)。

## 技术栈

| 能力          | 选型                                           |
| ------------- | ---------------------------------------------- |
| 运行时 / 框架 | Node.js 22 + NestJS 12（Express 5）            |
| 语言          | TypeScript 6（CommonJS 编译）                  |
| 数据库        | MySQL 8.4 + TypeORM 1.x（驱动 mysql2）         |
| 参数校验      | class-validator / class-transformer            |
| 测试 / 规范   | Vitest + ESLint + Prettier（配置在仓库根目录） |

## 目录结构

```
apps/backend/
├── src/
│   ├── main.ts                     # 入口：前缀、CORS、Helmet、校验管道、进程级兜底
│   ├── app.module.ts               # 根模块：配置 + 数据库 + 健康检查/首页模块
│   ├── common/
│   │   ├── api-response.ts         # 统一响应类型与成功码（code=200 / msg=success）
│   │   └── result.ts               # Result.ok() / Result.fail()，显式返回统一结构
│   ├── config/
│   │   ├── configuration.ts        # 强类型配置工厂（布尔/数字转换集中处理）
│   │   └── env.validation.ts       # Joi 启动校验
│   ├── infra/
│   │   └── database/
│   │       ├── database.module.ts  # TypeORM 连接配置
│   │       ├── data-source.ts      # TypeORM CLI 专用数据源
│   │       ├── snake-naming.strategy.ts
│   │       └── migrations/
│   └── modules/
│       ├── health/                 # 存活 / 就绪探针
│       └── home/                   # 首页数据看板（首版 Mock）
│           ├── dto/home-overview.dto.ts
│           ├── home.controller.ts
│           ├── home.module.ts
│           └── home.service.ts
├── nest-cli.json
├── .env / .env.example
└── vitest.config.ts
```

后续新增模块统一放在 `src/modules/<domain>/`，按 `controller → service → entity/dto` 划分。

## 快速开始

```bash
# 1. 安装依赖（仓库根目录，pnpm workspace）
pnpm install

# 2. 启动本地 MySQL（仓库根目录，容器 knowledge-share-mysql）
docker-compose up -d

# 3. 环境变量
cp .env.example .env     # 已有 .env 可跳过

# 4. 在 apps/backend 迁移数据库并启动
pnpm migration:run
pnpm dev
```

- 接口地址：`http://localhost:3001`（不带全局前缀，路由直接挂根路径）
- 健康检查：`http://localhost:3001/health`、`/health/live`
- 首页看板：`http://localhost:3001/home/overview`（需登录，可选 `?activityId=xxx` 按活动过滤）

常用脚本：

| 命令                                                                                       | 说明                                      |
| ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `pnpm dev`                                                                                 | watch 模式启动                            |
| `pnpm build` / `pnpm start:prod`                                                           | 编译 / 运行编译产物（`dist/main.js`）     |
| `pnpm typecheck`                                                                           | 仅做类型检查                              |
| `pnpm lint` / `pnpm format`                                                                | 在**仓库根目录**执行（ESLint / Prettier） |
| `pnpm test` / `pnpm test:e2e`                                                              | 单元测试 / e2e（需数据库）                |
| `pnpm migration:generate <路径>` / `migration:run` / `migration:revert` / `migration:show` | 迁移工作流                                |

## 环境变量

| 变量                   | 必填   | 默认          | 说明                                              |
| ---------------------- | ------ | ------------- | ------------------------------------------------- |
| `NODE_ENV`             | 否     | `development` | 生产环境会强制关闭 `synchronize`                  |
| `PORT`                 | 否     | `3001`        | 服务端口                                          |
| `DATABASE_URL`         | **是** | —             | MySQL 连接串（`mysql://...`），缺失会直接拒绝启动 |
| `DATABASE_SSL`         | 否     | `false`       | 托管数据库通常需要开启                            |
| `DATABASE_SYNCHRONIZE` | 否     | `false`       | 本地可开自动建表；生产必须走迁移                  |
| `DATABASE_LOGGING`     | 否     | `false`       | 打印 SQL                                          |
| `CORS_ORIGIN`          | 否     | 空            | 允许的前端来源，逗号分隔；空表示不限制            |

## 管理端账号

- 本地空库首次启动自动创建超级管理员 `admin`，默认密码为 `admin`。生产空库首次启动必须通过 `AUTH_BOOTSTRAP_PASSWORD` 设置 12–64 字符的密码。已有账号的密码保持原值。
- 登录返回有效期 24 小时的 JWT。管理端用 Bearer 请求头发送，退出时清除本地授权信息。停用期间拒绝该账号的请求，重新启用后，仍在有效期内的 JWT 恢复有效。
- 生产必填 `AUTH_JWT_SECRET`，使用至少 32 字符的随机密钥。本地留空会在每次后端启动时生成新密钥，重启后需要重新登录。
- 超级管理员可进入「系统管理 → 用户管理」生成邀请链接，有效期 24 小时，每条链接仅能成功注册一次。受邀账号注册后为普通管理员。
- Vite 开发和预览代理把 Web 的 `/api/*` 转发到后端根路由。部署时在 Web 同源的反向代理中配置相同的路径转发，并设置 `CORS_ORIGIN` 为 Web 的 HTTPS 来源。

## 运行约定

- 不设置全局前缀，路由直接挂在根路径；资源型路径用复数，看板类聚合接口用 `home/overview` 这种名词子路径。
- `ValidationPipe` 已全局开启 `whitelist` + `transform`，DTO 用 class-validator 装饰器即可；`forbidNonWhitelisted` 会拒绝未声明的字段。
- **统一响应（显式 Result，不用拦截器）**：控制器签名写 `ApiResponse<T>`，返回值用 `Result.ok(data)` / `Result.ok(data, '已创建')` / `Result.fail(40001, 'name不能为空')`，最终结构固定为 `{ code, msg, data }`。显式返回的好处是类型、单测都看得到真实结构，不依赖全局隐式包装，异步/非 HTTP 场景也能复用同一套结果类型。

  ```ts
  @Get('overview')
  getOverview(@Query() query: HomeOverviewQueryDto): ApiResponse<HomeOverviewDto> {
    return Result.ok(this.homeService.getOverview(query));
  }
  ```

- **异常仍是 Nest 默认格式**（`{ statusCode, message, error }`），异常过滤器尚未补；补的时候在 `common/` 下新增 filter，按页面逐步补 `ErrorCode`（校验 40001、未登录 40100 等），控制器内部的预期失败则直接用 `Result.fail()`。
- 项目不接入 Swagger，接口契约以 `ApiResponse<T>` + DTO 类型为准；需要调试时直接看 controller 的返回类型或用 `curl`。
- 进程级兜底：`unhandledRejection` 记 error 日志；`uncaughtException` 记 fatal 后退出，交由编排层重启。

## 数据库约定

- 表名、列名统一 snake_case（`SnakeNamingStrategy`），实体属性保持 camelCase。
- 时间列使用 `datetime`（毫秒精度按需用 `datetime(3)`）；服务端时区由 compose 固定为 `+08:00`，与看板的北京时间统计口径一致。
- 枚举列建议用 `varchar` 存储（TS 枚举约束取值），避免 MySQL enum 类型变更时的 DDL 成本。
- 本地开发可开 `DATABASE_SYNCHRONIZE=true` 快速建表；**生产必须关闭并使用迁移**：

```bash
pnpm migration:generate src/infra/database/migrations/InitSchema
pnpm migration:run
```

新增实体时，除了模块内 `TypeOrmModule.forFeature([Entity])`，还要把实体加入 `src/infra/database/data-source.ts` 的 `entities` 数组（CLI 不走 Nest 的自动加载）。

## 新增业务模块

```bash
pnpm nest g module modules/activities
pnpm nest g controller modules/activities --no-spec
pnpm nest g service modules/activities --no-spec
```

然后：建实体（在模块内定义，公共基类按需补）→ `forFeature` 注册 → 在 `app.module.ts` 的 `imports` 注册新模块 → Controller 里写路由。列表 DTO、分页、权限等通用能力，等实际上有页面需要时再补，避免空转。

## 测试与质量

- 单元测试放在源码旁（`*.spec.ts`），`pnpm test` 默认不依赖数据库；健康检查有 mock 数据源的用例，`Result` 有 ok/自定义文案/空值/fail 四个用例。
- `pnpm lint` 与 `pnpm format` 已上移到仓库根目录（根 `eslint.config.mjs`：后端段用 Node 环境，关闭 `consistent-type-imports` 以保留装饰器元数据；根 `.prettierrc` 对后端使用分号、100 列）。
- 提交前建议在根目录执行：`pnpm typecheck && pnpm lint && pnpm test`。

## 下一步（按页面补）

1. 异常捕获与错误码（统一失败结构、校验文案中文化）。
2. 首页看板 Mock 换真实统计，活动、报名/签到、分享归因、内容推送等业务模块。
3. 缓存、审计日志等横切能力。
