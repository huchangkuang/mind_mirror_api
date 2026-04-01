import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @IsNotEmpty()
  testId!: string;

  result!: unknown;

  @IsOptional()
  @IsString()
  resultSummary?: string;
}
