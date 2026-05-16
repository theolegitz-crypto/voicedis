import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('servers/:serverId/channels')
  create(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.create(user.sub, serverId, dto);
  }

  @Patch('channels/:channelId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(user.sub, channelId, dto);
  }

  @Delete('channels/:channelId')
  remove(@CurrentUser() user: AuthUser, @Param('channelId') channelId: string) {
    return this.channelsService.remove(user.sub, channelId);
  }
}

