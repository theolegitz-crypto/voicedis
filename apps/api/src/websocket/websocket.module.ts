import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { VoiceModule } from '../voice/voice.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [AuthModule, MessagesModule, VoiceModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebsocketModule {}

