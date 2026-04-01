# 后端迁移清单（mind_mirror -> mind_mirror_api）

## 模块清单

- 认证模块：`login/register/me/logout/profile/change-password`
- 反馈模块：`comments/list/create/delete/like`
- 测试模块：`tests/list/get`、`history/list/create/delete/clear`
- 题库模块（待迁移）：`mbti`、`city-match` 的题库读取与评分

## 依赖清单（来源项目）

- `mysql2`（已迁移为 Prisma）
- `node:crypto`（密码哈希、随机 token）
- Next.js API Route（已迁移为 NestJS Controller）

## 环境变量

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `PORT`

## 数据表映射

- `users` -> `User`
- `user_sessions` -> 已替换为 `refresh_tokens`
- `tests` -> `Test`
- `test_history` -> `TestHistory`
- `feedback_comments` -> `FeedbackComment`
- `feedback_likes` -> `FeedbackLike`
- `feedback_moderation_log` -> `FeedbackModerationLog`
