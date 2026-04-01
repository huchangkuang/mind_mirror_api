import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  listTests() {
    return this.prisma.test.findMany({
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getTestByTestId(testId: string) {
    const test = await this.prisma.test.findUnique({ where: { testId } });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async listHistory(userId: number, testId?: string) {
    return this.prisma.testHistory.findMany({
      where: {
        userId,
        ...(testId ? { testId } : {}),
      },
      include: {
        test: {
          select: {
            title: true,
            href: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHistory(input: {
    userId: number;
    testId: string;
    result: unknown;
    resultSummary?: string;
  }) {
    return this.prisma.testHistory.create({
      data: {
        userId: input.userId,
        testId: input.testId,
        result: input.result as never,
        resultSummary: input.resultSummary ?? null,
      },
      include: {
        test: {
          select: {
            title: true,
            href: true,
          },
        },
      },
    });
  }

  async clearHistory(userId: number) {
    return this.prisma.testHistory.deleteMany({ where: { userId } });
  }

  async deleteHistoryRecord(userId: number, id: number) {
    return this.prisma.testHistory.deleteMany({ where: { userId, id } });
  }
}
