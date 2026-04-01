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
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments.query.dto';
import { FeedbackService } from './feedback.service';

@Controller({ path: 'feedback/comments', version: '1' })
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async list(@Query() query: ListCommentsQueryDto) {
    const sort = query.sort ?? 'hot';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const comments = await this.feedbackService.listComments(
      null,
      sort,
      page,
      pageSize,
    );
    return { comments, sort };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.feedbackService.createComment(
      user.sub,
      user.username,
      dto.body,
    );
    return { comment };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.feedbackService.toggleLike(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.feedbackService.deleteComment(user.sub, user.username, id);
    return { ok: true };
  }
}
