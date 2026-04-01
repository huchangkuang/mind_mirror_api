import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MbtiService, MbtiSubmitBody } from './mbti.service';

@Controller({ path: 'mbti', version: '1' })
export class MbtiController {
  constructor(private readonly mbtiService: MbtiService) {}

  @Get('questions')
  async questions(@Query('mode') mode?: string): Promise<Record<string, unknown>> {
    const bank = await this.mbtiService.getQuestionBank(mode === 'deep' ? 'deep' : 'quick');
    return {
      version: bank.meta.version,
      questionCount: bank.meta.questionCount,
      estimatedMinutes: bank.meta.estimatedMinutes,
      mode: bank.meta.mode,
      questionType: bank.meta.questionType,
      questions: bank.questions,
    };
  }

  @Post('submit')
  async submit(@Body() body: MbtiSubmitBody): Promise<Record<string, unknown>> {
    return this.mbtiService.submit(body);
  }
}
