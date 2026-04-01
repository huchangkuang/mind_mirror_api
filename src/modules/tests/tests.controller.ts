import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUserPayload } from '../auth/types';
import { CreateHistoryDto } from './dto/create-history.dto';
import { TestsService } from './tests.service';

@Controller({ path: 'tests', version: '1' })
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  async listOrGet(@Query('test_id') testId?: string) {
    if (testId) {
      const test = await this.testsService.getTestByTestId(testId);
      return { test };
    }
    const tests = await this.testsService.listTests();
    return { tests };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/history')
  async listHistory(
    @CurrentUser() user: JwtUserPayload,
    @Query('test_id') testId?: string,
  ) {
    const history = await this.testsService.listHistory(user.sub, testId);
    return { history };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/history')
  async createHistory(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateHistoryDto,
  ) {
    const record = await this.testsService.createHistory({
      userId: user.sub,
      testId: dto.testId,
      result: dto.result,
      resultSummary: dto.resultSummary,
    });
    return { record };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/history')
  async clearHistory(@CurrentUser() user: JwtUserPayload) {
    const result = await this.testsService.clearHistory(user.sub);
    return { deletedCount: result.count };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/history/:id')
  async deleteHistory(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.testsService.deleteHistoryRecord(user.sub, id);
    return { deletedCount: result.count };
  }
}
