import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.ensureDatabaseSchema();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async ensureDatabaseSchema(): Promise<void> {
    await this.ensureRefreshTokensTable();
    await this.ensureFeedbackModerationLogConstraints();
  }

  private async ensureRefreshTokensTable(): Promise<void> {
    const exists = await this.tableExists('refresh_tokens');
    if (exists) return;

    this.logger.warn(
      'Table `refresh_tokens` is missing, creating it for backward-compatible startup.',
    );

    await this.$executeRawUnsafe(`
      CREATE TABLE refresh_tokens (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        token_id VARCHAR(64) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME(3) NOT NULL,
        revoked_at DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX refresh_tokens_token_id_key (token_id),
        INDEX idx_refresh_tokens_user_id (user_id),
        INDEX idx_refresh_tokens_expires_at (expires_at),
        CONSTRAINT refresh_tokens_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  private async ensureFeedbackModerationLogConstraints(): Promise<void> {
    const tableExists = await this.tableExists('feedback_moderation_log');
    if (!tableExists) return;

    const actorFkName = 'feedback_moderation_log_actor_user_id_fkey';
    const commentFkName = 'feedback_moderation_log_comment_id_fkey';

    const hasActorFk = await this.foreignKeyExists(
      'feedback_moderation_log',
      actorFkName,
    );
    if (!hasActorFk) {
      await this.$executeRawUnsafe(`
        ALTER TABLE feedback_moderation_log
        ADD CONSTRAINT ${actorFkName}
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }

    const hasCommentFk = await this.foreignKeyExists(
      'feedback_moderation_log',
      commentFkName,
    );
    if (!hasCommentFk) {
      await this.$executeRawUnsafe(`
        ALTER TABLE feedback_moderation_log
        ADD CONSTRAINT ${commentFkName}
        FOREIGN KEY (comment_id) REFERENCES feedback_comments(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const dbRows = (await this.$queryRawUnsafe(
      'SELECT DATABASE() AS db',
    )) as Array<{ db: string | null }>;
    const dbName = dbRows[0]?.db;
    if (!dbName) return false;

    const rows = (await this.$queryRawUnsafe(
      `
      SELECT COUNT(1) AS count
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name = ?
      `,
      dbName,
      tableName,
    )) as Array<{ count: number | bigint }>;

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async foreignKeyExists(
    tableName: string,
    constraintName: string,
  ): Promise<boolean> {
    const dbRows = (await this.$queryRawUnsafe(
      'SELECT DATABASE() AS db',
    )) as Array<{ db: string | null }>;
    const dbName = dbRows[0]?.db;
    if (!dbName) return false;

    const rows = (await this.$queryRawUnsafe(
      `
      SELECT COUNT(1) AS count
      FROM information_schema.referential_constraints
      WHERE constraint_schema = ? AND table_name = ? AND constraint_name = ?
      `,
      dbName,
      tableName,
      constraintName,
    )) as Array<{ count: number | bigint }>;

    return Number(rows[0]?.count ?? 0) > 0;
  }
}
