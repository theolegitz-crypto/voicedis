import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateServerDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  iconUrl?: string;
}

