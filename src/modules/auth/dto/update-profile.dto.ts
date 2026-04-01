import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[\p{L}\p{N}\s\-_.·]+$/u)
  nickname!: string;
}
