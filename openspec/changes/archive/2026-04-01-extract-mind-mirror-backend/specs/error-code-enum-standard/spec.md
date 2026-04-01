## ADDED Requirements

### Requirement: Error codes SHALL be defined in a centralized enum
系统 MUST 使用统一错误码枚举定义业务和系统错误，不允许在控制器或服务中散落硬编码错误码。

#### Scenario: New business exception is introduced
- **WHEN** 新增业务异常类型
- **THEN** 开发者先在统一错误码枚举中注册并分配合法编码

### Requirement: Error codes SHALL follow segmented ranges
系统 MUST 对错误码按类别分段管理（如参数、鉴权、资源、系统），并保证编码唯一与可追溯。

#### Scenario: Error code review for a new module
- **WHEN** 模块提交新增错误码
- **THEN** 错误码符合分段规则且不与现有码冲突

### Requirement: Error responses SHALL map exceptions to enum codes
系统 MUST 将框架异常与业务异常映射到统一错误码和标准错误响应结构。

#### Scenario: Service throws domain-specific exception
- **WHEN** 服务层抛出领域异常
- **THEN** 客户端收到枚举中定义的错误码及对应消息
