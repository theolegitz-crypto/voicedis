import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessagesService } from './messages.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('channels/:channelId/messages')
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('channelId') channelId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.messagesService.getMessages(user.sub, channelId, query);
  }
}

