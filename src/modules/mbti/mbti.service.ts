import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

type MbtiMode = 'quick' | 'deep';
type MbtiQuestionType = 'binary' | 'likert5';
type DimensionKey = 'EI' | 'SN' | 'TF' | 'JP';

type DimensionWeights = Record<DimensionKey, number>;

interface QuestionOption {
  value: string;
  label: string;
  dimensionWeights: DimensionWeights;
}

interface MbtiQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  dimensionWeights: DimensionWeights;
  category?: string;
  tags?: string[];
}

interface QuestionBank {
  meta: {
    version: string;
    questionCount: number;
    estimatedMinutes: number;
    mode: MbtiMode;
    questionType: MbtiQuestionType;
  };
  questions: MbtiQuestion[];
}

export interface MbtiSubmitBody {
  version: string;
  mode: MbtiMode;
  answers: Record<string, string | number>;
}

@Injectable()
export class MbtiService {
  async getQuestionBank(mode: MbtiMode): Promise<QuestionBank> {
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

  async submit(body: MbtiSubmitBody) {
    if (
      !body ||
      typeof body.version !== 'string' ||
      (body.mode !== 'quick' && body.mode !== 'deep') ||
      !body.answers ||
      typeof body.answers !== 'object'
    ) {
      throw new BadRequestException('Missing or invalid version, mode, or answers');
    }

    const bank = await this.getQuestionBank(body.mode);
    if (bank.meta.version !== body.version) {
      throw new BadRequestException('Question bank version does not match');
    }
    if (!this.isAnswersValidForMode(body.answers, body.mode)) {
      throw new BadRequestException('Answers do not match selected mode');
    }

    const result = this.computeMbtiResult({
      questions: bank.questions,
      answers: body.answers,
    });

    return {
      type: result.type,
      dimensionScores: result.dimensionScores,
      dimensionStrength: result.dimensionStrength,
      summary: result.summary,
      mode: body.mode,
    };
  }

  private resolveDataFilePath(): string {
    const externalRoot = process.env.MIND_MIRROR_WEB_ROOT?.trim();
    if (externalRoot) {
      return join(externalRoot, 'data', 'mbti', 'questions.json');
    }
    return join(process.cwd(), '..', 'mind_mirror', 'data', 'mbti', 'questions.json');
  }

  private validateQuestionBank(data: unknown, mode: MbtiMode): QuestionBank {
    if (!data || typeof data !== 'object') throw new Error('Invalid question bank');
    const o = data as Record<string, unknown>;
    const legacyMeta = o.meta as Record<string, unknown> | undefined;

    if (o.modes && typeof o.modes === 'object') {
      const modes = o.modes as Record<string, unknown>;
      const selected = modes[mode] as Record<string, unknown> | undefined;
      if (!legacyMeta || typeof legacyMeta.version !== 'string' || !selected) {
        throw new Error('Invalid multi-mode question bank');
      }
      const questions = Array.isArray(selected.questions) ? selected.questions : [];
      const estimatedMinutes = Number(selected.estimatedMinutes) || (mode === 'deep' ? 12 : 8);
      const parsed = questions.map((q: unknown, i: number) => this.validateQuestion(q, i));
      return {
        meta: {
          version: legacyMeta.version,
          questionCount: parsed.length,
          estimatedMinutes,
          mode,
          questionType: mode === 'deep' ? 'likert5' : 'binary',
        },
        questions: parsed,
      };
    }

    const questions = Array.isArray(o.questions) ? o.questions : [];
    if (!legacyMeta || typeof legacyMeta.version !== 'string') {
      throw new Error('Invalid question bank meta');
    }
    const parsedQuestions = questions.map((q: unknown, i: number) => this.validateQuestion(q, i));
    const selectedQuestions = mode === 'deep' ? this.buildDeepQuestions(parsedQuestions) : parsedQuestions;
    return {
      meta: {
        version: legacyMeta.version,
        questionCount: selectedQuestions.length,
        estimatedMinutes:
          typeof legacyMeta.estimatedMinutes === 'number'
            ? mode === 'deep'
              ? Math.max(legacyMeta.estimatedMinutes, 10)
              : legacyMeta.estimatedMinutes
            : mode === 'deep'
              ? 10
              : 5,
        mode,
        questionType: mode === 'deep' ? 'likert5' : 'binary',
      },
      questions: selectedQuestions,
    };
  }

  private validateQuestion(q: unknown, index: number): MbtiQuestion {
    if (!q || typeof q !== 'object') throw new Error(`Invalid question at index ${index}`);
    const o = q as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : `q${index + 1}`;
    const text = typeof o.text === 'string' ? o.text : '';
    const options = Array.isArray(o.options) ? o.options : [];
    const parsedOptions = options.map((opt: unknown, j: number) => this.parseOption(opt, index, j));
    const base: MbtiQuestion = {
      id,
      text,
      options: parsedOptions,
      dimensionWeights: this.parseDimensionWeights(o.dimensionWeights),
    };
    if (o.category != null) base.category = String(o.category);
    if (Array.isArray(o.tags)) base.tags = o.tags.map(String);
    return base;
  }

  private parseOption(opt: unknown, qIndex: number, oIndex: number): QuestionOption {
    if (!opt || typeof opt !== 'object') {
      throw new Error(`Invalid option at question ${qIndex} option ${oIndex}`);
    }
    const o = opt as Record<string, unknown>;
    return {
      value: String(o.value ?? '?'),
      label: String(o.label ?? ''),
      dimensionWeights: this.parseDimensionWeights(o.dimensionWeights),
    };
  }

  private parseDimensionWeights(v: unknown): DimensionWeights {
    if (!v || typeof v !== 'object') return { EI: 0, SN: 0, TF: 0, JP: 0 };
    const o = v as Record<string, unknown>;
    return {
      EI: Number(o.EI) || 0,
      SN: Number(o.SN) || 0,
      TF: Number(o.TF) || 0,
      JP: Number(o.JP) || 0,
    };
  }

  private buildDeepQuestions(quickQuestions: MbtiQuestion[]): MbtiQuestion[] {
    return quickQuestions.map((q) => {
      const left = q.options.find((opt) => opt.value === 'A') ?? q.options[0];
      const right = q.options.find((opt) => opt.value === 'B') ?? q.options[1];
      const base = this.normalizeBaseWeights(left?.dimensionWeights ?? q.dimensionWeights);

      return {
        ...q,
        options: [
          this.buildLikertOption(1, '非常倾向左侧', base, 2),
          this.buildLikertOption(2, '比较倾向左侧', base, 1),
          this.buildLikertOption(3, '中立', base, 0),
          this.buildLikertOption(4, '比较倾向右侧', base, -1),
          this.buildLikertOption(5, '非常倾向右侧', base, -2),
        ],
        text: right?.label ? `${left?.label ?? q.text} / ${right.label}` : q.text,
        dimensionWeights: { EI: 0, SN: 0, TF: 0, JP: 0 },
      };
    });
  }

  private normalizeBaseWeights(weights: DimensionWeights): DimensionWeights {
    const normalized: DimensionWeights = { EI: 0, SN: 0, TF: 0, JP: 0 };
    (['EI', 'SN', 'TF', 'JP'] as const).forEach((key) => {
      if (weights[key] > 0) normalized[key] = 1;
      if (weights[key] < 0) normalized[key] = -1;
    });
    return normalized;
  }

  private buildLikertOption(
    value: number,
    label: string,
    base: DimensionWeights,
    factor: number,
  ): QuestionOption {
    return {
      value: String(value),
      label,
      dimensionWeights: {
        EI: base.EI * factor,
        SN: base.SN * factor,
        TF: base.TF * factor,
        JP: base.JP * factor,
      },
    };
  }

  private isAnswersValidForMode(
    answers: Record<string, string | number>,
    mode: MbtiMode,
  ): boolean {
    const values = Object.values(answers);
    if (mode === 'quick') {
      return values.every((value) => value === 'A' || value === 'B');
    }
    return values.every((value) => {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isInteger(num) && num >= 1 && num <= 5;
    });
  }

  private computeMbtiResult(input: {
    questions: MbtiQuestion[];
    answers: Record<string, string | number>;
  }) {
    const { questions, answers } = input;
    const dimensionScores: Record<DimensionKey, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
    const keys: DimensionKey[] = ['EI', 'SN', 'TF', 'JP'];
    const positiveLetters = { EI: 'E', SN: 'S', TF: 'T', JP: 'J' } as const;
    const negativeLetters = { EI: 'I', SN: 'N', TF: 'F', JP: 'P' } as const;

    for (const q of questions) {
      const selectedValue = answers[q.id];
      if (selectedValue == null) continue;
      const option = q.options.find((o) => o.value === String(selectedValue));
      if (!option) continue;
      keys.forEach((key) => {
        dimensionScores[key] += option.dimensionWeights[key];
      });
    }

    const maxAbs: Record<DimensionKey, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
    for (const q of questions) {
      for (const opt of q.options) {
        keys.forEach((key) => {
          const abs = Math.abs(opt.dimensionWeights[key]);
          if (abs > maxAbs[key]) maxAbs[key] = abs;
        });
      }
    }
    const dimensionStrength: Record<DimensionKey, number> = { EI: 50, SN: 50, TF: 50, JP: 50 };
    keys.forEach((key) => {
      const cap = (maxAbs[key] || 1) * questions.length;
      const ratio = dimensionScores[key] / cap;
      dimensionStrength[key] = Math.max(0, Math.min(100, Math.round(50 + ratio * 50)));
    });

    const type = keys
      .map((key) =>
        dimensionScores[key] > 0
          ? positiveLetters[key]
          : dimensionScores[key] < 0
            ? negativeLetters[key]
            : positiveLetters[key],
      )
      .join('');

    return {
      type,
      dimensionScores,
      dimensionStrength,
      summary: undefined,
    };
  }
}
