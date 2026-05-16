import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.serversService.listForUser(user.sub);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServerDto) {
    return this.serversService.create(user.sub, dto);
  }

  @Get(':serverId')
  getById(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string) {
    return this.serversService.getById(user.sub, serverId);
  }

  @Patch(':serverId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @Body() dto: UpdateServerDto,
  ) {
    return this.serversService.update(user.sub, serverId, dto);
  }

  @Delete(':serverId')
  remove(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string) {
    return this.serversService.remove(user.sub, serverId);
  }
}

