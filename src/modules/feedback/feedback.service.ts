import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FEEDBACK_MODERATOR_USERNAMES = new Set(['15967537583']);

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async listComments(
    userId: number | null,
    sort: 'hot' | 'recent',
    page: number,
    pageSize: number,
  ) {
    const skip = (page - 1) * pageSize;
    const comments = await this.prisma.feedbackComment.findMany({
      include: {
        user: { select: { username: true } },
        likes: userId
          ? { where: { userId }, select: { id: true } }
          : { select: { id: true } },
        _count: { select: { likes: true } },
      },
      orderBy:
        sort === 'recent'
          ? { createdAt: 'desc' }
          : [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    });

    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      username: comment.user.username,
      likeCount: comment._count.likes,
      liked: userId ? comment.likes.length > 0 : false,
    }));
  }

  async createComment(userId: number, username: string, body: string) {
    const trimmed = body.trim();
    const comment = await this.prisma.feedbackComment.create({
      data: { userId, body: trimmed },
    });

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      username,
      likeCount: 0,
      liked: false,
    };
  }

  async toggleLike(userId: number, commentId: number) {
    const comment = await this.prisma.feedbackComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('评论不存在');

    const existing = await this.prisma.feedbackLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await this.prisma.feedbackLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.feedbackLike.create({ data: { commentId, userId } });
    }

    const likeCount = await this.prisma.feedbackLike.count({
      where: { commentId },
    });
    return { liked: !existing, likeCount };
  }

  async deleteComment(actorUserId: number, actorUsername: string, commentId: number) {
    if (!FEEDBACK_MODERATOR_USERNAMES.has(actorUsername)) {
      throw new ForbiddenException('无权限删除');
    }

    const comment = await this.prisma.feedbackComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('评论不存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.feedbackModerationLog.create({
        data: {
          actorUserId,
          commentId,
          action: 'delete',
        },
      });
      await tx.feedbackComment.delete({ where: { id: commentId } });
    });
  }
}
