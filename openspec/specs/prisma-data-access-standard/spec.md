## Purpose

定义以 Prisma 为唯一 ORM、以 migration 管理 schema 变更以及多步写入事务化要求。

## Requirements

### Requirement: Data persistence SHALL use Prisma as the sole ORM
系统 MUST 将结构化数据访问统一通过 Prisma Client 完成，不得在常规业务路径中混用其他 ORM。

#### Scenario: New repository method is implemented
- **WHEN** 开发者为新业务实现数据访问逻辑
- **THEN** 数据读写通过 Prisma Client 执行并遵循统一数据层约定

### Requirement: Schema changes SHALL be managed by Prisma migrations
系统 MUST 通过 Prisma migration 管理数据库结构变更，确保变更可审计、可重放、可回滚。

#### Scenario: Database schema requires a new field
- **WHEN** 业务需求触发表结构更新
- **THEN** 变更以 Prisma migration 形式提交并可在环境中一致执行

### Requirement: Multi-step writes SHALL use explicit transactions
系统 MUST 对跨表或多步骤写操作使用 Prisma 事务接口，避免部分成功导致数据不一致。

#### Scenario: Business operation writes multiple related records
- **WHEN** 单个业务动作需要更新多张关联表
- **THEN** 系统在同一事务中执行写入并在失败时整体回滚
