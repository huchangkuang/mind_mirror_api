CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(100) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_username_key`(`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_id` VARCHAR(64) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `refresh_tokens_token_id_key`(`token_id`),
  INDEX `idx_refresh_tokens_user_id`(`user_id`),
  INDEX `idx_refresh_tokens_expires_at`(`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `test_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `icon_name` VARCHAR(50) NULL,
  `duration` VARCHAR(20) NULL,
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `href` VARCHAR(100) NULL,
  `color_from` VARCHAR(20) NULL,
  `color_to` VARCHAR(20) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tests_test_id_key`(`test_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `test_id` VARCHAR(50) NOT NULL,
  `user_id` INT NULL,
  `result` JSON NULL,
  `result_summary` VARCHAR(200) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_test_history_user_id`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `feedback_comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_feedback_comments_created_at`(`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `feedback_likes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comment_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_feedback_like`(`comment_id`, `user_id`),
  INDEX `idx_feedback_likes_comment_id`(`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `feedback_moderation_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `actor_user_id` INT NOT NULL,
  `comment_id` INT NOT NULL,
  `action` VARCHAR(32) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_feedback_modlog_created_at`(`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `test_history`
  ADD CONSTRAINT `test_history_test_id_fkey`
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`test_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `test_history`
  ADD CONSTRAINT `test_history_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `feedback_comments`
  ADD CONSTRAINT `feedback_comments_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `feedback_likes`
  ADD CONSTRAINT `feedback_likes_comment_id_fkey`
  FOREIGN KEY (`comment_id`) REFERENCES `feedback_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `feedback_likes`
  ADD CONSTRAINT `feedback_likes_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `feedback_moderation_log`
  ADD CONSTRAINT `feedback_moderation_log_actor_user_id_fkey`
  FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `feedback_moderation_log`
  ADD CONSTRAINT `feedback_moderation_log_comment_id_fkey`
  FOREIGN KEY (`comment_id`) REFERENCES `feedback_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
