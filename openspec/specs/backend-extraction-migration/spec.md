## Purpose

规定将 mind_mirror 后端按领域迁移至 mind_mirror_api 的边界约束与对外可观测行为一致性。

## Requirements

### Requirement: Backend code SHALL be migrated by domain boundaries
系统 MUST 将 `mind_mirror` 后端能力按领域模块迁移到 `mind_mirror_api`，并保持模块内聚、跨模块依赖单向可追踪。

#### Scenario: Domain-first migration plan is executed
- **WHEN** 开始迁移后端代码
- **THEN** 每个业务域在独立 Nest 模块中落地，且不再依赖前端工程目录结构

### Requirement: Migration SHALL preserve externally observable behavior
系统 MUST 在迁移后保持核心业务接口语义一致；如存在行为变化，必须在规范中明确标注并提供兼容策略。

#### Scenario: Existing endpoint behavior is validated after migration
- **WHEN** 对核心接口执行迁移前后对比测试
- **THEN** 返回语义与核心业务结果保持一致，差异项具备记录与说明
