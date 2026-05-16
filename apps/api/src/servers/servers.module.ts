import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { InvitesController } from './invites.controller';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [ServersController, InvitesController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}

