## Purpose

定义对外 HTTP API 的版本策略、成功响应信封格式以及全局异常归一化要求。

## Requirements

### Requirement: API routes SHALL use versioned URI prefix
系统 MUST 对外提供以 `/api/v1` 开头的 HTTP 接口路径，且新接口不得绕过该版本策略直接暴露。

#### Scenario: Controller route is registered
- **WHEN** 新增控制器并暴露接口
- **THEN** 最终可访问路径包含 `/api/v1` 前缀

### Requirement: Successful responses SHALL follow envelope format
系统 MUST 将成功响应统一包装为 `code/message/data` 三段结构，其中 `code` 为成功码、`message` 为可读消息、`data` 为业务载荷。

#### Scenario: Business endpoint returns data
- **WHEN** 调用任意成功业务接口
- **THEN** 响应体包含 `code`、`message`、`data` 且字段语义一致

### Requirement: Exceptions SHALL be normalized by global handler
系统 MUST 通过全局异常过滤器将未捕获错误与业务异常统一转换为标准错误响应结构。

#### Scenario: Unhandled exception is thrown in service
- **WHEN** 服务层抛出异常并冒泡到控制器
- **THEN** 客户端收到统一结构错误响应而非框架默认错误格式
