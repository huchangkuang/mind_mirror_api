## ADDED Requirements

### Requirement: Authentication SHALL issue access token and refresh token
系统 MUST 在登录成功后同时签发 Access Token 与 Refresh Token，并定义各自独立过期策略。

#### Scenario: User login succeeds
- **WHEN** 用户凭证校验通过
- **THEN** 响应中返回可用的 access token 与 refresh token

### Requirement: Refresh flow SHALL rotate and validate refresh token
系统 MUST 提供刷新接口并校验 Refresh Token 的有效性、签名和撤销状态；刷新成功后应支持轮换策略。

#### Scenario: Client requests token refresh
- **WHEN** 客户端提交有效 refresh token 调用刷新接口
- **THEN** 系统返回新的 access token，且按策略更新 refresh token 状态

### Requirement: Protected endpoints SHALL require valid access token
系统 MUST 对受保护接口启用鉴权守卫，缺失或无效 Access Token 的请求必须被拒绝。

#### Scenario: Missing authorization header on protected endpoint
- **WHEN** 客户端访问受保护资源但未提供 access token
- **THEN** 系统返回统一鉴权失败错误响应

### Requirement: Logout SHALL revoke refresh token usability
系统 MUST 在登出或主动失效场景下使对应 Refresh Token 不可继续用于刷新。

#### Scenario: User logs out from active session
- **WHEN** 客户端调用登出接口并提交当前会话令牌信息
- **THEN** 已登出会话的 refresh token 无法再次通过刷新校验
