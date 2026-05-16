import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  messageId!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

