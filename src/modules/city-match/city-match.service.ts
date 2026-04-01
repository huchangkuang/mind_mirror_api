import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

type CityMatchMode = 'quick' | 'full';

interface QuestionOption {
  value: string;
  label: string;
  dimensionWeights: Partial<{
    lifestyle: number;
    social: number;
    environment: number;
    pace: number;
  }>;
}

interface CityMatchQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
}

interface CityMatchQuestionBank {
  meta: {
    version: string;
    questionCount: number;
    estimatedMinutes: number;
    mode: CityMatchMode;
  };
  questions: CityMatchQuestion[];
}

@Injectable()
export class CityMatchService {
  async getQuestionBank(mode: CityMatchMode): Promise<CityMatchQuestionBank> {
    try {
      const raw = await readFile(this.resolveDataFilePath(), 'utf-8');
      const data = JSON.parse(raw) as unknown;
      return this.validateQuestionBank(data, mode);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to load question bank',
      );
    }
  }

  private resolveDataFilePath(): string {
    const externalRoot = process.env.MIND_MIRROR_WEB_ROOT?.trim();
    if (externalRoot) {
      return join(externalRoot, 'data', 'city-match', 'questions.json');
    }
    return join(process.cwd(), '..', 'mind_mirror', 'data', 'city-match', 'questions.json');
  }

  private validateQuestionBank(data: unknown, mode: CityMatchMode): CityMatchQuestionBank {
    if (!data || typeof data !== 'object') throw new Error('Invalid question bank');
    const o = data as Record<string, unknown>;
    const meta = o.meta as Record<string, unknown> | undefined;
    if (!meta || typeof meta.version !== 'string') {
      throw new Error('Invalid question bank meta');
    }

    if (o.modes && typeof o.modes === 'object') {
      const modes = o.modes as Record<string, unknown>;
      const selectedMode = mode in modes ? mode : 'quick';
      const modeData = modes[selectedMode] as Record<string, unknown> | undefined;
      if (!modeData) throw new Error('Invalid mode in question bank');
      const questions = Array.isArray(modeData.questions)
        ? modeData.questions.map((q: unknown, i: number) => this.validateQuestion(q, i))
        : [];
      const estimatedMinutes =
        typeof modeData.estimatedMinutes === 'number'
          ? modeData.estimatedMinutes
          : selectedMode === 'quick'
            ? 3
            : 8;
      return {
        meta: {
          version: meta.version,
          questionCount: questions.length,
          estimatedMinutes,
          mode: selectedMode,
        },
        questions,
      };
    }

    const questions = Array.isArray(o.questions)
      ? o.questions.map((q: unknown, i: number) => this.validateQuestion(q, i))
      : [];
    return {
      meta: {
        version: meta.version,
        questionCount: questions.length,
        estimatedMinutes: typeof meta.estimatedMinutes === 'number' ? meta.estimatedMinutes : 5,
        mode,
      },
      questions,
    };
  }

  private validateQuestion(q: unknown, index: number): CityMatchQuestion {
    if (!q || typeof q !== 'object') throw new Error(`Invalid question at index ${index}`);
    const o = q as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : `q${index + 1}`;
    const text = typeof o.text === 'string' ? o.text : '';
    const options = Array.isArray(o.options) ? o.options : [];
    return {
      id,
      text,
      options: options.map((opt: unknown, i: number) => this.parseOption(opt, index, i)),
    };
  }

  private parseOption(opt: unknown, qIndex: number, oIndex: number): QuestionOption {
    if (!opt || typeof opt !== 'object') {
      throw new Error(`Invalid option at question ${qIndex} option ${oIndex}`);
    }
    const o = opt as Record<string, unknown>;
    const weights = (o.dimensionWeights ?? {}) as Record<string, unknown>;
    return {
      value: String(o.value ?? '?'),
      label: String(o.label ?? ''),
      dimensionWeights: {
        lifestyle: typeof weights.lifestyle === 'number' ? weights.lifestyle : undefined,
        social: typeof weights.social === 'number' ? weights.social : undefined,
        environment: typeof weights.environment === 'number' ? weights.environment : undefined,
        pace: typeof weights.pace === 'number' ? weights.pace : undefined,
      },
    };
  }
}
