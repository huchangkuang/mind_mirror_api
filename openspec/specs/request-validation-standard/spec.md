## Purpose

定义基于 class-validator / class-transformer 的请求校验、类型转换与全局校验管道策略。

## Requirements

### Requirement: Request DTO validation SHALL use class-validator
系统 MUST 使用 `class-validator` 注解定义请求 DTO 校验规则，且所有写操作接口必须绑定 DTO。

#### Scenario: Request payload violates DTO constraints
- **WHEN** 客户端提交不满足 DTO 约束的参数
- **THEN** 接口返回参数错误码并包含可定位的校验失败信息

### Requirement: Request transformation SHALL use class-transformer
系统 MUST 使用 `class-transformer` 将原始请求数据转换为声明类型，避免业务层直接处理未经转换的输入。

#### Scenario: Query parameter requires type coercion
- **WHEN** 客户端传入字符串形式的数字或布尔查询参数
- **THEN** 参数在进入控制器前被转换为 DTO 声明类型

### Requirement: Global validation pipe SHALL enforce strict input rules
系统 MUST 启用全局校验管道的白名单和非白名单拒绝策略，防止未声明字段进入业务逻辑。

#### Scenario: Request contains extra undeclared fields
- **WHEN** 请求体包含 DTO 未声明字段
- **THEN** 请求被拒绝并返回统一参数错误响应
