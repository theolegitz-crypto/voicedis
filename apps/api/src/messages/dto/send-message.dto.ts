import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  channelId!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

