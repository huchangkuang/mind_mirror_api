## Why

`mind_mirror` 项目中的后端代码当前与 `mind_mirror_api` 目标仓库分离，导致接口实现、鉴权方式、参数校验和返回格式缺乏统一约束，增加了协作和维护成本。现在需要将后端能力抽离并收敛到本仓库，同时建立统一 API 规范，确保后续迭代的一致性与可治理性。

## What Changes

- 将同级 `mind_mirror` 项目中的后端代码按领域拆分并迁移到当前 `mind_mirror_api` 仓库，清理与前端耦合实现。
- 基于 NestJS 重构后端应用基础骨架（模块、控制器、服务、拦截器、过滤器、守卫）。
- 统一输入校验方案为 `class-validator + class-transformer`，并在全局管道中强制启用。
- 统一鉴权方案为 JWT Access Token + Refresh Token，定义登录、刷新、注销与令牌失效策略。
- 统一接口返回结构为 `code/message/data`，所有控制器通过统一响应层输出。
- 建立全局错误码枚举体系，覆盖认证、参数、资源、业务、系统等错误场景。
- 统一版本策略为 `/api/v1`，并定义后续版本扩展约束。
- 统一 ORM 为 Prisma，明确 schema、迁移与 repository/service 访问边界。

## Capabilities

### New Capabilities
- `backend-extraction-migration`: 后端代码从 `mind_mirror` 到 `mind_mirror_api` 的抽离、重组与模块化迁移规范。
- `api-foundation-standard`: NestJS API 基础规范，包括版本前缀、统一响应结构与全局异常处理。
- `request-validation-standard`: 基于 class-validator/class-transformer 的 DTO 校验与转换规范。
- `jwt-auth-refresh-token`: 基于 JWT + Refresh Token 的认证授权流程与安全约束。
- `error-code-enum-standard`: 全局错误码枚举设计、分段规则与错误响应映射规范。
- `prisma-data-access-standard`: Prisma 数据访问层规范，包括 schema、迁移与事务使用约束。

### Modified Capabilities
- 无

## Impact

- 受影响代码：后端入口、认证模块、用户模块、通用中间件/拦截器/过滤器、数据访问层。
- 受影响 API：所有现有与迁移后的接口将统一到 `/api/v1`，并按 `code/message/data` 返回。
- 依赖与基础设施：引入或收敛 NestJS、Prisma、class-validator、class-transformer、JWT 相关依赖及配置。
- 工程流程：新增统一错误码与 API 规范文档，作为开发与联调的基线约束。
