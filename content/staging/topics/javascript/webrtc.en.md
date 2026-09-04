---
title: WebRTC
description: Complete guide to JavaScript WebRTC for real-time communication, peer-to-peer audio/video streaming, data transmission, signaling mechanisms, and NAT traversal
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - WebRTC
  - Real-time Communication
  - Audio Video
  - P2P
status: imported
origin: old/src/content/docs/javascript/webrtc.en.md
divergence: 0.194
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Explanation

WebRTC (Web Real-Time Communication) is an open-source real-time communication technology that enables peer-to-peer transmission of audio, video, and data directly between browsers without requiring an intermediary media server. Pioneered by Google, it has become a W3C standard and is now supported across all modern browsers.

### Core Characteristics

- **Peer-to-Peer Communication**: Direct connections between browsers reduce latency and improve privacy
- **Media Capture**: Access to camera, microphone, and screen sharing capabilities
- **Secure Transmission**: All data is encrypted using DTLS/SRTP protocols
- **NAT Traversal**: ICE framework solves network address translation challenges
- **Adaptive Quality**: Dynamic bitrate adjustment based on network conditions
- **Standards-Based**: Built on W3C standards and IETF protocols

### Real-World Applications

WebRTC powers numerous applications:
- Video conferencing (Zoom, Google Meet, Microsoft Teams)
- Voice calling (Discord, WhatsApp Web)
- Live streaming with interactive features
- Online education platforms
- Remote collaboration tools
- IoT device control
- Real-time gaming
- Screen sharing and remote desktop

---

## Core Principles

### WebRTC Architecture Overview

WebRTC consists of three main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ getUserMedia │  │ RTCPeerConn. │  │ RTCDataChan. │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Session/Control Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     SDP      │  │     ICE      │  │ DTLS/SRTP    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│                   Transport Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     UDP      │  │    STUN      │  │     TURN     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Connection Establishment Flow

Establishing a WebRTC connection involves three critical phases:

```
Caller                   Signaling Server               Callee
  │                             │                         │
  ├─ 1. Create RTCPeerConnection
  ├─ 2. Create Offer
  ├────────────────────────────>│
  │      Send Offer SDP         │
  │                             ├────────────────────────>│
  │                             │  3. Create RTCPeerConn. │
  │                             │  4. setRemoteDescription│
  │                             │  5. Create Answer       │
  │                             │<────────────────────────┤
  │                             │   Send Answer SDP       │
  │<────────────────────────────┤
  │   6. setRemoteDescription   │
  │                             │
  ├════════════════════════════════════════════════════════┤
  │ 7. ICE Candidate Exchange (continuous)                 │
  ├════════════════════════════════════════════════════════┤
  │ 8. P2P Connection Established                          │
  │
```

### Key Protocols and Standards

**SDP (Session Description Protocol)**
- Describes media capabilities, codecs, and transport parameters
- Human-readable text format (RFC 4566)
- Contains information about audio/video streams

**ICE (Interactive Connectivity Establishment)**
- Discovers network addresses and establishes connectivity
- Gathers candidates from different sources (host, reflexive, relay)
- Selects best candidate pair for connection

**STUN (Session Traversal Utilities for NAT)**
- Discovers public IP address and port
- Lightweight protocol, suitable for most NAT scenarios
- Free public servers available

**TURN (Traversal Using Relays around NAT)**
- Relays media when direct P2P connection fails
- More bandwidth-intensive than STUN
- Necessary for symmetric NAT and restrictive firewalls

**DTLS (Datagram Transport Layer Security)**
- Encrypts media traffic over UDP
- Based on TLS but for datagram protocols
- Mandatory for WebRTC

**SRTP (Secure Real-time Transport Protocol)**
- Encrypts RTP media streams
- Adds encryption and authentication to RTP

---

## Key Points

### Media Capture with getUserMedia

```javascript
// Basic media capture
async function captureMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 }
    });

    const videoElement = document.getElementById('video');
    videoElement.srcObject = stream;
  } catch (error) {
    console.error('Error accessing media:', error);
  }
}
```

### RTCPeerConnection - The Core API

RTCPeerConnection is the fundamental interface for WebRTC communication:

```javascript
// Create peer connection
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] }
  ]
});

// Add local stream tracks
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
});

stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});
```

### Offer and Answer Negotiation

The offer/answer model establishes the connection:

```javascript
// Caller creates and sends offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
// Send offer to remote peer via signaling

// Callee creates answer
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);
// Send answer back to caller
```

### ICE Candidate Exchange

ICE candidates are network addresses needed for connection:

```javascript
peerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    // Send candidate to remote peer
    sendToSignalingServer({
      type: 'icecandidate',
      candidate: event.candidate
    });
  }
});

// Receive and add remote ICE candidates
function handleRemoteCandidate(candidate) {
  peerConnection.addIceCandidate(candidate);
}
```

### Data Channels for Non-Media Data

RTCDataChannel enables bidirectional data transmission:

```javascript
// Initiator creates data channel
const dataChannel = peerConnection.createDataChannel('chat', {
  ordered: true
});

// Receiver listens for data channel
peerConnection.addEventListener('datachannel', (event) => {
  const remoteDataChannel = event.channel;
  setupDataChannelListeners(remoteDataChannel);
});

// Send and receive data
function setupDataChannelListeners(channel) {
  channel.addEventListener('message', (event) => {
    console.log('Received:', event.data);
  });

  channel.send('Hello from data channel!');
}
```

---

## Code Examples

### Complete Video Chat Application

```javascript
class VideoChatApplication {
  constructor(signalingURL) {
    this.signalingURL = signalingURL;
    this.peerConnection = null;
    this.localStream = null;
    this.socket = null;
  }

  async initialize() {
    // Connect to signaling server
    this.socket = new WebSocket(this.signalingURL);
    this.socket.addEventListener('message', (event) => {
      this.handleSignalingMessage(JSON.parse(event.data));
    });

    // Get local media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Display local video
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = this.localStream;
  }

  async initiateCall(remoteUserId) {
    // Create peer connection
    this.createPeerConnection();

    // Add local stream tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // Create and send offer
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.peerConnection.setLocalDescription(offer);

    this.sendSignalingMessage({
      type: 'offer',
      offer: offer,
      from: this.getUserId(),
      to: remoteUserId
    });
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]
    });

    // Handle ICE candidates
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'icecandidate',
          candidate: event.candidate,
          to: this.remoteUserId
        });
      }
    });

    // Handle remote stream
    this.peerConnection.addEventListener('track', (event) => {
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = event.streams[0];
    });

    // Handle connection state changes
    this.peerConnection.addEventListener('connectionstatechange', () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'failed') {
        this.handleConnectionFailure();
      }
    });
  }

  async handleSignalingMessage(message) {
    try {
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.offer);
          break;
        case 'answer':
          await this.handleAnswer(message.answer);
          break;
        case 'icecandidate':
          await this.handleIceCandidate(message.candidate);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  async handleOffer(offer) {
    if (!this.peerConnection) {
      this.createPeerConnection();
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.sendSignalingMessage({
      type: 'answer',
      answer: answer,
      to: this.remoteUserId
    });
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  }

  async handleIceCandidate(candidate) {
    if (candidate) {
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  }

  sendSignalingMessage(message) {
    this.socket.send(JSON.stringify(message));
  }

  handleConnectionFailure() {
    console.log('Connection failed, attempting restart...');
    // Implement ICE restart
    this.peerConnection.createOffer({ iceRestart: true })
      .then(offer => this.peerConnection.setLocalDescription(offer));
  }

  getUserId() {
    // Implementation to get current user ID
    return 'user-' + Math.random().toString(36).substr(2, 9);
  }

  async endCall() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.localStream.getTracks().forEach(track => track.stop());
  }
}

// Usage
const chat = new VideoChatApplication('wss://signaling.example.com');
await chat.initialize();

// Start call to another user
document.getElementById('callButton').addEventListener('click', async () => {
  await chat.initiateCall('remote-user-id');
});

document.getElementById('endButton').addEventListener('click', async () => {
  await chat.endCall();
});
```

### Screen Sharing Implementation

```javascript
async function startScreenShare() {
  try {
    // Capture screen
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: false
    });

    // Get video track
    const screenTrack = screenStream.getVideoTrack();

    // Replace video track in peer connection
    const sender = peerConnection
      .getSenders()
      .find(s => s.track && s.track.kind === 'video');

    if (sender) {
      await sender.replaceTrack(screenTrack);
    }

    // Handle screen share stop
    screenTrack.addEventListener('ended', async () => {
      // Switch back to camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      const cameraTrack = cameraStream.getVideoTrack();
      await sender.replaceTrack(cameraTrack);
    });

  } catch (error) {
    console.error('Error starting screen share:', error);
  }
}
```

### Statistics and Monitoring

```javascript
class ConnectionMonitor {
  constructor(peerConnection) {
    this.peerConnection = peerConnection;
    this.stats = {};
  }

  async getStats() {
    const stats = await this.peerConnection.getStats();

    const result = {
      audio: {},
      video: {},
      connection: {}
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        if (report.kind === 'audio') {
          result.audio.inbound = {
            bytesReceived: report.bytesReceived,
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            jitter: report.jitter,
            audioLevel: report.audioLevel
          };
        } else if (report.kind === 'video') {
          result.video.inbound = {
            bytesReceived: report.bytesReceived,
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            framesDecoded: report.framesDecoded,
            frameRate: report.framesPerSecond
          };
        }
      } else if (report.type === 'outbound-rtp') {
        if (report.kind === 'audio') {
          result.audio.outbound = {
            bytesSent: report.bytesSent,
            packetsSent: report.packetsSent,
            audioLevel: report.audioLevel
          };
        } else if (report.kind === 'video') {
          result.video.outbound = {
            bytesSent: report.bytesSent,
            packetsSent: report.packetsSent,
            framesEncoded: report.framesEncoded,
            frameRate: report.framesPerSecond,
            qualityLimitation: report.qualityLimitation
          };
        }
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.connection = {
          currentRoundTripTime: report.currentRoundTripTime,
          availableOutgoingBitrate: report.availableOutgoingBitrate,
          availableIncomingBitrate: report.availableIncomingBitrate,
          bytesReceived: report.bytesReceived,
          bytesSent: report.bytesSent
        };
      }
    });

    return result;
  }

  async startMonitoring(interval = 1000) {
    setInterval(async () => {
      const stats = await this.getStats();
      console.log('WebRTC Stats:', stats);
      this.displayStats(stats);
    }, interval);
  }

  displayStats(stats) {
    // Update UI with statistics
    document.getElementById('stats').textContent = JSON.stringify(stats, null, 2);
  }
}

// Usage
const monitor = new ConnectionMonitor(peerConnection);
monitor.startMonitoring(1000);
```

### Data Channel with Message Types

```javascript
class DataChannelManager {
  constructor(peerConnection) {
    this.peerConnection = peerConnection;
    this.dataChannels = new Map();
    this.messageHandlers = new Map();
  }

  createDataChannel(label, options = {}) {
    const dataChannel = this.peerConnection.createDataChannel(label, {
      ordered: true,
      ...options
    });

    this.setupDataChannel(dataChannel);
    return dataChannel;
  }

  setupDataChannel(dataChannel) {
    dataChannel.addEventListener('open', () => {
      console.log(`Data channel ${dataChannel.label} opened`);
    });

    dataChannel.addEventListener('close', () => {
      console.log(`Data channel ${dataChannel.label} closed`);
    });

    dataChannel.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(dataChannel.label, message);
    });

    dataChannel.addEventListener('error', (error) => {
      console.error(`Data channel ${dataChannel.label} error:`, error);
    });

    this.dataChannels.set(dataChannel.label, dataChannel);
  }

  handleRemoteDataChannel() {
    this.peerConnection.addEventListener('datachannel', (event) => {
      this.setupDataChannel(event.channel);
    });
  }

  sendMessage(label, type, data) {
    const dataChannel = this.dataChannels.get(label);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({ type, data }));
    }
  }

  onMessage(label, type, handler) {
    const key = `${label}:${type}`;
    this.messageHandlers.set(key, handler);
  }

  handleMessage(label, message) {
    const { type, data } = message;
    const key = `${label}:${type}`;
    const handler = this.messageHandlers.get(key);

    if (handler) {
      handler(data);
    }
  }
}

// Usage
const dcManager = new DataChannelManager(peerConnection);

// Create chat channel
const chatChannel = dcManager.createDataChannel('chat');

// Handle incoming chat messages
dcManager.onMessage('chat', 'text', (data) => {
  console.log('Chat message:', data.message);
});

// Send chat message
dcManager.sendMessage('chat', 'text', {
  message: 'Hello, WebRTC!',
  timestamp: Date.now()
});
```

---

## Best Practices

### Use Appropriate STUN/TURN Servers

```javascript
const peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    },
    {
      urls: ['turn:turnserver.example.com:3478'],
      username: 'user',
      credential: 'password'
    }
  ]
});
```

### Handle Connection State Changes

```javascript
peerConnection.addEventListener('connectionstatechange', () => {
  switch (peerConnection.connectionState) {
    case 'connected':
      console.log('Peers connected');
      break;
    case 'disconnected':
      console.log('Peers disconnected, attempting reconnection');
      // Attempt ICE restart
      break;
    case 'failed':
      console.log('Connection failed');
      // Handle failure
      break;
    case 'closed':
      console.log('Connection closed');
      break;
  }
});
```

### Implement Proper Cleanup

```javascript
async function cleanup() {
  // Stop all tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.getDataChannels().forEach(dc => dc.close());
    peerConnection.close();
  }

  // Close signaling connection
  if (signalingSocket) {
    signalingSocket.close();
  }
}
```

### Handle Track Replacement for Quality Adjustment

```javascript
async function switchVideoResolution(newWidth, newHeight) {
  try {
    const constraints = {
      video: {
        width: { ideal: newWidth },
        height: { ideal: newHeight }
      }
    };

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newTrack = newStream.getVideoTrack();

    const sender = peerConnection
      .getSenders()
      .find(s => s.track?.kind === 'video');

    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  } catch (error) {
    console.error('Error switching resolution:', error);
  }
}
```

### Implement Error Recovery

```javascript
async function handleConnectionError(error) {
  console.error('WebRTC Error:', error);

  if (error.name === 'NotAllowedError') {
    // User denied media access
  } else if (error.name === 'NotFoundError') {
    // No media devices found
  } else if (error.name === 'NotReadableError') {
    // Device in use or no permission
  }

  // Attempt recovery
  await cleanup();
  // Optionally restart connection
}
```

---

## Common Pitfalls

### Not Checking Browser Support

```javascript
// Wrong - assumes WebRTC is available
const pc = new RTCPeerConnection();

// Correct - check for support
if (navigator.mediaDevices?.getUserMedia &&
    window.RTCPeerConnection) {
  const pc = new RTCPeerConnection();
} else {
  console.error('WebRTC not supported');
}
```

### Forgetting to Handle Multiple Offers

```javascript
// Wrong - overwrites without checking
peerConnection.setRemoteDescription(offer);

// Correct - check signaling state
if (peerConnection.signalingState === 'stable' ||
    peerConnection.signalingState === 'have-remote-offer') {
  await peerConnection.setRemoteDescription(offer);
}
```

### Not Consuming Media Streams Properly

```javascript
// Wrong - stream ends immediately
const stream = await getUserMedia(constraints);

// Correct - keep reference and manage lifecycle
this.localStream = await getUserMedia(constraints);
videoElement.srcObject = this.localStream;
// Later: stop tracks when done
this.localStream.getTracks().forEach(track => track.stop());
```

### Ignoring CORS Issues with Media Files

```javascript
// For recording/playback, ensure proper CORS headers
// Server must return: Access-Control-Allow-Origin: *
// Or appropriate origin headers
```

### Not Implementing Timeout for Connection

```javascript
// Wrong - waits indefinitely
const pc = new RTCPeerConnection();

// Correct - set timeout
const timeout = setTimeout(() => {
  if (pc.connectionState !== 'connected') {
    console.error('Connection timeout');
    pc.close();
  }
}, 30000);

pc.addEventListener('connectionstatechange', () => {
  if (pc.connectionState === 'connected') {
    clearTimeout(timeout);
  }
});
```

---

## Performance Considerations

### Bandwidth Management

```javascript
async function adjustBitrate(maxBitrate) {
  const sender = peerConnection
    .getSenders()
    .find(s => s.track?.kind === 'video');

  if (sender) {
    const params = sender.getParameters();
    if (!params.encodings) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = maxBitrate;
    await sender.setParameters(params);
  }
}
```

### Frame Rate Control

```javascript
async function setFrameRate(frameRate) {
  const sender = peerConnection
    .getSenders()
    .find(s => s.track?.kind === 'video');

  if (sender) {
    const params = sender.getParameters();
    if (!params.encodings) {
      params.encodings = [{}];
    }
    params.encodings[0].maxFramerate = frameRate;
    await sender.setParameters(params);
  }
}
```

### CPU Optimization

```javascript
// Request lower resolution for CPU-constrained devices
const constraints = {
  video: {
    width: { ideal: devicePixelRatio > 2 ? 640 : 1280 },
    height: { ideal: devicePixelRatio > 2 ? 480 : 720 }
  }
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

### Selective Stream Capture

```javascript
// Only capture audio on low-bandwidth connections
async function getMediaBasedOnBandwidth() {
  const connection = navigator.connection || navigator.mozConnection;
  const isSlowConnection = connection?.effectiveType === '4g' ||
                          connection?.effectiveType === '3g';

  return {
    audio: true,
    video: !isSlowConnection
  };
}

const constraints = await getMediaBasedOnBandwidth();
const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

### Memory Management

```javascript
class ResourceManager {
  constructor() {
    this.activeStreams = new Set();
  }

  registerStream(stream) {
    this.activeStreams.add(stream);
  }

  unregisterStream(stream) {
    this.activeStreams.delete(stream);
  }

  cleanupAll() {
    this.activeStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.activeStreams.clear();
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Building a Video Conference with Multiple Participants

```javascript
class VideoConference {
  constructor(signalingURL) {
    this.peers = new Map();
    this.localStream = null;
    this.signalingSocket = null;
    this.signalingURL = signalingURL;
  }

  async initialize() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    this.connectToSignaling();
  }

  connectToSignaling() {
    this.signalingSocket = new WebSocket(this.signalingURL);
    this.signalingSocket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    });
  }

  async addPeer(userId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] }
      ]
    });

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream);
    });

    // Handle remote stream
    peerConnection.addEventListener('track', (event) => {
      const remoteVideo = document.getElementById(`video-${userId}`);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    });

    // Handle ICE candidates
    peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'icecandidate',
          candidate: event.candidate,
          to: userId
        });
      }
    });

    this.peers.set(userId, peerConnection);
    return peerConnection;
  }

  async handleSignalingMessage(message) {
    const { type, from, offer, answer, candidate } = message;

    switch (type) {
      case 'offer':
        await this.handleOffer(from, offer);
        break;
      case 'answer':
        await this.handleAnswer(from, answer);
        break;
      case 'icecandidate':
        await this.handleIceCandidate(from, candidate);
        break;
    }
  }

  async handleOffer(userId, offer) {
    let peerConnection = this.peers.get(userId);
    if (!peerConnection) {
      peerConnection = await this.addPeer(userId);
    }

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.sendSignalingMessage({
      type: 'answer',
      answer: answer,
      to: userId
    });
  }

  async handleAnswer(userId, answer) {
    const peerConnection = this.peers.get(userId);
    await peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(userId, candidate) {
    const peerConnection = this.peers.get(userId);
    if (candidate && peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  sendSignalingMessage(message) {
    this.signalingSocket.send(JSON.stringify(message));
  }

  async removePeer(userId) {
    const peerConnection = this.peers.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peers.delete(userId);
    }
  }

  async cleanup() {
    this.localStream.getTracks().forEach(track => track.stop());
    this.peers.forEach(pc => pc.close());
    this.signalingSocket.close();
  }
}
```

### Scenario 2: Implementing Voice Recording with WebRTC

```javascript
class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    });

    this.mediaRecorder.start();
  }

  stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'audio/webm'
        });
        resolve(blob);
      });

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  saveRecording(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## Interview Points

### How does WebRTC establish a P2P connection?

**Answer**: WebRTC uses a three-phase process:
1. **Signaling**: Exchange SDP (Session Description) and ICE candidates through a signaling server
2. **Candidate Gathering**: Both peers collect potential network addresses using STUN/TURN
3. **Connection Establishment**: The ICE framework selects the best candidate pair and establishes direct P2P connection

### What is STUN and when should we use TURN?

**Answer**:
- **STUN**: Discovers public IP and port, works for most NAT scenarios (80-90%)
- **TURN**: Relays media when direct connection fails (symmetric NAT, restrictive firewalls)
- Use TURN as fallback for reliability in enterprise/restricted networks

### Explain the difference between RTCSessionDescription and RTCIceCandidate

**Answer**:
- **RTCSessionDescription**: Contains SDP that describes media capabilities, codecs, and session information (Offer/Answer)
- **RTCIceCandidate**: Represents a network address candidate for connection establishment

### What are the connection states in RTCPeerConnection?

**Answer**:
- **new**: Initial state
- **connecting**: Attempting to establish connection
- **connected**: Connection established
- **disconnected**: Temporary disconnection
- **failed**: Permanent connection failure
- **closed**: Connection closed

### How do you handle media quality adaptation?

**Answer**:
- Monitor statistics using `getStats()`
- Adjust bitrate using `sender.setParameters()`
- Change resolution or frame rate based on network conditions
- Implement dynamic codec selection

### What security measures does WebRTC implement?

**Answer**:
- **DTLS**: Encrypts media transport
- **SRTP**: Encrypts RTP streams
- **Mandatory secure origins**: HTTPS or localhost
- **No persistent media storage**: Media not stored without explicit recording
- **User consent**: Permission required for camera/microphone

---

## Further Reading

### Official Resources
- [W3C WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [MDN WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [IETF WebRTC Standards](https://tools.ietf.org/wg/rtcweb/)

### Key RFCs
- RFC 3550: RTP (Real-time Transport Protocol)
- RFC 5245: ICE (Interactive Connectivity Establishment)
- RFC 3711: SRTP (Secure Real-time Transport Protocol)
- RFC 4566: SDP (Session Description Protocol)

### Learning Resources
- Google's WebRTC Samples: https://github.com/webrtc/samples
- WebRTC for the Curious: https://webrtcforthecurious.com
- Signaling Patterns: SFU vs MCU vs P2P architectures

### Related Technologies
- WebSocket for signaling
- MediaStream Recording API
- Canvas API for video processing
- Workers for CPU-intensive tasks

---

## Summary

WebRTC is a powerful technology for real-time communication that has become essential for modern web applications:

- **Core APIs**: `getUserMedia()`, `RTCPeerConnection`, `RTCDataChannel`
- **Protocols**: SDP for negotiation, ICE for connectivity, DTLS/SRTP for security
- **Signaling**: Custom implementation required for offer/answer exchange
- **NAT Traversal**: STUN discovers addresses, TURN provides relay
- **Peer-to-Peer**: Direct communication reduces latency and server load
- **Encryption**: All media encrypted by default with DTLS/SRTP
- **Adaptive**: Quality adjusts based on network conditions

WebRTC powers real-time applications from video conferencing to online gaming. Understanding its architecture, connection establishment, and best practices is crucial for building reliable real-time communication features.
