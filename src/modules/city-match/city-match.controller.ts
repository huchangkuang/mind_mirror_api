import { Controller, Get, Query } from '@nestjs/common';
import { CityMatchService } from './city-match.service';

@Controller({ path: 'city-match', version: '1' })
export class CityMatchController {
  constructor(private readonly cityMatchService: CityMatchService) {}

  @Get('questions')
  async questions(@Query('mode') mode?: string): Promise<Record<string, unknown>> {
    const bank = await this.cityMatchService.getQuestionBank(mode === 'full' ? 'full' : 'quick');
    return {
      meta: {
        version: bank.meta.version,
        questionCount: bank.meta.questionCount,
        estimatedMinutes: bank.meta.estimatedMinutes,
        mode: bank.meta.mode,
      },
      questions: bank.questions,
    };
  }
}
