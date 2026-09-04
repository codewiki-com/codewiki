---
title: WebRTC
description: JavaScript WebRTC完全指南，实时音视频通信、点对点数据传输、信令机制与NAT穿透详解
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - WebRTC
  - 实时通信
  - 音视频
  - P2P
status: imported
origin: old/src/content/docs/javascript/webrtc.zh.md
divergence: 0.194
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

WebRTC（Web Real-Time Communication）是一项开放的实时通信技术，允许浏览器之间直接进行音频、视频和数据的点对点传输，无需中间服务器转发媒体数据。它由 Google 主导开发，现已成为 W3C 标准。

### 核心特性

- **点对点通信**：浏览器之间直接建立连接，降低延迟
- **媒体捕获**：访问摄像头、麦克风和屏幕共享
- **安全传输**：所有数据均经过 DTLS/SRTP 加密
- **NAT 穿透**：通过 ICE 框架解决网络地址转换问题
- **自适应质量**：根据网络状况动态调整码率

### 应用场景

WebRTC 广泛应用于：
- 视频会议（Zoom、Google Meet、腾讯会议）
- 语音通话（Discord、微信网页版）
- 直播连麦
- 在线教育
- 远程协作
- 物联网设备控制
- 实时游戏

---

## 核心原理

### WebRTC 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                          应用层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   getUserMedia │  │ RTCPeerConnection│  │  RTCDataChannel │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                          会话层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     SDP      │  │     ICE      │  │   SRTP/DTLS  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                          传输层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     UDP      │  │     STUN     │  │     TURN     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 连接建立流程

WebRTC 连接建立需要经过信令交换、ICE 候选收集和媒体协商三个阶段：

```
发起方 (Caller)                    信令服务器                    接收方 (Callee)
    │                                  │                              │
    │  1. 创建 RTCPeerConnection       │                              │
    │  2. 创建 Offer                   │                              │
    │─────────────────────────────────>│                              │
    │           发送 Offer SDP         │                              │
    │                                  │─────────────────────────────>│
    │                                  │          转发 Offer          │
    │                                  │                              │
    │                                  │  3. 创建 RTCPeerConnection   │
    │                                  │  4. 设置远程描述             │
    │                                  │  5. 创建 Answer              │
    │                                  │<─────────────────────────────│
    │                                  │          发送 Answer         │
    │<─────────────────────────────────│                              │
    │           转发 Answer            │                              │
    │  6. 设置远程描述                 │                              │
    │                                  │                              │
    │<═══════════════════════════════════════════════════════════════>│
    │                    7. ICE 候选交换                              │
    │<═══════════════════════════════════════════════════════════════>│
    │                    8. P2P 连接建立                              │
    │                                  │                              │
```

### 信令（Signaling）

WebRTC 本身不定义信令协议，需要应用自行实现。信令用于交换：

1. **SDP（Session Description Protocol）**：描述媒体能力、编解码器、传输参数
2. **ICE 候选（ICE Candidates）**：网络连接候选地址

常用的信令实现方式：
- WebSocket
- Server-Sent Events (SSE)
- 轮询
- Socket.io

### ICE（Interactive Connectivity Establishment）

ICE 框架用于在复杂网络环境下建立点对点连接：

```javascript
// ICE 候选类型
// 1. host: 本地网络地址
// 2. srflx (Server Reflexive): STUN 服务器返回的公网地址
// 3. relay: TURN 服务器的中继地址
// 4. prflx (Peer Reflexive): 从对等方发现的地址

const iceCandidate = {
  candidate: "candidate:842163049 1 udp 1677729535 192.168.1.100 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0",
  sdpMid: "0",
  sdpMLineIndex: 0
};
```

### STUN 和 TURN

**STUN（Session Traversal Utilities for NAT）**：
- 帮助设备发现自己的公网 IP 和端口
- 检测 NAT 类型
- 免费且轻量

**TURN（Traversal Using Relays around NAT）**：
- 当 P2P 连接失败时，通过服务器中继数据
- 消耗服务器带宽，成本较高
- 作为最后的备选方案

```javascript
const configuration = {
  iceServers: [
    // STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN 服务器（需要认证）
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'password'
    },
    // TURNS（TLS 加密的 TURN）
    {
      urls: 'turns:turn.example.com:443',
      username: 'user',
      credential: 'password'
    }
  ]
};
```

---

## 核心要点

### 三大核心 API

1. **MediaStream API**：捕获音视频
2. **RTCPeerConnection**：建立点对点连接
3. **RTCDataChannel**：传输任意数据

### SDP 结构

```
v=0                                    // 版本
o=- 123456 2 IN IP4 127.0.0.1         // 会话标识
s=-                                    // 会话名称
t=0 0                                  // 时间信息
a=group:BUNDLE 0 1                     // 媒体捆绑
m=audio 9 UDP/TLS/RTP/SAVPF 111 103   // 音频媒体行
c=IN IP4 0.0.0.0                       // 连接信息
a=rtcp:9 IN IP4 0.0.0.0               // RTCP 信息
a=ice-ufrag:xxxx                       // ICE 用户片段
a=ice-pwd:xxxx                         // ICE 密码
a=fingerprint:sha-256 xx:xx:xx         // DTLS 指纹
a=rtpmap:111 opus/48000/2              // 编解码器映射
m=video 9 UDP/TLS/RTP/SAVPF 96 97     // 视频媒体行
a=rtpmap:96 VP8/90000                  // VP8 编解码器
a=rtpmap:97 H264/90000                 // H264 编解码器
```

### 连接状态

```javascript
// RTCPeerConnection 的连接状态
pc.connectionState:
  - 'new'         // 刚创建
  - 'connecting'  // 正在建立连接
  - 'connected'   // 连接成功
  - 'disconnected' // 暂时断开
  - 'failed'      // 连接失败
  - 'closed'      // 连接关闭

// ICE 连接状态
pc.iceConnectionState:
  - 'new'
  - 'checking'    // 正在检查候选
  - 'connected'   // 至少一个候选对连接成功
  - 'completed'   // 所有候选检查完成
  - 'failed'
  - 'disconnected'
  - 'closed'

// ICE 收集状态
pc.iceGatheringState:
  - 'new'
  - 'gathering'   // 正在收集候选
  - 'complete'    // 收集完成

// 信令状态
pc.signalingState:
  - 'stable'           // 无进行中的交换
  - 'have-local-offer' // 已设置本地 offer
  - 'have-remote-offer' // 已设置远程 offer
  - 'have-local-pranswer'
  - 'have-remote-pranswer'
  - 'closed'
```

---

## 代码示例

### 获取媒体流

```javascript
// 基本的音视频获取
async function getMediaStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // 显示本地视频
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;

    return stream;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      console.error('用户拒绝了媒体访问权限');
    } else if (error.name === 'NotFoundError') {
      console.error('未找到媒体设备');
    } else if (error.name === 'NotReadableError') {
      console.error('媒体设备被占用');
    } else {
      console.error('获取媒体流失败:', error);
    }
    throw error;
  }
}

// 高级媒体约束
async function getHighQualityStream() {
  const constraints = {
    video: {
      width: { min: 640, ideal: 1920, max: 3840 },
      height: { min: 480, ideal: 1080, max: 2160 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user', // 'user' 前置, 'environment' 后置
      aspectRatio: 16/9
    },
    audio: {
      echoCancellation: true,  // 回声消除
      noiseSuppression: true,  // 噪声抑制
      autoGainControl: true,   // 自动增益控制
      sampleRate: 48000,
      channelCount: 2
    }
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

// 获取屏幕共享
async function getScreenShare() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always', // 显示光标
        displaySurface: 'monitor' // 'monitor', 'window', 'browser'
      },
      audio: true // 系统音频（部分浏览器支持）
    });

    // 监听用户停止共享
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      console.log('用户停止了屏幕共享');
    });

    return stream;
  } catch (error) {
    console.error('屏幕共享失败:', error);
    throw error;
  }
}

// 枚举可用设备
async function listDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();

  const videoInputs = devices.filter(d => d.kind === 'videoinput');
  const audioInputs = devices.filter(d => d.kind === 'audioinput');
  const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

  console.log('摄像头:', videoInputs);
  console.log('麦克风:', audioInputs);
  console.log('扬声器:', audioOutputs);

  return { videoInputs, audioInputs, audioOutputs };
}

// 切换摄像头
async function switchCamera(deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: true
  });
  return stream;
}
```

### 建立点对点连接

```javascript
class WebRTCConnection {
  constructor(signalingChannel) {
    this.signaling = signalingChannel;
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;

    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };
  }

  async initialize() {
    // 创建 RTCPeerConnection
    this.pc = new RTCPeerConnection(this.configuration);

    // 设置事件监听
    this.setupEventListeners();

    // 获取本地媒体流
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // 添加本地轨道到连接
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    return this.localStream;
  }

  setupEventListeners() {
    // ICE 候选事件
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('发现 ICE 候选:', event.candidate.type);
        this.signaling.send({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // 接收远程轨道
    this.pc.ontrack = (event) => {
      console.log('收到远程轨道:', event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);

      // 更新远程视频元素
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = this.remoteStream;
    };

    // 连接状态变化
    this.pc.onconnectionstatechange = () => {
      console.log('连接状态:', this.pc.connectionState);
      switch (this.pc.connectionState) {
        case 'connected':
          console.log('WebRTC 连接成功！');
          break;
        case 'disconnected':
          console.log('连接暂时断开，尝试重连...');
          break;
        case 'failed':
          console.error('连接失败');
          this.handleConnectionFailure();
          break;
        case 'closed':
          console.log('连接已关闭');
          break;
      }
    };

    // ICE 连接状态变化
    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE 连接状态:', this.pc.iceConnectionState);
    };

    // ICE 收集状态变化
    this.pc.onicegatheringstatechange = () => {
      console.log('ICE 收集状态:', this.pc.iceGatheringState);
    };

    // 协商需要
    this.pc.onnegotiationneeded = async () => {
      console.log('需要重新协商');
      try {
        await this.createOffer();
      } catch (error) {
        console.error('协商失败:', error);
      }
    };
  }

  // 发起呼叫（创建 Offer）
  async createOffer() {
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.pc.setLocalDescription(offer);

      console.log('创建 Offer:', offer.sdp.substring(0, 100) + '...');

      this.signaling.send({
        type: 'offer',
        sdp: this.pc.localDescription
      });
    } catch (error) {
      console.error('创建 Offer 失败:', error);
      throw error;
    }
  }

  // 处理收到的 Offer
  async handleOffer(offer) {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      console.log('创建 Answer');

      this.signaling.send({
        type: 'answer',
        sdp: this.pc.localDescription
      });
    } catch (error) {
      console.error('处理 Offer 失败:', error);
      throw error;
    }
  }

  // 处理收到的 Answer
  async handleAnswer(answer) {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('设置远程 Answer 成功');
    } catch (error) {
      console.error('处理 Answer 失败:', error);
      throw error;
    }
  }

  // 处理 ICE 候选
  async handleIceCandidate(candidate) {
    try {
      if (candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('添加 ICE 候选成功');
      }
    } catch (error) {
      console.error('添加 ICE 候选失败:', error);
    }
  }

  // 处理连接失败
  handleConnectionFailure() {
    // 可以尝试 ICE 重启
    this.restartIce();
  }

  // ICE 重启
  async restartIce() {
    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);

      this.signaling.send({
        type: 'offer',
        sdp: this.pc.localDescription
      });
    } catch (error) {
      console.error('ICE 重启失败:', error);
    }
  }

  // 静音/取消静音
  toggleAudio(enabled) {
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  // 开启/关闭视频
  toggleVideo(enabled) {
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  // 替换视频轨道（如切换摄像头或屏幕共享）
  async replaceVideoTrack(newTrack) {
    const sender = this.pc.getSenders().find(s =>
      s.track && s.track.kind === 'video'
    );

    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  // 获取连接统计信息
  async getStats() {
    const stats = await this.pc.getStats();
    const report = {};

    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
        report.videoReceived = {
          bytesReceived: stat.bytesReceived,
          packetsReceived: stat.packetsReceived,
          packetsLost: stat.packetsLost,
          framesDecoded: stat.framesDecoded,
          frameWidth: stat.frameWidth,
          frameHeight: stat.frameHeight,
          framesPerSecond: stat.framesPerSecond
        };
      }
      if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
        report.videoSent = {
          bytesSent: stat.bytesSent,
          packetsSent: stat.packetsSent,
          framesEncoded: stat.framesEncoded,
          frameWidth: stat.frameWidth,
          frameHeight: stat.frameHeight,
          framesPerSecond: stat.framesPerSecond
        };
      }
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        report.connection = {
          localCandidateType: stat.localCandidateType,
          remoteCandidateType: stat.remoteCandidateType,
          currentRoundTripTime: stat.currentRoundTripTime,
          availableOutgoingBitrate: stat.availableOutgoingBitrate
        };
      }
    });

    return report;
  }

  // 关闭连接
  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.pc) {
      this.pc.close();
    }
  }
}
```

### 信令服务器实现

```javascript
// 简单的 WebSocket 信令客户端
class SignalingChannel {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.handlers = new Map();
    this.roomId = null;
    this.userId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('信令服务器连接成功');
        resolve();
      };

      this.socket.onerror = (error) => {
        console.error('信令服务器错误:', error);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('信令服务器连接关闭');
        this.reconnect();
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
    });
  }

  handleMessage(message) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  on(type, handler) {
    this.handlers.set(type, handler);
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        ...message,
        roomId: this.roomId,
        from: this.userId
      }));
    }
  }

  joinRoom(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    this.send({ type: 'join', roomId, userId });
  }

  leaveRoom() {
    this.send({ type: 'leave' });
    this.roomId = null;
  }

  reconnect() {
    setTimeout(() => {
      console.log('尝试重新连接...');
      this.connect().then(() => {
        if (this.roomId && this.userId) {
          this.joinRoom(this.roomId, this.userId);
        }
      });
    }, 3000);
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// 使用示例
async function startVideoCall() {
  const signaling = new SignalingChannel('wss://signaling.example.com');
  await signaling.connect();

  const rtc = new WebRTCConnection(signaling);
  const localStream = await rtc.initialize();

  // 显示本地视频
  document.getElementById('localVideo').srcObject = localStream;

  // 加入房间
  signaling.joinRoom('room-123', 'user-' + Date.now());

  // 处理信令消息
  signaling.on('offer', (msg) => rtc.handleOffer(msg.sdp));
  signaling.on('answer', (msg) => rtc.handleAnswer(msg.sdp));
  signaling.on('ice-candidate', (msg) => rtc.handleIceCandidate(msg.candidate));

  signaling.on('user-joined', async (msg) => {
    console.log('用户加入:', msg.userId);
    // 新用户加入时，发起呼叫
    await rtc.createOffer();
  });

  return { signaling, rtc };
}
```

### RTCDataChannel 数据通道

```javascript
class DataChannelManager {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.channels = new Map();
  }

  // 创建数据通道
  createChannel(label, options = {}) {
    const defaultOptions = {
      ordered: true,           // 保证顺序
      maxRetransmits: 3,       // 最大重传次数
      // maxPacketLifeTime: 3000 // 或者设置最大生命周期（ms）
    };

    const channel = this.pc.createDataChannel(label, {
      ...defaultOptions,
      ...options
    });

    this.setupChannelEvents(channel);
    this.channels.set(label, channel);

    return channel;
  }

  // 创建可靠的有序通道（适合文件传输）
  createReliableChannel(label) {
    return this.createChannel(label, {
      ordered: true
    });
  }

  // 创建不可靠的无序通道（适合实时游戏）
  createUnreliableChannel(label) {
    return this.createChannel(label, {
      ordered: false,
      maxRetransmits: 0
    });
  }

  setupChannelEvents(channel) {
    channel.onopen = () => {
      console.log(`数据通道 "${channel.label}" 已打开`);
    };

    channel.onclose = () => {
      console.log(`数据通道 "${channel.label}" 已关闭`);
      this.channels.delete(channel.label);
    };

    channel.onerror = (error) => {
      console.error(`数据通道 "${channel.label}" 错误:`, error);
    };

    channel.onmessage = (event) => {
      console.log(`收到消息 (${channel.label}):`, event.data);
    };
  }

  // 处理接收到的数据通道
  handleIncomingChannel(channel) {
    console.log(`收到远程数据通道: "${channel.label}"`);
    this.setupChannelEvents(channel);
    this.channels.set(channel.label, channel);
  }

  // 发送文本消息
  sendText(label, text) {
    const channel = this.channels.get(label);
    if (channel && channel.readyState === 'open') {
      channel.send(text);
    }
  }

  // 发送 JSON 数据
  sendJSON(label, data) {
    this.sendText(label, JSON.stringify(data));
  }

  // 发送二进制数据
  sendBinary(label, arrayBuffer) {
    const channel = this.channels.get(label);
    if (channel && channel.readyState === 'open') {
      channel.send(arrayBuffer);
    }
  }

  // 获取通道状态
  getChannelState(label) {
    const channel = this.channels.get(label);
    return channel ? channel.readyState : 'not-found';
  }

  // 关闭通道
  closeChannel(label) {
    const channel = this.channels.get(label);
    if (channel) {
      channel.close();
    }
  }

  // 关闭所有通道
  closeAll() {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
  }
}

// 使用数据通道的完整示例
async function setupDataChannels(pc) {
  const dcManager = new DataChannelManager(pc);

  // 创建聊天通道
  const chatChannel = dcManager.createReliableChannel('chat');
  chatChannel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    displayChatMessage(message);
  };

  // 创建游戏状态通道（低延迟）
  const gameChannel = dcManager.createUnreliableChannel('game');
  gameChannel.onmessage = (event) => {
    const state = JSON.parse(event.data);
    updateGameState(state);
  };

  // 处理远程创建的通道
  pc.ondatachannel = (event) => {
    dcManager.handleIncomingChannel(event.channel);
  };

  return dcManager;
}
```

### 文件传输

```javascript
class FileTransfer {
  constructor(dataChannel, chunkSize = 16384) {
    this.channel = dataChannel;
    this.chunkSize = chunkSize;
    this.receivedChunks = [];
    this.receivedSize = 0;
    this.fileMetadata = null;
  }

  // 发送文件
  async sendFile(file, onProgress) {
    // 发送文件元数据
    const metadata = {
      type: 'file-metadata',
      name: file.name,
      size: file.size,
      mimeType: file.type
    };
    this.channel.send(JSON.stringify(metadata));

    // 读取并分块发送文件
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      // 等待缓冲区有空间
      while (this.channel.bufferedAmount > 65535) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      this.channel.send(chunk);

      if (onProgress) {
        onProgress((i + 1) / totalChunks * 100);
      }
    }

    // 发送完成标记
    this.channel.send(JSON.stringify({ type: 'file-complete' }));
  }

  // 接收文件处理
  handleMessage(data, onProgress, onComplete) {
    if (typeof data === 'string') {
      const message = JSON.parse(data);

      if (message.type === 'file-metadata') {
        this.fileMetadata = message;
        this.receivedChunks = [];
        this.receivedSize = 0;
      } else if (message.type === 'file-complete') {
        this.assembleFile(onComplete);
      }
    } else {
      // 二进制数据块
      this.receivedChunks.push(data);
      this.receivedSize += data.byteLength;

      if (onProgress && this.fileMetadata) {
        onProgress(this.receivedSize / this.fileMetadata.size * 100);
      }
    }
  }

  // 组装文件
  assembleFile(onComplete) {
    const blob = new Blob(this.receivedChunks, {
      type: this.fileMetadata.mimeType
    });

    const file = new File([blob], this.fileMetadata.name, {
      type: this.fileMetadata.mimeType
    });

    onComplete(file);

    // 清理
    this.receivedChunks = [];
    this.receivedSize = 0;
    this.fileMetadata = null;
  }
}

// 使用示例
async function transferFile(dataChannel) {
  const fileTransfer = new FileTransfer(dataChannel);

  // 发送方
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    await fileTransfer.sendFile(file, (progress) => {
      console.log(`发送进度: ${progress.toFixed(2)}%`);
    });
  });

  // 接收方
  dataChannel.onmessage = (event) => {
    fileTransfer.handleMessage(
      event.data,
      (progress) => console.log(`接收进度: ${progress.toFixed(2)}%`),
      (file) => {
        // 下载文件
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    );
  };
}
```

---

## 最佳实践

### 连接管理

```javascript
class RobustWebRTCConnection {
  constructor(config) {
    this.config = config;
    this.pc = null;
    this.connectionTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    this.pc = new RTCPeerConnection(this.config.iceServers);

    // 设置连接超时
    this.connectionTimeout = setTimeout(() => {
      if (this.pc.connectionState !== 'connected') {
        console.log('连接超时，尝试重连');
        this.reconnect();
      }
    }, 30000);

    // 监控连接质量
    this.startQualityMonitoring();

    return this.pc;
  }

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      this.onFatalError?.();
      return;
    }

    this.reconnectAttempts++;
    console.log(`重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // 指数退避
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (error) {
      console.error('重连失败:', error);
      this.reconnect();
    }
  }

  startQualityMonitoring() {
    setInterval(async () => {
      if (this.pc?.connectionState === 'connected') {
        const stats = await this.pc.getStats();
        this.analyzeQuality(stats);
      }
    }, 5000);
  }

  analyzeQuality(stats) {
    let packetLoss = 0;
    let jitter = 0;
    let rtt = 0;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        packetLoss = report.packetsLost / report.packetsReceived;
        jitter = report.jitter;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime;
      }
    });

    // 质量评估
    if (packetLoss > 0.1) {
      console.warn('高丢包率:', (packetLoss * 100).toFixed(2) + '%');
      this.adjustQuality('low');
    } else if (packetLoss < 0.01 && rtt < 0.1) {
      this.adjustQuality('high');
    }
  }

  adjustQuality(level) {
    const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
    if (!sender) return;

    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) return;

    switch (level) {
      case 'high':
        params.encodings[0].maxBitrate = 2500000;
        params.encodings[0].maxFramerate = 30;
        break;
      case 'medium':
        params.encodings[0].maxBitrate = 1000000;
        params.encodings[0].maxFramerate = 24;
        break;
      case 'low':
        params.encodings[0].maxBitrate = 500000;
        params.encodings[0].maxFramerate = 15;
        break;
    }

    sender.setParameters(params);
  }
}
```

### 多人会议架构

```javascript
// 网格（Mesh）架构 - 适合少量参与者
class MeshConference {
  constructor(signaling) {
    this.signaling = signaling;
    this.peers = new Map(); // peerId -> RTCPeerConnection
    this.localStream = null;
  }

  async join(roomId) {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    this.signaling.on('user-joined', (peerId) => {
      this.connectToPeer(peerId, true);
    });

    this.signaling.on('user-left', (peerId) => {
      this.disconnectPeer(peerId);
    });

    this.signaling.joinRoom(roomId);
  }

  async connectToPeer(peerId, isInitiator) {
    const pc = new RTCPeerConnection(this.iceServers);
    this.peers.set(peerId, pc);

    // 添加本地流
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
    });

    // 处理远程流
    pc.ontrack = (event) => {
      this.onRemoteStream(peerId, event.streams[0]);
    };

    // ICE 候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.send({
          type: 'ice-candidate',
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signaling.send({
        type: 'offer',
        to: peerId,
        sdp: pc.localDescription
      });
    }
  }

  disconnectPeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.onPeerDisconnected(peerId);
    }
  }

  // 限制：参与者过多时性能下降
  // 每个参与者需要 N-1 个连接
  // 适合 4-6 人的小型会议
}

// SFU（Selective Forwarding Unit）架构 - 适合大型会议
// 需要媒体服务器支持（如 mediasoup、Janus、Jitsi）
class SFUConference {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
  }

  async join(roomId) {
    // 连接到 SFU 服务器
    const device = new mediasoupClient.Device();

    // 获取服务器 RTP 能力
    const routerRtpCapabilities = await this.getRouterCapabilities();
    await device.load({ routerRtpCapabilities });

    // 创建发送传输
    this.sendTransport = await this.createSendTransport(device);

    // 创建接收传输
    this.recvTransport = await this.createRecvTransport(device);

    // 发布本地媒体
    await this.publishMedia();

    // 订阅其他参与者
    await this.subscribeToParticipants();
  }

  // SFU 优势：
  // - 每个客户端只需一个上行连接
  // - 服务器转发媒体，减轻客户端负担
  // - 支持更多参与者
  // - 可实现 Simulcast（多层编码）
}
```

### Simulcast 实现

```javascript
// Simulcast 允许发送多个分辨率的视频流
async function enableSimulcast(pc, videoTrack) {
  const sender = pc.getSenders().find(s => s.track === videoTrack);

  const params = sender.getParameters();
  if (!params.encodings) {
    params.encodings = [{}];
  }

  // 设置三层编码
  params.encodings = [
    {
      rid: 'high',
      maxBitrate: 2500000,
      maxFramerate: 30,
      scaleResolutionDownBy: 1
    },
    {
      rid: 'medium',
      maxBitrate: 1000000,
      maxFramerate: 24,
      scaleResolutionDownBy: 2
    },
    {
      rid: 'low',
      maxBitrate: 300000,
      maxFramerate: 15,
      scaleResolutionDownBy: 4
    }
  ];

  await sender.setParameters(params);
}

// 创建支持 Simulcast 的 Offer
async function createSimulcastOffer(pc) {
  const transceiver = pc.getTransceivers().find(t =>
    t.sender.track?.kind === 'video'
  );

  if (transceiver) {
    transceiver.setCodecPreferences([
      // 优先使用 VP8（Simulcast 支持更好）
      { mimeType: 'video/VP8', clockRate: 90000 },
      { mimeType: 'video/H264', clockRate: 90000 }
    ]);
  }

  const offer = await pc.createOffer();

  // 修改 SDP 以支持 Simulcast
  let sdp = offer.sdp;
  sdp = sdp.replace(
    'a=ssrc:',
    'a=simulcast:send high;medium;low\r\na=ssrc:'
  );

  return new RTCSessionDescription({
    type: 'offer',
    sdp: sdp
  });
}
```

---

## 常见陷阱

### ICE 候选收集不完整

```javascript
// 错误：过早发送 Offer
async function badExample() {
  const pc = new RTCPeerConnection(config);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // 立即发送，可能还没收集到所有 ICE 候选
  sendOffer(offer); // 可能导致连接失败
}

// 正确：等待 ICE 收集完成或使用 Trickle ICE
async function goodExample() {
  const pc = new RTCPeerConnection(config);

  // 方式 1: 等待所有候选收集完成
  await new Promise(resolve => {
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      }
    };
  });

  // 方式 2: Trickle ICE（推荐）
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      // 增量发送候选
      sendIceCandidate(event.candidate);
    } else {
      // null 表示收集完成
      console.log('ICE 收集完成');
    }
  };
}
```

### 媒体轨道顺序问题

```javascript
// 错误：假设轨道顺序固定
pc.ontrack = (event) => {
  // 可能出错，轨道顺序不确定
  if (event.track.kind === 'video') {
    videoElement.srcObject = event.streams[0];
  }
};

// 正确：使用 MediaStream 管理轨道
const remoteStream = new MediaStream();
pc.ontrack = (event) => {
  remoteStream.addTrack(event.track);
  videoElement.srcObject = remoteStream;
};
```

### 内存泄漏

```javascript
// 错误：未清理资源
function startCall() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const pc = new RTCPeerConnection(config);
  // ... 连接逻辑
  // 页面关闭时没有清理
}

// 正确：正确清理所有资源
class CallSession {
  constructor() {
    this.stream = null;
    this.pc = null;
    this.cleanup = this.cleanup.bind(this);

    window.addEventListener('beforeunload', this.cleanup);
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.pc = new RTCPeerConnection(config);
    // ...
  }

  cleanup() {
    // 停止所有轨道
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // 关闭连接
    if (this.pc) {
      this.pc.close();
    }

    // 移除事件监听
    window.removeEventListener('beforeunload', this.cleanup);
  }
}
```

### 信令竞争条件

```javascript
// 错误：处理信令消息时可能出现竞争
signaling.on('offer', async (offer) => {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendAnswer(answer);
});

// 如果在处理 offer 时收到新的 offer，会出错

// 正确：使用队列或状态机
class SignalingHandler {
  constructor(pc) {
    this.pc = pc;
    this.isProcessing = false;
    this.queue = [];
  }

  async handleOffer(offer) {
    if (this.isProcessing) {
      this.queue.push({ type: 'offer', data: offer });
      return;
    }

    this.isProcessing = true;

    try {
      // 检查信令状态
      if (this.pc.signalingState !== 'stable') {
        // 正在进行协商，需要回滚
        await Promise.all([
          this.pc.setLocalDescription({ type: 'rollback' }),
          this.pc.setRemoteDescription(offer)
        ]);
      } else {
        await this.pc.setRemoteDescription(offer);
      }

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      sendAnswer(answer);

    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length > 0 && !this.isProcessing) {
      const next = this.queue.shift();
      this.handleOffer(next.data);
    }
  }
}
```

### 浏览器兼容性问题

```javascript
// 处理不同浏览器的差异
function createCompatiblePeerConnection() {
  const RTCPeerConnection = window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection;

  if (!RTCPeerConnection) {
    throw new Error('WebRTC 不受支持');
  }

  return new RTCPeerConnection(config);
}

// 处理 getUserMedia 兼容性
async function getCompatibleUserMedia(constraints) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  // 旧版 API
  const getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  if (!getUserMedia) {
    throw new Error('getUserMedia 不受支持');
  }

  return new Promise((resolve, reject) => {
    getUserMedia.call(navigator, constraints, resolve, reject);
  });
}

// 推荐使用 adapter.js 处理兼容性
// <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
```

---

## 性能考量

### 码率控制

```javascript
// 动态调整视频码率
async function adjustBitrate(pc, targetBitrate) {
  const sender = pc.getSenders().find(s => s.track?.kind === 'video');
  if (!sender) return;

  const params = sender.getParameters();
  if (!params.encodings || params.encodings.length === 0) {
    params.encodings = [{}];
  }

  params.encodings[0].maxBitrate = targetBitrate;
  await sender.setParameters(params);
}

// 基于网络状况自动调整
async function adaptiveQuality(pc) {
  const stats = await pc.getStats();
  let availableBandwidth = 0;

  stats.forEach(report => {
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      availableBandwidth = report.availableOutgoingBitrate || 0;
    }
  });

  // 使用可用带宽的 80%
  const targetBitrate = Math.floor(availableBandwidth * 0.8);
  await adjustBitrate(pc, targetBitrate);
}
```

### 硬件加速

```javascript
// 优先使用硬件编码
async function preferHardwareCodecs(pc) {
  const transceiver = pc.getTransceivers().find(t =>
    t.sender.track?.kind === 'video'
  );

  if (!transceiver) return;

  const codecs = RTCRtpSender.getCapabilities('video').codecs;

  // 优先硬件编码的顺序
  const preferredOrder = ['video/VP9', 'video/H264', 'video/VP8'];

  const sortedCodecs = codecs.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.mimeType);
    const bIndex = preferredOrder.indexOf(b.mimeType);
    return aIndex - bIndex;
  });

  transceiver.setCodecPreferences(sortedCodecs);
}
```

### 资源优化

```javascript
// 根据场景选择合适的约束
function getOptimizedConstraints(scenario) {
  switch (scenario) {
    case 'video-call':
      return {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };

    case 'screen-share':
      return {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      };

    case 'audio-only':
      return {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

    case 'low-bandwidth':
      return {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 24 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };
  }
}

// 暂停/恢复视频以节省带宽
function toggleVideoTrack(stream, enabled) {
  stream.getVideoTracks().forEach(track => {
    track.enabled = enabled;
  });
}
```

### 监控与诊断

```javascript
class WebRTCMonitor {
  constructor(pc) {
    this.pc = pc;
    this.statsHistory = [];
    this.interval = null;
  }

  start(intervalMs = 1000) {
    this.interval = setInterval(() => {
      this.collectStats();
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async collectStats() {
    const stats = await this.pc.getStats();
    const report = {
      timestamp: Date.now(),
      video: { sent: {}, received: {} },
      audio: { sent: {}, received: {} },
      connection: {}
    };

    stats.forEach(stat => {
      switch (stat.type) {
        case 'outbound-rtp':
          if (stat.kind === 'video') {
            report.video.sent = {
              bytesSent: stat.bytesSent,
              packetsSent: stat.packetsSent,
              framesEncoded: stat.framesEncoded,
              framesPerSecond: stat.framesPerSecond,
              qualityLimitationReason: stat.qualityLimitationReason
            };
          } else if (stat.kind === 'audio') {
            report.audio.sent = {
              bytesSent: stat.bytesSent,
              packetsSent: stat.packetsSent
            };
          }
          break;

        case 'inbound-rtp':
          if (stat.kind === 'video') {
            report.video.received = {
              bytesReceived: stat.bytesReceived,
              packetsReceived: stat.packetsReceived,
              packetsLost: stat.packetsLost,
              framesDecoded: stat.framesDecoded,
              framesPerSecond: stat.framesPerSecond,
              jitter: stat.jitter
            };
          } else if (stat.kind === 'audio') {
            report.audio.received = {
              bytesReceived: stat.bytesReceived,
              packetsReceived: stat.packetsReceived,
              packetsLost: stat.packetsLost,
              jitter: stat.jitter
            };
          }
          break;

        case 'candidate-pair':
          if (stat.state === 'succeeded') {
            report.connection = {
              localCandidateType: stat.localCandidateType,
              remoteCandidateType: stat.remoteCandidateType,
              rtt: stat.currentRoundTripTime,
              availableBitrate: stat.availableOutgoingBitrate
            };
          }
          break;
      }
    });

    this.statsHistory.push(report);

    // 保留最近 60 秒的数据
    const cutoff = Date.now() - 60000;
    this.statsHistory = this.statsHistory.filter(r => r.timestamp > cutoff);

    // 分析并报告问题
    this.analyzeQuality(report);
  }

  analyzeQuality(report) {
    const issues = [];

    // 检查丢包率
    if (report.video.received.packetsLost > 0) {
      const lossRate = report.video.received.packetsLost /
        (report.video.received.packetsReceived + report.video.received.packetsLost);
      if (lossRate > 0.05) {
        issues.push(`高视频丢包率: ${(lossRate * 100).toFixed(2)}%`);
      }
    }

    // 检查延迟
    if (report.connection.rtt > 0.3) {
      issues.push(`高延迟: ${(report.connection.rtt * 1000).toFixed(0)}ms`);
    }

    // 检查质量限制
    if (report.video.sent.qualityLimitationReason !== 'none') {
      issues.push(`质量受限: ${report.video.sent.qualityLimitationReason}`);
    }

    if (issues.length > 0) {
      console.warn('WebRTC 质量问题:', issues);
    }
  }

  getReport() {
    return {
      history: this.statsHistory,
      current: this.statsHistory[this.statsHistory.length - 1]
    };
  }
}
```

---

## 实战场景

### 一对一视频通话

```javascript
class OneToOneCall {
  constructor(signalingUrl, localVideoEl, remoteVideoEl) {
    this.signaling = new WebSocket(signalingUrl);
    this.localVideoEl = localVideoEl;
    this.remoteVideoEl = remoteVideoEl;
    this.pc = null;
    this.localStream = null;

    this.setupSignaling();
  }

  setupSignaling() {
    this.signaling.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.sdp);
          break;
        case 'answer':
          await this.pc.setRemoteDescription(message.sdp);
          break;
        case 'ice-candidate':
          await this.pc.addIceCandidate(message.candidate);
          break;
        case 'call-ended':
          this.endCall();
          break;
      }
    };
  }

  async startCall(targetUserId) {
    await this.initializeMedia();
    await this.createPeerConnection();

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.send({
      type: 'offer',
      to: targetUserId,
      sdp: this.pc.localDescription
    });
  }

  async handleOffer(offer) {
    await this.initializeMedia();
    await this.createPeerConnection();

    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.send({
      type: 'answer',
      sdp: this.pc.localDescription
    });
  }

  async initializeMedia() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.localVideoEl.srcObject = this.localStream;
  }

  async createPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    this.pc.ontrack = (event) => {
      this.remoteVideoEl.srcObject = event.streams[0];
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('连接状态:', this.pc.connectionState);
    };
  }

  toggleMute() {
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
  }

  toggleVideo() {
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.pc) {
      this.pc.close();
    }
    this.localVideoEl.srcObject = null;
    this.remoteVideoEl.srcObject = null;

    this.send({ type: 'call-ended' });
  }

  send(message) {
    this.signaling.send(JSON.stringify(message));
  }
}

// 使用
const call = new OneToOneCall(
  'wss://signaling.example.com',
  document.getElementById('localVideo'),
  document.getElementById('remoteVideo')
);

// 发起呼叫
document.getElementById('callBtn').onclick = () => {
  call.startCall('user-123');
};

// 挂断
document.getElementById('hangupBtn').onclick = () => {
  call.endCall();
};
```

### 实时屏幕共享

```javascript
class ScreenShare {
  constructor(pc) {
    this.pc = pc;
    this.screenStream = null;
    this.originalVideoTrack = null;
  }

  async startSharing() {
    // 保存原始视频轨道
    const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
    this.originalVideoTrack = sender?.track;

    // 获取屏幕流
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: true
    });

    // 替换视频轨道
    const screenTrack = this.screenStream.getVideoTracks()[0];
    if (sender) {
      await sender.replaceTrack(screenTrack);
    }

    // 监听用户停止共享
    screenTrack.addEventListener('ended', () => {
      this.stopSharing();
    });

    return this.screenStream;
  }

  async stopSharing() {
    // 停止屏幕流
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    // 恢复原始视频轨道
    if (this.originalVideoTrack) {
      const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(this.originalVideoTrack);
      }
    }

    this.screenStream = null;
  }

  // 同时显示摄像头和屏幕（画中画）
  async startPiPSharing() {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 }
    });

    // 创建合成画布
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const screenVideo = document.createElement('video');
    screenVideo.srcObject = screenStream;
    screenVideo.play();

    const cameraVideo = document.createElement('video');
    cameraVideo.srcObject = cameraStream;
    cameraVideo.play();

    // 合成视频
    const compositeStream = canvas.captureStream(30);

    function draw() {
      // 绘制屏幕
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
      // 绘制摄像头（右下角）
      ctx.drawImage(cameraVideo, canvas.width - 330, canvas.height - 250, 320, 240);
      requestAnimationFrame(draw);
    }
    draw();

    return compositeStream;
  }
}
```

### 实时协作白板

```javascript
class CollaborativeWhiteboard {
  constructor(canvas, dataChannel) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.channel = dataChannel;
    this.isDrawing = false;
    this.lastPoint = null;
    this.color = '#000000';
    this.lineWidth = 2;

    this.setupCanvas();
    this.setupChannel();
  }

  setupCanvas() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      this.lastPoint = this.getPoint(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;

      const point = this.getPoint(e);
      this.drawLine(this.lastPoint, point, this.color, this.lineWidth);

      // 发送到远端
      this.channel.send(JSON.stringify({
        type: 'draw',
        from: this.lastPoint,
        to: point,
        color: this.color,
        lineWidth: this.lineWidth
      }));

      this.lastPoint = point;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDrawing = false;
    });
  }

  setupChannel() {
    this.channel.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'draw':
          this.drawLine(data.from, data.to, data.color, data.lineWidth);
          break;
        case 'clear':
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          break;
        case 'sync-request':
          this.sendCanvasData();
          break;
        case 'sync-data':
          this.loadCanvasData(data.imageData);
          break;
      }
    };
  }

  getPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  drawLine(from, to, color, lineWidth) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.channel.send(JSON.stringify({ type: 'clear' }));
  }

  setColor(color) {
    this.color = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  requestSync() {
    this.channel.send(JSON.stringify({ type: 'sync-request' }));
  }

  sendCanvasData() {
    const imageData = this.canvas.toDataURL();
    this.channel.send(JSON.stringify({
      type: 'sync-data',
      imageData: imageData
    }));
  }

  loadCanvasData(imageData) {
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  }
}
```

---

## 面试要点

### WebRTC 的核心组件是什么？

**答案：**
- **MediaStream API**：获取音视频流
- **RTCPeerConnection**：建立和管理 P2P 连接
- **RTCDataChannel**：传输任意数据
- **信令机制**：交换 SDP 和 ICE 候选（WebRTC 不定义具体协议）

### 解释 ICE、STUN、TURN 的作用

**答案：**
- **ICE**：交互式连接建立框架，用于在复杂网络环境中找到最佳连接路径
- **STUN**：帮助设备发现公网 IP 和端口，检测 NAT 类型
- **TURN**：当 P2P 连接失败时，通过服务器中继数据

### WebRTC 连接建立的流程

**答案：**
1. 创建 RTCPeerConnection
2. 获取本地媒体流并添加轨道
3. 创建 Offer（发起方）
4. 通过信令交换 SDP
5. 设置本地和远程描述
6. 收集并交换 ICE 候选
7. 建立 P2P 连接

### SDP 是什么？包含哪些信息？

**答案：**
SDP（Session Description Protocol）是会话描述协议，包含：
- 媒体类型（音频/视频）
- 编解码器信息
- 传输协议
- ICE 候选信息
- 加密参数

### 如何处理 NAT 穿透问题？

**答案：**
1. 使用 STUN 服务器获取公网地址
2. 尝试直接 P2P 连接
3. 如果失败，使用 TURN 服务器中继
4. ICE 框架会自动选择最佳路径

### Mesh、SFU、MCU 架构的区别

**答案：**
- **Mesh**：每个参与者与其他所有人直连，适合小型会议（4-6人）
- **SFU**：服务器转发媒体流，不进行处理，适合中大型会议
- **MCU**：服务器混合媒体流后分发，服务器压力大，适合需要录制的场景

### 如何优化 WebRTC 性能？

**答案：**
- 使用 Simulcast 发送多层编码
- 根据网络状况动态调整码率
- 使用硬件编码
- 合理设置媒体约束
- 使用可转移对象传输大数据
- 监控连接质量并自适应

### WebRTC 的安全机制

**答案：**
- DTLS（Datagram Transport Layer Security）加密
- SRTP（Secure Real-time Transport Protocol）媒体加密
- 强制使用加密，无法禁用
- 需要用户授权才能访问媒体设备

---

## 延伸阅读

### 官方文档

- [WebRTC 官网](https://webrtc.org/)
- [MDN WebRTC API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API)
- [W3C WebRTC 规范](https://www.w3.org/TR/webrtc/)

### 开源项目

- [adapter.js](https://github.com/webrtcHacks/adapter) - 浏览器兼容性垫片
- [simple-peer](https://github.com/feross/simple-peer) - 简化的 WebRTC 封装
- [PeerJS](https://peerjs.com/) - 简单易用的 WebRTC 库
- [mediasoup](https://mediasoup.org/) - 强大的 SFU 服务器
- [Janus Gateway](https://janus.conf.meetecho.com/) - 通用 WebRTC 服务器
- [Jitsi Meet](https://jitsi.org/jitsi-meet/) - 开源视频会议

### 学习资源

- [WebRTC for the Curious](https://webrtcforthecurious.com/) - 深入理解 WebRTC
- [High Performance Browser Networking - WebRTC](https://hpbn.co/webrtc/)
- [Google Codelabs - WebRTC](https://codelabs.developers.google.com/codelabs/webrtc-web/)

### 调试工具

- [chrome://webrtc-internals](chrome://webrtc-internals) - Chrome 内置调试工具
- [webrtc-stats](https://webrtc.github.io/samples/src/content/peerconnection/stats/) - 统计信息示例
- [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) - ICE 候选测试

### STUN/TURN 服务

- [Google STUN 服务器](stun:stun.l.google.com:19302)
- [Twilio TURN 服务](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/) - TURN 服务提供商
- [coturn](https://github.com/coturn/coturn) - 开源 TURN 服务器
