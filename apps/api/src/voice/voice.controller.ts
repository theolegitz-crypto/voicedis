import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VoiceService } from './voice.service';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('channels/:channelId/join')
  join(@CurrentUser() user: AuthUser, @Param('channelId') channelId: string) {
    return this.voiceService.getJoinContext(user.sub, channelId);
  }

  @Post('channels/:channelId/leave')
  leave(@CurrentUser() user: AuthUser, @Param('channelId') channelId: string) {
    return this.voiceService.leaveChannel(user.sub, channelId);
  }
}
