import { AppShell } from '@/components/layout/app-shell';

export default function ChannelPage({
  params,
}: {
  params: { serverId: string; channelId: string };
}) {
  return <AppShell serverId={params.serverId} channelId={params.channelId} />;
}

