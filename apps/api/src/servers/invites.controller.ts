import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { ServersService } from './servers.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly serversService: ServersService) {}

  @Post('servers/:serverId/invites')
  createInvite(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.serversService.createInvite(user.sub, serverId, dto);
  }

  @Get('invites/:code')
  getInvite(@Param('code') code: string) {
    return this.serversService.getInviteByCode(code);
  }

  @Post('invites/:code/accept')
  acceptInvite(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.serversService.acceptInvite(user.sub, code);
  }
}

