type RemoteStreamHandler = (userId: string, stream: MediaStream) => void;
type IceCandidateHandler = (targetUserId: string, candidate: RTCIceCandidateInit) => void;

const MICROPHONE_UNAVAILABLE_MESSAGE =
  'Microphone access is unavailable. Open the app over HTTPS and allow microphone permission.';

export class WebRtcMeshManager {
  private peers = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;

  constructor(
    private readonly onRemoteStream: RemoteStreamHandler,
    private readonly onIceCandidate: IceCandidateHandler,
  ) {}

  async ensureLocalStream() {
    if (!this.localStream) {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        throw new Error(MICROPHONE_UNAVAILABLE_MESSAGE);
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }

    return this.localStream;
  }

  getLocalStream() {
    return this.localStream;
  }

  setMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  async createOffer(targetUserId: string) {
    const connection = await this.getOrCreateConnection(targetUserId);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(targetUserId: string, sdp: RTCSessionDescriptionInit) {
    const connection = await this.getOrCreateConnection(targetUserId);
    await connection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(targetUserId: string, sdp: RTCSessionDescriptionInit) {
    const connection = await this.getOrCreateConnection(targetUserId);
    await connection.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    const connection = await this.getOrCreateConnection(targetUserId);
    await connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  closePeer(targetUserId: string) {
    const connection = this.peers.get(targetUserId);
    if (!connection) {
      return;
    }

    connection.close();
    this.peers.delete(targetUserId);
  }

  cleanup() {
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  private async getOrCreateConnection(targetUserId: string) {
    const existing = this.peers.get(targetUserId);
    if (existing) {
      return existing;
    }

    const stream = await this.ensureLocalStream();
    const connection = new RTCPeerConnection({
      iceServers: getIceServers(),
    });

    stream.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(targetUserId, event.candidate.toJSON());
      }
    };

    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onRemoteStream(targetUserId, remoteStream);
      }
    };

    connection.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(connection.connectionState)) {
        this.closePeer(targetUserId);
      }
    };

    this.peers.set(targetUserId, connection);
    return connection;
  }
}

function getIceServers() {
  const stunUrl = process.env.NEXT_PUBLIC_STUN_URL;
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  return [
    ...(stunUrl ? [{ urls: [stunUrl] }] : []),
    ...(turnUrl
      ? [
          {
            urls: [turnUrl],
            username: turnUsername,
            credential: turnCredential,
          },
        ]
      : []),
  ];
}
