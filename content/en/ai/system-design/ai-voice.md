---
title: "AI Voice Technology in Depth: From ASR and TTS to Engineering Real-Time Voice Agents"
description: "Explains the engineering pipeline of AI voice systems, covering audio capture, VAD, ASR, LLM, TTS, streaming playback, interruption handling (barge-in), low-latency optimization, and architectural selection across cloud APIs, local models, and edge-cloud hybrids."
category: "AI Application Development"
tag:
  - "AI Voice"
  - "ASR"
  - "TTS"
  - "VAD"
  - "Voice Agent"
head:
  - - meta
    - name: keywords
      content: "AI Voice,ASR,TTS,VAD,Real-time Voice Agent,Speech to Speech,Speech Recognition,Speech Synthesis,Edge-Cloud Hybrid,Realtime API"
lang: en
sourceRef: zh-ref/ai/system-design/ai-voice.md
---

Hello everyone, I'm Xiao G.

When many developers build an AI voice application for the first time, the architecture they envision is usually simple: the user speaks, speech is converted to text, fed to an LLM, and the generated response is spoken aloud.

It sounds like just three chained invocations: **ASR -> LLM -> TTS**.

Once pushed to production, however, issues emerge immediately: the user hasn't finished speaking, but the system prematurely cuts them off; the user tries to interrupt, but the AI drones on relentlessly; background air conditioners or typing sounds cause the ASR to transcribe gibberish; minor network jitter causes downstream audio playback to stutter badly; the generated text response looks fine on screen, but the voice interaction feels as sluggish and unnatural as an outdated phone tree.

Connecting a microphone and speaker to a text-based Agent yields nothing more than a talking Demo; a production system must master real-time audio pipelines, speech models, conversational state machines, and edge-cloud coordination.

Below, we first explain the individual responsibilities of ASR, TTS, and VAD, and then discuss audio capture, streaming transport, playback queues, and state machines based on the interview-guide project. Finally, we analyze the trade-offs of cloud APIs, local models, and edge-cloud hybrid architectures across different scenarios.

## Terminology Notes

To avoid confusion while reading, core terminology used throughout this article is defined as follows:

- **Client-side / Edge** = Client (browser/app), referring to frontend code executing on the user's device
- **Barge-in** = Interruption / speaking over, referring to the user actively interrupting the AI while the model is responding
- **Partial results** = Streaming intermediate outputs returned by ASR in real time
- **Cascaded architecture** = Pipeline architecture chaining ASR + LLM + TTS in sequential stages
- **Native Realtime API** = Real-time multimodal voice interface, typically audio-in, audio-out, optionally streaming text events and tool-calling events simultaneously

## What Problem Does an AI Voice System Actually Solve?

Let us first clarify the fundamental problem we are solving.

A Voice Agent functions much like a real-time collaborative system: while the user speaks, the system must simultaneously process comprehension, generation, and playback. Compared to text chat, voice introduces several critical dimensions:

- **Real-time constraints**: The system must begin working while the user is still speaking, rather than waiting for speech to fully conclude.
- **Multimodal nuance**: Tone, pauses, and emotional inflections are completely lost in pure text.
- **Interruption capability**: Humans naturally speak over and interrupt each other; machines must support this seamlessly.
- **End-to-end latency**: A 1-second delay in text chat is barely noticed; a 1-second pause in voice conversation feels like the other party is completely unresponsive.

Voice interactions commonly seen on the market fall into two broad categories:

1. **Command-based voice assistants**: Common in smart homes and in-vehicle controls. The user says "turn on the AC," and the system maps speech to predefined intents and device commands. Products like Siri and Xiao AI are also integrating open-ended Q&A capabilities, so they cannot be viewed strictly as static menus.
2. **LLM Voice Agents**: Capable of comprehending open-ended questions, invoking tools, and sustaining multi-turn dialogues. If you ask "Help me check why that API timed out last week," it must understand your intent, retrieve context, synthesize an answer, and confirm details back and forth with you via voice.

The engineering focus of these two categories differs substantially. The rest of this article focuses on the engineering implementation of LLM Voice Agents.

## How Does Automatic Speech Recognition (ASR) Turn Audio into Text?

ASR (Automatic Speech Recognition) appears on the surface to be just "audio in, text out," but behind the scenes, it involves at least three distinct judgments:

1. What characters were spoken in this audio segment.
2. How to segment those characters into words and sentences.
3. How to normalize punctuation, numbers, English words, and technical terminology.

For example, if a user says "Help me check out Java 21's virtual threads," the ASR must concurrently recognize Chinese, English, numbers, and technical terms. If it misinterprets this phonetically into random nonsensical characters, even the strongest downstream LLM will spend cycles guessing.

### Three Architectural Paths for ASR

| Type | Representative Solutions | Advantages | Limitations | Best Suited Scenarios |
| --- | --- | --- | --- | --- |
| Cloud API | OpenAI Audio Transcriptions (`gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`, `gpt-4o-transcribe-diarize`), Azure Speech, Google Speech, Deepgram, Alibaba Cloud ASR | Rapid integration, broad language coverage, zero maintenance overhead | Ongoing API costs, network latency, strict data compliance constraints | Customer service, meeting transcription, lightweight voice assistants |
| Open-Source Generic Models | Whisper, faster-whisper, Whisper.cpp, FunASR | Deployable on-premise, strong control, supports private environments; faster-whisper integrates Silero VAD | Real-time performance requires custom engineering; Whisper turbo is not trained for translation, yielding poor translation results | Private transcription, offline subtitling, corporate intranets |
| Domain-Specific Models | Dedicated ASR for finance, healthcare, automotive | Superior adaptation to specialized vocabulary and heavy accents | High data preparation and training costs | High-frequency vertical domains, specialized business lexicons |

**Supplementary Notes**:

- OpenAI's `gpt-4o-transcribe-diarize` supports speaker diarization labels, making it ideal for multi-speaker scenarios like meetings. It currently only applies to `/v1/audio/transcriptions` and does not support the Realtime API; when audio exceeds 30 seconds, a `chunking_strategy` must be configured; it also does not support `prompt`, `logprobs`, or `timestamp_granularities[]`. If speaker diarization is not required, prioritize `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, or `whisper-1`.
- Whisper turbo (large-v3-turbo) is an inference-optimized version of large-v3. It is fast but **not trained on translation tasks**; running `--task translate` outputs the source language rather than English. Use medium or large when translation is needed.
- Real-time streaming transcription must be evaluated separately from batch audio file transcription. Current OpenAI documentation places low-latency live transcription under Realtime transcription using the `gpt-realtime-whisper` model, whereas file uploads and speaker separation run via Audio Transcriptions.

**Selection Guidance**: If your core requirement is "real-time conversation," do not look solely at offline WER (Word Error Rate). You should prioritize:

- **First-chunk latency**: The elapsed time from when the user stops speaking until the first character appears
- **Stability of partial results**: Whether the transcription progress is visible smoothly in real time
- **Endpointing accuracy**: How reliably it detects when the user has actually finished speaking
- **Noise resilience**: Performance in far-field and multi-speaker environments
- **Custom vocabulary (hotwords)**: The ability to recognize your specific domain terms

### Streaming ASR vs. Non-Streaming ASR

For real-time conversations demanding low initial latency and natural barge-in, streaming ASR is standard; scenarios with strictly demarcated turns and short audio can also adopt non-streaming recognition. The main differences are:

- **Non-streaming ASR**: Waits for the user to finish speaking an entire segment before performing batch recognition. Latency = speech duration + recognition duration.
- **Streaming ASR**: Transcribes concurrently as the user speaks, delivering the final result almost immediately after the user stops. Latency ≈ endpointing delay + real-time inference delay.

The interview-guide project utilizes **Alibaba Cloud DashScope's qwen3-asr-flash-realtime**. This integration streams audio continuously over WebSocket, relying on server-side VAD to decide when to finalize a turn:

```java
// QwenAsrService.java
OmniRealtimeConfig config = OmniRealtimeConfig.builder()
    .modalities(Collections.singletonList(OmniRealtimeModality.TEXT))
    .enableTurnDetection(true)  // Enable server-side VAD
    .turnDetectionType("server_vad")
    .turnDetectionSilenceDurationMs(400)  // 400 ms silence determines user finished speaking
    .transcriptionConfig(transcriptionParam)
    .build();
```

The advantage of server-side VAD is that the client does not need to implement complex voice activity detection; the trade-off is encoded right in the parameter: `turnDetectionSilenceDurationMs(400)` specifies that 400 ms of silence must elapse before considering an utterance finished. DashScope documentation specifies an allowable range of 200–6000 ms. Lower values yield snappier responses but risk cutting off natural mid-sentence pauses; higher values segment sentences more conservatively at the expense of added latency. Client-side and server-side VAD can be combined, but this is not a mandatory architecture: when low-latency interruption is paramount, the client can report `speech_start`, while the server coordinates ASR and VAD events to confirm turn completion; when clients are lightweight or network conditions are stable, server-side endpointing alone can suffice.

## How Does Text-to-Speech (TTS) Turn Text into Sound?

TTS (Text To Speech) synthesizes model responses into audio. While it looks like merely an output layer, it heavily shapes how users perceive the entire Agent.

For the exact same sentence "Let me check that for you," different TTS engines can vary wildly across:

- How long the user must wait for the first audio packet
- Naturalness of timbre and whether long sentences breathe like a human
- Pronunciation accuracy for numbers, code snippets, and English acronyms
- Support for emotion, speech rate, pausing, and pitch modulation

### Technological Evolution of TTS

Traditional TTS pipelines involved multiple discrete stages:

```
Text Normalization -> Linguistic Analysis -> Acoustic Model -> Vocoder -> Waveform Output
```

Neural TTS, neural audio codecs, and generative voice models are increasingly consolidating these manual modules. VALL-E, Fish Speech, and CosyVoice employ different modeling approaches, and sound quality, latency, streaming capabilities, and deployment costs cannot be compared solely on whether they are "end-to-end." For real-time Voice Agents, beyond single-sentence audio quality, you must evaluate first-packet latency, streaming playback support, and state handling during interruptions.

If you must wait for the LLM to finish generating an entire paragraph before starting synthesis, the user experience will feel painfully slow. Synthesizing by short sentences or even streaming token chunks vastly improves perceived responsiveness.

### Two Approaches to Real-Time TTS

| Type | Representative Solutions | Characteristics |
| --- | --- | --- |
| Cloud Real-time TTS | OpenAI Speech, Alibaba Cloud qwen3-tts-flash-realtime / Qwen-TTS-Realtime, Azure TTS, ElevenLabs | Streaming output, low latency, real-time synthesis support |
| Local TTS | piper1-gpl (GPL-3.0, original Piper archived), Fish Speech (Fish Audio Research License), CosyVoice | Complete control, offline support; verify licenses for code, model weights, and voices before commercial use |

interview-guide also utilizes Alibaba Cloud real-time TTS, synthesizing audio over WebSocket. In DashScope's current Java SDK samples, the recommended model name is `qwen3-tts-flash-realtime`, while the wrapper class in the project remains named `QwenTtsRealtime`:

```java
// QwenTtsService.java
QwenTtsRealtimeConfig config = QwenTtsRealtimeConfig.builder()
    .voice(voice)  // Voice selection
    .responseFormat(QwenTtsRealtimeAudioFormat.PCM_24000HZ_MONO_16BIT)
    .mode("commit")  // Commit mode
    .languageType(languageType)
    .speechRate(speechRate)
    .volume(volume)
    .build();

// Send text, receive audio chunks in real time
qwenTtsRealtime.appendText(text);
qwenTtsRealtime.commit();
```

This code uses the `commit` mode, where the client appends text and actively invokes `commit()` to trigger synthesis. DashScope documentation also offers a `server_commit` mode, where the server decides the commit boundary, presenting a different trade-off between latency and sentence coherence.

## How Does VAD Control Conversational Turns?

VAD (Voice Activity Detection) is frequently overlooked, yet it exerts a massive impact on user experience.

VAD does not transcribe speech content; it outputs the probability of human speech within a short audio slice, or emits speech start and end events. The application uses these signals to determine:

- Has the user started speaking?
- Has the user finished speaking?
- Is the current speech activity sufficient to trigger an interruption or turn submission?

Standard VAD cannot distinguish whether sound originates from the user, bystanders, background music, or the device's own speaker playback. Echoes from system playback require AEC or speaker reference signals; multi-person environments may require speaker separation, voiceprints, or target-speaker VAD. Furthermore, real human speaking patterns complicate endpointing:

- Pauses mid-sentence: "This problem... let me think..."
- Short backchannel feedback: "Yeah," "Right," "No"
- Thinking while talking, with fluctuating volume
- Ambient chatter or the AI's own voice coming through the speaker

**Client-Side VAD vs. Server-Side VAD**

| Type | Representative Solutions | Advantages | Limitations |
| --- | --- | --- | --- |
| Client-Side VAD | WebRTC VAD, Silero VAD, @ricky0123/vad-web | Low latency, consumes zero server compute | Requires deploying models on client; thresholds and noise tuning must be handled manually |
| Server-Side VAD | DashScope ASR server_vad, OpenAI Realtime turn detection, built-in cloud ASR endpointing | Lightweight client logic, tighter integration with ASR | Increases server load, incurs network latency, segmentation policies constrained by vendor API |

> ⚠️ **Do not evaluate VAD solely on offline accuracy**: Short utterances (<1 second, like "Yeah," "Right," "No"), low-volume interruptions, far-field speech, and speaker echo cause online performance to diverge sharply from benchmark datasets. The faster-whisper README notes that Silero VAD's default configuration is conservative, removing only silences longer than 2 seconds. Relying on VAD as the sole criterion for barge-in will frequently miss short feedback.

The interview-guide frontend uses **@ricky0123/vad-web**, an ONNX-based client-side VAD:

```typescript
// AudioRecorder.tsx
const vadInstance = await window.vad.MicVAD.new({
  getStream: async () => stream,
  onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
  baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
  onSpeechStart: () => {
    onSpeechStart?.(); // User started speaking
  },
  onSpeechEnd: () => {
    onSpeechEnd?.(); // User finished speaking
  },
});
```

When client-side VAD triggers `onSpeechEnd`, it should not immediately commit unconditionally. Adding a configurable silence confirmation delay or correlating with server-side final transcription events prevents misinterpreting a brief pause as turn completion. This confirmation window should be calibrated using real production audio samples across languages and conversational paces, rather than assuming 300–500 ms is universally optimal.

My recommendation: **Do not treat VAD as a binary on/off switch; treat it as an emitter of conversational control signals**, such as:

- `speech_start`: User began speaking
- `speech_end`: Detected end of speech activity (optionally with confidence score)
- `maybe_barge_in`: Possible user interruption
- `non_speech`: No speech detected in current frame

## How Does a Complete Voice Conversation Run End-to-End?

Let us inspect the full pipeline end-to-end to better contextualize latency, barge-in, and edge-cloud orchestration.

A single turn in a Voice Agent dialogue encompasses these steps:

1. Audio Capture: The microphone captures raw audio
2. Preprocessing: Acoustic Echo Cancellation (AEC), Noise Suppression (NS), Automatic Gain Control (AGC)
3. VAD Detection: Detects whether speech is active and when it concludes
4. Audio Uplink: Uploads preprocessed audio to the server
5. ASR Transcription: Transcribes audio to text (streaming partial results)
6. Context Assembly: Concatenates system instructions, chat history, and tool schemas
7. LLM Inference: Understands intent, generates response, and invokes tools when necessary
8. TTS Synthesis: Synthesizes text into audio (streaming audio chunks)
9. Audio Downlink: Client plays audio chunks as they arrive
10. State Sync: Records the turn to prepare context for the next interaction

In a real-time pipeline, several tasks can be initiated before the user even finishes speaking.

High-performance systems pre-emptively execute tasks whenever possible:

- Load session state and tool schemas the moment speech starts
- Anticipate intent once ASR produces a stable prefix
- Start TTS synthesis the instant the LLM outputs the first complete clause
- Play a natural filler phrase ("Let me look into that...") if tool execution is slow

The strategy is straightforward: launch parallelizable tasks early, and use streaming pipelines to eliminate block-based waiting.

## Why Is Real-Time Voice So Much Harder Than Text Chat?

The difficulty of voice dialogue does not lie in any single model; it lies in the fact that the entire pipeline is tightly constrained by real-time latency budgets.

### Challenge 1: Extremely Tight Latency Budget

In text chat, a 1-second delay is barely noticed. In voice conversation, a 1-second pause feels jarringly unresponsive.

Turn latency accumulates across multiple stages:

| Stage | Typical Duration | Optimization Focus |
| --- | --- | --- |
| Capture & Encoding | Audio frame size, browser buffering | Smaller frame capture, minimize unnecessary buffers |
| VAD Endpointing | Waiting for silence to confirm completion | Dynamic silence thresholds, rapid commit for short utterances |
| ASR | Audio upload, decoding, partial stabilization | Streaming ASR, custom hotwords, client-side preprocessing |
| LLM | TTFT, tool calling, bloated context | Prompt caching, concise replies, async tool execution |
| TTS | First-packet synthesis, sentence splitting, vocoder inference | Clause-level streaming synthesis, warm-up voice models |
| Playback | Network jitter, decoding, player buffering | Streamed playback, bounded playback queues and buffers |

If each stage adds just 200 ms, the round-trip immediately feels delayed.

Real-time voice optimization must therefore fixate on end-to-end P95/P99 latency, rather than pushing a single isolated component to its theoretical limit. What the user perceives is the complete pipeline, not an isolated benchmark.

### Challenge 2: Interruption (Barge-in) Is Not a Simple Pause Button

A Voice Agent must support **Barge-in (speaking over the AI)**.

When a user says "Wait, that's not what I meant," the system must coordinate several actions simultaneously:

1. Recognize that this is the user speaking, not background noise or speaker echo
2. Immediately halt the local playback queue, avoiding playing out stale responses
3. Cancel ongoing LLM generation and TTS streaming on the server
4. Reconcile dialogue state by tracking what was spoken, what was unheard, and what was interrupted
5. Initiate the next comprehension turn using the new user audio

When interruption fails, the culprit is rarely just VAD inaccuracy; more often, the state machine lacks clear cancellation semantics. For instance, the player stops, but the server continues pushing TTS audio; or the LLM is canceled, but the dialogue history has already marked the unplayed portion as "said."

The interview-guide project implements this as:

```typescript
// VoiceInterviewPage.tsx
const handleAudioData = (audioData: string) => {
  // Stop sending audio when AI is speaking to avoid recognizing own voice
  if (isAiSpeakingRef.current) {
    return;
  }
  if (wsRef.current && wsRef.current.isConnected()) {
    wsRef.current.sendAudio(audioData);
  }
};
```

The frontend uses `isAiSpeakingRef` to track whether the AI is speaking, halting audio uplink while speaking. The backend listens for `control` messages to cancel generation.

### Challenge 3: Real Acoustic Environments Are Far More Hostile Than Test Labs

Voice demos are built in quiet offices; production deployments must survive:

- Cars, factories, shopping malls, subways
- Far-field microphones with users 2–3 meters away
- Multiple people talking simultaneously
- Users using speakerphone, causing AI output to bleed back into the microphone

This corrupts the entire pipeline:

- VAD mistakes noise for speech, triggering false activations
- ASR transcribes background voices, contaminating user intent
- TTS playback leaks into the mic, triggering self-interruption

The interview-guide frontend requests three standard audio preprocessing constraints via `getUserMedia`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true, // AEC: Acoustic Echo Cancellation
    noiseSuppression: true, // NS: Noise Suppression
    autoGainControl: true, // AGC: Automatic Gain Control
    sampleRate: 16000,
  },
});
```

While these parameters mitigate basic issues, they cannot solve everything. Browsers merely accept constraints and make best-effort attempts; actual efficacy depends on the OS, hardware, microphone, and playback volume. AEC degrades under loud speaker playback, and NS can inadvertently clip the user's voice. For mobile apps or hardware devices, client-side acoustic preprocessing demands significant engineering investment.

### Challenge 4: Context Extends Far Beyond Text History

In text Agents, context is primarily message history. In voice Agents, context encompasses much more:

- Whether the user is currently speaking
- Exactly how far the previous answer played before stopping
- Whether the user is asking a new question or interrupting an ongoing answer
- Whether ASR partial text has stabilized
- Whether the user's tone conveys doubt, denial, hesitation, or impatience
- Whether tool invocations are currently in flight

If you only feed finalized ASR text to the LLM, vital context is discarded.

For example, if a user says "No... I meant last month's order," the text reflects a correction, but obscures the fact that it was an interruption. If the system does not know how much of the previous response was actually heard, it cannot determine which statement the user was rejecting.

interview-guide defines distinct WebSocket message types to manage these states:

```typescript
// voiceInterview.ts
export interface WebSocketSubtitleMessage {
  type: "subtitle";
  text: string;
  isFinal: boolean; // true indicates this ASR segment is finalized or stable
}

export interface WebSocketAudioResponseMessage {
  type: "audio";
  data: string; // Base64 audio
  text: string; // Corresponding text
}

export interface WebSocketControlMessage {
  type: "control";
  action: string; // 'submit' | 'cancel' | 'pause'
  data?: Record<string, unknown>;
}
```

`isFinal` is an ASR event flag; it does not mean the user clicked or verbally signaled "submit." In manual-submission workflows, turn submission is confirmed via an explicit `control: submit` event. In automatic turn-taking mode, submission is decided jointly by endpointing, ASR final events, and business state, rather than overloading a single boolean.

### Challenge 5: False Interruption Caused by Speaker Echo

When audio played by the AI is captured by the microphone, VAD or ASR may mistake it for user speech, causing the AI to interrupt itself.

interview-guide's current workaround is:

```typescript
if (isAiSpeakingRef.current) {
  return; // Drop audio while AI is speaking
}
```

This "silent discard" strategy eliminates self-interruption, but it also completely blocks the user from speaking over the AI.

A more sophisticated approach typically involves:

- Continuing to ingest audio while the AI speaks, but withholding it from ASR
- Running client-side VAD on AEC-cleaned audio rather than raw mic input
- Correlating echo reference signals, multi-frame energy, VAD confidence, and playback queue states to confirm genuine user barge-in

### Challenge 6: Client-Side Capabilities Set the Experience Floor

Teams that offload all processing to the cloud often find user experience collapsing under flaky networks.

The client side must handle at least these core responsibilities:

- Microphone capture and audio preprocessing
- VAD or lightweight interruption detection
- Playback buffering, jitter smoothing, and playback cancellation
- Network disconnection alerts and reconnect logic

Cloud models determine the ceiling; client engineering sets the floor. This principle is nowhere more evident than in voice systems.

## How Is a Baseline Voice Agent Implemented in interview-guide?

Taking the interview-guide project as a concrete example, let us examine how a baseline voice interview Agent is implemented.

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  AudioRecorder        WebSocket         VoiceInterviewPage   │
│  - getUserMedia       - sendAudio       - State management   │
│  - AudioWorklet       - sendControl     - Manual submission  │
│  - VAD detection      - Control message - Chunked playback   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Spring Boot)                   │
├─────────────────────────────────────────────────────────────┤
│  VoiceInterviewWebSocketHandler                             │
│  - Session lifecycle (create, pause, resume, end)            │
│  - ASR ready / reconnect state synchronization              │
│  - Audio routing to ASR, trigger LLM upon manual submit      │
│  - LLM sentence streaming output, push TTS while synthesizing│
├─────────────────────────────────────────────────────────────┤
│  QwenAsrService          DashscopeLlmService      QwenTtsService │
│  - qwen3-asr-flash-      - qwen-max / qwen-plus   - qwen-tts-    │
│    realtime              - Tool calling support   realtime       │
└─────────────────────────────────────────────────────────────┘
```

### Frontend: Audio Capture and VAD

The core of the frontend is the `AudioRecorder` component, which executes the following steps:

**Step 1: Obtain microphone permissions and configure audio constraints:**

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000, // ASR requires 16 kHz
  },
});
```

**Step 2: Initialize client-side VAD:**

```typescript
const vadInstance = await window.vad.MicVAD.new({
  getStream: async () => stream,
  onSpeechStart: () => {
    onSpeechStart?.(); // Trigger callback
  },
  onSpeechEnd: () => {
    onSpeechEnd?.();
  },
});
await vadInstance.start();
```

**Step 3: Capture chunked audio using AudioWorklet:**

VAD's `onSpeechEnd` merely indicates speech activity may have ended; audio must still be streamed to the server in continuous chunks. interview-guide implements this as:

```typescript
await audioContext.audioWorklet.addModule("/audio-worklet/pcm-processor.js");

const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
workletNode.port.onmessage = (event) => {
  if (!recordingActiveRef.current) {
    return;
  }
  const base64 = arrayBufferToBase64(event.data as ArrayBuffer);
  onAudioData(base64); // 200 ms Int16 PCM, sent to backend ASR
};

source.connect(workletNode);
workletNode.connect(gainNode);
gainNode.connect(audioContext.destination);
```

`pcm-processor.js` runs on the dedicated audio rendering thread, resampling browser Float32 audio to 16 kHz Int16 PCM, packaging it into 200 ms chunks and dispatching them back to the main thread via `postMessage`. Unlike the deprecated `ScriptProcessorNode`, `AudioWorkletNode` avoids burdening the main UI thread, minimizing latency spikes and interface jank.

Here arises a design question: **Why not wait until VAD triggers `onSpeechEnd` before uploading audio?**

Because VAD detection requires a confirmation window; waiting for it to confirm speech has ended before beginning audio upload adds significant delay. Streaming chunks continuously is far superior; VAD `onSpeechEnd` then simply signals the backend: "This utterance may be finished; prepare to submit to the LLM."

In interview-guide, the interview scenario avoids automatic submission on silence detection. Instead, it uses **continuous ASR transcription with manual user submission**. This prevents cutting off candidates while they pause to think, and prevents new utterances from overwriting previous ones: the frontend treats ASR text as an answer draft, and transitions to the next interview round only when a `submit` control message is explicitly triggered.

### Frontend: Audio Playback

interview-guide supports two playback modes:

**Mode 1: HTMLAudioElement (Simple Scenarios):**

```typescript
// VoiceInterviewPage.tsx
const onAudioResponse = (audioData: string, text: string) => {
  if (audioData && audioData.length > 0) {
    setAiAudio(audioData); // Set src, trigger auto-play
    setAiText(text);
    setAiSpeaking(true);

    // Watchdog timer to prevent UI freeze if audio playback fails
    const durationMs = estimateWavDurationMs(audioData);
    audioPlaybackWatchdogRef.current = setTimeout(
      finishAiPlayback,
      Math.min(Math.max(durationMs + 1500, 4000), 60_000),
    );
  }
};
```

**Mode 2: AudioContext Chunked Playback (Fine-Grained Control):**

```typescript
// Chunked processing
const handleAudioChunk = (
  base64Wav: string,
  _index: number,
  isLast: boolean,
) => {
  // 1. Decode WAV
  const binaryStr = atob(base64Wav);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Parses standard 44-byte WAV header and 24 kHz mono 16-bit PCM.
  // If the server returns variable WAV formats, parse headers dynamically.
  const pcmOffset = 44;
  const pcmData = new Int16Array(
    bytes.buffer,
    pcmOffset,
    (bytes.length - pcmOffset) / 2,
  );
  const float32 = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    float32[i] = pcmData[i] / 32768;
  }

  const audioBuffer = ctx.createBuffer(1, float32.length, 24_000);
  audioBuffer.copyToChannel(float32, 0);

  // 2. Enqueue in playback queue
  chunkQueueRef.current.push(audioBuffer);
  if (!isChunkPlayingRef.current) {
    playNextChunk();
  }

  // 3. When last chunk or server audio_complete arrives, await queue drain
  if (isLast) {
    scheduleChunkDrainCompletion();
  }
};

// Play next chunk
const playNextChunk = () => {
  if (chunkQueueRef.current.length === 0) {
    isChunkPlayingRef.current = false;
    return;
  }
  const buffer = chunkQueueRef.current.shift()!;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.onended = () => playNextChunk();
  source.start(0);
};
```

Chunked playback starts playing audio much sooner without waiting for the entire audio file to download. The trade-off is that you must manually manage queues, ordering, cancellation, and "end-of-stream" semantics.

In recent revisions, the backend also pushes an explicit `audio_complete` control message after all TTS chunks have been emitted. The frontend no longer depends solely on an audio chunk carrying `isLast=true`. Even if synthesis of a particular sentence fails, the system smoothly concludes the "interviewer is speaking" state once all buffered chunks finish playing.

> ⚠️ **Note**: Modern browsers enforce an autoplay policy requiring `AudioContext` to be created or resumed after a user gesture. Creating an `AudioContext` on page load leaves it in a `suspended` state. Always invoke `audioContext.resume()` when the user clicks "Start Interview" to guarantee playback works.

### Backend: WebSocket Session Management

The backend manages the session lifecycle via `VoiceInterviewWebSocketHandler`:

```java
// VoiceInterviewWebSocketHandler.java
public class VoiceInterviewWebSocketHandler {
    // Session state: idle -> listening -> thinking -> speaking -> completed
    // Supported actions: pause, resume, end

    // Received client audio
    public void handleAudioMessage(String sessionId, String audioBase64) {
        asrService.sendAudio(sessionId, decodeBase64(audioBase64));
    }

    // Received client control message
    public void handleControlMessage(String sessionId, String action, Map data) {
        switch (action) {
            case "submit" -> llmService.triggerResponse(sessionId, data);
            case "cancel" -> cancelCurrentGeneration(sessionId);
            case "pause" -> pauseSession(sessionId);
        }
    }
}
```

The interview-guide session state machine:

| State | Meaning | Permitted Transitions |
| --- | --- | --- |
| IN_PROGRESS | Interview active | PAUSED, COMPLETED |
| PAUSED | Paused (user left tab or paused explicitly) | IN_PROGRESS |
| COMPLETED | Interview concluded | - |

The pause/resume mechanism is vital. When a user answers a phone call or switches tabs, they can pause the interview and resume seamlessly later.

### Backend: ASR Service

The backend ASR service encapsulates the Alibaba Cloud DashScope API:

```java
// QwenAsrService.java
public void startTranscription(
    String sessionId,
    Consumer<String> onFinal,
    Consumer<String> onPartial,
    Runnable onReady,
    Consumer<Throwable> onError
) {
    // 1. Create conversation and establish WebSocket connection
    OmniRealtimeConversation conversation = new OmniRealtimeConversation(param, callback);
    conversation.connect();

    // 2. Configure: enable server VAD, 400 ms silence determines end
    OmniRealtimeConfig config = OmniRealtimeConfig.builder()
        .enableTurnDetection(true)
        .turnDetectionSilenceDurationMs(400)
        .build();

    // 3. Send session config; cannot immediately mark local state as ready
    conversation.updateSession(config);
}

// 4. Callback opens audio uplink only after receiving server session.updated event
public void onSessionUpdated(String sessionId) {
    AsrSession asrSession = sessions.get(sessionId);
    asrSession.markReady();
    asrSession.getOnReady().run(); // Notify frontend: asr_ready
}

public void sendAudio(String sessionId, byte[] audioData) {
    AsrSession session = sessions.get(sessionId);
    if (!session.awaitReady(1200)) {
        throw new IllegalStateException("ASR session not ready");
    }
    String audioBase64 = Base64.getEncoder().encodeToString(audioData);
    session.getConversation().appendAudio(audioBase64);
}
```

This coordination is critical. `new OmniRealtimeConversation(...)` merely instantiates the object; `connect()` establishes the socket. After `updateSession(config)` is sent, the system must wait for the server's `session.updated` event. The frontend should disable the microphone until it receives the backend `asr_ready` message; if ready times out or returns an error, the backend closes the stale connection, re-establishes the session, and pushes reconnection state to the frontend.

When the server returns transcription results, the handler streams partial text to the frontend:

```java
// WebSocket pushes incremental subtitle
websocket.sendMessage(new WebSocketSubtitleMessage(
    "subtitle",
    transcript,
    isFinal  // true indicates finalized segment
));
```

### Backend: TTS Service

```java
// QwenTtsService.java
public byte[] synthesize(String text) throws Exception {
    CountDownLatch latch = new CountDownLatch(1);
    ByteArrayContainer audioContainer = new ByteArrayContainer();

    QwenTtsRealtime qwenTts = new QwenTtsRealtime(param, callback);
    try {
        qwenTts.connect();

        QwenTtsRealtimeConfig config = QwenTtsRealtimeConfig.builder()
            .voice(voice)  // e.g. "Cherry"
            .responseFormat(QwenTtsRealtimeAudioFormat.PCM_24000HZ_MONO_16BIT)
            .speechRate(speechRate)
            .build();

        qwenTts.updateSession(config);
        qwenTts.appendText(text);
        qwenTts.commit();

        if (!latch.await(30, TimeUnit.SECONDS)) {
            throw new TimeoutException("TTS synthesis timed out");
        }
        return audioContainer.toByteArray();
    } finally {
        qwenTts.close();
    }
}
```

The sample omits detailed callback mappings, but handles timeouts safely. Production code must close connections on cancellation and restore the thread interrupt flag when catching `InterruptedException`.

Upon receiving PCM chunks, the handler converts them to WAV and streams them to the frontend:

```java
// As each complete sentence is emitted by LLM, submit to concurrent TTS queue
OrderedTtsChunkEmitter chunkEmitter = new OrderedTtsChunkEmitter(session, semaphore);
llmService.chatStreamSentences(userText, sentence -> {
    chunkEmitter.submit(sentence);
});

// Stream TTS chunks in sentence order, followed by audio_complete control message
chunkEmitter.finish();
chunkEmitter.awaitCompletion();
```

The objective is to compress overall wait time: **the LLM streams sentences, the TTS synthesizes them concurrently, and the frontend plays them sequentially**. The backend uses `max-concurrent-tts-per-session` to throttle concurrency, and `tts-timeout-seconds` to prevent a single stalled clause from blocking playback; if all clause-level syntheses fail, it falls back to full-paragraph synthesis.

## How to Enable Barge-in for a Voice Agent?

Interruption is a frequent engineering hurdle that a simple pause button cannot solve.

### The Three Layers of Interruption

1. **Playback Layer**: Cease audio playback immediately when user speech begins
2. **Generation Layer**: Cancel in-flight LLM generation and TTS synthesis on the server
3. **Context Layer**: Accurately log what was spoken versus what remained unheard

interview-guide's baseline version does not implement full barge-in. The snippet below merely drops microphone audio while the AI is speaking to prevent speaker echo from triggering ASR; the drawback is that genuine user interruptions are discarded:

```typescript
// Current baseline: discard mic audio while AI speaks
const handleAudioData = (audioData: string) => {
  if (isAiSpeakingRef.current) {
    return;
  }
  wsRef.current.sendAudio(audioData);
};

// When audio playback finishes
const finishAiPlayback = () => {
  aiAudioPendingRef.current = false;
  clearAudioPlaybackWatchdog();
  setAiSpeaking(false);
  setIsSubmitting(false);

  // Commit full text only after playback finishes normally
  commitAiMessage(aiTextRef.current.trim());
};
```

To support true barge-in, client-side VAD must continue monitoring user speech during playback. Upon detection, it must halt the current audio player, flush the unplayed buffer, and send a `cancel` message to ongoing backend LLM/TTS streams. Dialogue context must then record only the text actually spoken; the existing `finishAiPlayback()` only commits the complete response at the very end, lacking this capability.

### Interruption from a State Machine Perspective

From a state machine standpoint, interruption is a control transition accessible from almost any state:

| Current State | User Interruption | Proper System Response |
| --- | --- | --- |
| listening | User continues speaking | Continue capturing and transcribing; this is not an interruption |
| thinking | User adds clarification | Cancel ongoing inference, re-trigger LLM with updated input |
| speaking | User speaks over AI | Immediately halt playback, drain audio queue |
| tool_calling | User says "Never mind" | Cancel query if read-only; route to compensation, idempotency, or manual review if side-effects occurred |

Without unambiguous cancellation semantics, the system quickly degrades into chaos: the AI attempts to listen to a new query while continuing to speak the old answer.

## What Roles Do Browser Audio Capture and Preprocessing Play?

WebRTC is often used colloquially to refer to all browser real-time audio/video features. A Voice Agent architecture must distinguish between browser audio capture/preprocessing APIs and the WebRTC real-time transport protocol.

**Key Distinctions**:

- **Media Capture and Streams API** (`getUserMedia`): Captures microphone audio and configures constraints like AEC, NS, AGC, and sample rate. This is what interview-guide actually uses.
- **WebRTC Protocol** (`RTCPeerConnection`): Handles end-to-end real-time network transport, incorporating ICE, DTLS-SRTP, and RTP. This transport stack is required only when connecting to OpenAI Realtime API's WebRTC mode, Azure Voice Live, or custom WebRTC media servers.

interview-guide's audio path is:

```
getUserMedia → AudioWorklet → Base64 Encoding → WebSocket Transport
```

The transport layer here is **WebSocket (TCP)**, not WebRTC's **RTP/SRTP**. WebSocket guarantees packet order, but TCP retransmissions can introduce jitter under poor network conditions. WebRTC prioritizes UDP with jitter buffers and packet loss concealment to minimize latency, falling back to TCP/TURN only when networks are restrictive.

### Browser Audio Preprocessing Pipeline

In a Voice Agent, the browser preprocessing pipeline operates as follows:

```
Microphone Input
    │
    ▼
┌─────────────────────────┐
│  AEC (Echo Cancellation)│  Cancels speaker playback audio
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  NS (Noise Suppression) │  Suppresses background noise
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  AGC (Auto Gain Control)│  Stabilizes volume levels
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  VAD (Voice Activity)   │  Detects presence of human voice
└─────────────────────────┘
    │
    ▼
Encoded Output
```

### getUserMedia Configuration Choices

interview-guide uses standard `getUserMedia` settings:

```typescript
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
  },
});
```

Different environments warrant different trade-offs:

| Parameter | true | false | Recommendation |
| --- | --- | --- | --- |
| echoCancellation | Eliminates speaker echo, but can slightly degrade vocal fidelity | Preserves raw fidelity, but requires custom AEC | Keep true |
| noiseSuppression | Attenuates ambient noise, but may clip soft speech | Requires custom NS | True in noisy rooms; false in quiet studios |
| autoGainControl | Dynamically adjusts volume to optimal levels | Relies on raw mic input gain | Keep true |
| sampleRate | Higher rates yield better fidelity, but increase data volume | 16 kHz is sufficient for most ASR models | Configure per model requirements; note browsers may not strictly honor constraints |

AEC, NS, and AGC vary widely across browsers and operating systems. Always test desktop Chrome, Safari, and mobile browsers across speakerphones, headsets, meeting rooms, and cellular networks.

### The Boundaries of WebRTC

WebRTC is ideal for browser-based real-time audio, but native mobile apps or embedded hardware face different constraints:

Native mobile platforms can leverage:

- **iOS**: `AVAudioEngine` combined with system-level voice processing
- **Android**: `AudioRecord` + Oboe/AAudio, or Google's WebRTC library

Embedded hardware (smart speakers, automotive systems) typically requires dedicated DSP chips or specialized acoustic frontend algorithms to handle hardware echo cancellation, beamforming microphone arrays, and far-field pickup; browser-grade software processing is insufficient.

## What Are the Trade-offs Between Cascaded Pipelines and Native Realtime Models?

This is the pivotal architectural decision when designing voice systems.

### Approach 1: Cascaded ASR + LLM + TTS

```
Audio -> VAD -> Streaming ASR -> LLM -> Streaming TTS -> Audio
```

Pros:

- ASR text can be stored, audited, and corrected easily
- LLM input and output are plain text, making it straightforward to reuse existing Agent frameworks
- TTS voices and providers can be swapped independently
- Every stage can be benchmarked, load-tested, and optimized in isolation

Cons:

- Cumulative latency across every hop
- ASR transcription errors propagate irreversibly into the LLM
- Text as an intermediate medium discards tone, pauses, and emotional nuances
- Barge-in cancellations must be coordinated across ASR, LLM, TTS, and the audio player

interview-guide adopts this approach. It is best suited for enterprise Q&A, customer support ticketing, and regulated business systems requiring strict auditing.

### Approach 2: Native Realtime Speech-to-Speech

```
Audio -> Native Multimodal Model -> Audio
```

Representative Solutions: OpenAI Realtime API, Gemini Live API, Alibaba Qwen-Omni.

Pros:

- Significantly lower end-to-end latency
- Preserves paralinguistic cues like tone, cadence, and emotion
- Unifies audio input, text streaming, and tool execution within a single protocol

Cons:

- Internal reasoning is a black box; debugging relies heavily on vendor logs
- Text auditing and compliance guardrails require custom architectural scaffolding
- Pricing models often charge by audio token or audio duration
- Vendor APIs cannot satisfy air-gapped or on-premise private deployment requirements

**Transport Options**:

OpenAI's Realtime API documentation outlines three connection methods:

| Connection Method | Target Scenarios |
| --- | --- |
| WebRTC | Browser and mobile apps directly capturing mic input and playing model audio |
| WebSocket | Server-to-server middleware scenarios requiring low latency and full control |
| SIP | Telephony system integrations, ideal for call centers and VoIP agents |

### My Recommendation

For consumer-facing products emphasizing ultra-low latency and lifelike natural conversation, evaluate native Realtime APIs first. When your system demands textual auditability, strict script compliance, or private deployment, a cascaded pipeline remains easier to observe and maintain, though added components introduce more failure modes and timeout risks.

**Do not attempt an edge-cloud hybrid on day one**. Validate an end-to-end pipeline first before progressively optimizing components.

## How to Optimize a Voice System in Production?

### 1. Tune Audio Frames and Uplink Chunks

Speech codecs and DSP algorithms typically operate on 10 ms, 20 ms, or 30 ms frames, while application layers aggregate frames into network chunks. Frame size and chunk size are distinct concepts: excessively large processing frames introduce algorithmic latency, while excessively small network chunks introduce protocol overhead.

interview-guide uses **200 ms chunks**:

```typescript
// pcm-processor.js
this.targetSampleRate = 16000;
this.samplesPerChunk = 3200; // 200 ms at 16 kHz
```

This ensures ASR does not wait for an utterance to finish, but it does inject up to one chunk period of latency into the uplink. Compounded by server VAD silence windows, users notice a slight lag after they stop speaking. To improve this:

- Reduce chunk duration to 100 ms
- Transmit an initial short burst to "warm start" the ASR
- Use stable ASR partial transcriptions to predict intent early, using VAD events purely for boundary detection

### 2. Instruct the LLM to Emit Short Sentences First

Voice interaction is not essay writing. Users do not want to listen to a 500-word monologue.

Better strategies:

- Emit an immediate conversational acknowledgment: "Let me check that..."
- Play transition fillers during tool calls: "Looking up your recent orders..."
- Deliver the conclusion first once results are retrieved
- Break complex explanations into short, independently synthesizable clauses

### 3. Segment TTS Along Semantic Boundaries

Segmenting TTS too finely results in robotic, disjointed audio; segmenting into paragraphs creates high initial latency.

Recommended segmentation hierarchy:

1. Periods, question marks, exclamation marks
2. Semicolons, colons
3. Longer comma-separated clauses
4. Forced splits on runaway sentences

Take care not to split numbers, acronyms, or code names across chunks. For instance, "GPT-4o-mini-tts" must not be fractured into disjointed phonetic syllables.

interview-guide adheres to this design: as the LLM streams text, each complete sentence is immediately dispatched to `OrderedTtsChunkEmitter` for clause-level TTS. The frontend enqueues incoming `audio_chunk` packets for immediate playback, and awaits natural queue draining once `audio_complete` is received. This allows the first sentence to play without waiting for the full response to finish generating.

### 4. Prune and Structure Context

Voice Agents often accumulate raw transcriptions, tool outputs, and playback state into context. Over long sessions, this balloons latency and token costs.

Structure context into three tiers:

- **Recent Verbatim History**: Full transcriptions and responses from the last few turns
- **Session Summary**: User goals, confirmed facts, pending action items
- **Event State**: Current playback progress, interruption markers, tool execution results

The LLM does not need to know what occurred in every audio frame; it needs high-signal state relevant to the current decision.

### 5. Establish Full-Stack Observability

interview-guide caches session state in Redis:

```java
// VoiceInterviewService.java
private static final String SESSION_CACHE_KEY_PREFIX = "voice:interview:session:";

private void cacheSession(VoiceInterviewSessionEntity session) {
    String cacheKey = getSessionCacheKey(session.getId());
    RBucket<VoiceInterviewSessionEntity> bucket = redissonClient.getBucket(cacheKey);
    bucket.set(session, Duration.ofHours(CACHE_TTL_HOURS));
}
```

Production environments must also track:

- Uplink audio duration
- Active speech duration
- ASR tokens or audio minutes
- LLM input and output tokens
- TTS characters synthesized, audio seconds played, and seconds interrupted
- Per-turn end-to-end latency and cancellation frequency

Without these metrics, managing Voice Agent operational costs becomes impossible.

## Future Evolution Paths for Voice Agents

interview-guide represents a baseline implementation; several advanced paths exist for further evolution.

### Edge-Cloud Hybrid Architecture

interview-guide currently relies on a cloud-centric design. A natural progression is shifting select responsibilities to the client:

| Component | Current Implementation | Evolutionary Direction |
| --- | --- | --- |
| VAD | Client VAD + Server VAD | Pure client-side VAD, reducing server compute overhead |
| ASR | 100% Cloud | Simple commands handled on-device; complex dialogue routed to cloud |
| LLM | 100% Cloud | On-device SLMs for offline fallback |
| TTS | 100% Cloud | Static system prompts cached locally; dynamic dialogue synthesized in cloud |

An edge-cloud hybrid does not mean cramming every model onto the client. A sound strategy shifts latency-critical, privacy-sensitive, and offline-essential components to the edge, while retaining heavy reasoning, tool orchestration, and centralized auditing in the cloud.

### Local Model Deployment

When data compliance demands on-premise execution, consider self-hosting ASR and TTS:

- **ASR**: faster-whisper, FunASR, SenseVoice
- **TTS**: piper1-gpl (original Piper archived), Fish Speech, CosyVoice

**Important Note**: The original Piper repository (`rhasspy/piper`) was archived in October 2025, and development shifted to [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl). piper1-gpl is licensed under GPL-3.0, requiring strict evaluation for commercial products; the project is also recruiting maintainers, introducing long-term maintenance uncertainties. Fish Speech is not Apache 2.0: its current code, weights, and documentation are governed by the [Fish Audio Research License](https://github.com/fishaudio/fish-speech/blob/main/LICENSE), permitting free non-commercial and research use, while requiring written commercial licensing. Similarly, CosyVoice requires individual verification of code, weights, and voice assets.

Self-hosting guarantees privacy and offline resilience. The drawback is **high engineering overhead**: GPU VRAM capacity, concurrent scaling, streaming inference, warm model loading, and memory reclamation must all be engineered in-house.

### Native Realtime APIs

When cascaded pipeline latency and conversational naturalness plateau, evaluate native Realtime APIs:

- OpenAI Realtime API (supports WebRTC, WebSocket, and SIP; models managed via configuration)
- Gemini Live API
- Alibaba Tongyi Qwen-Omni

These APIs fuse ASR, LLM, and TTS into a unified multimodal pipeline, offering superior conversational fluidity and latency. The trade-offs remain significant: opaque intermediate states, shifting pricing structures, and complex debugging workflows.

OpenAI graduated the Realtime API to GA in August 2025 alongside the dedicated `gpt-realtime` voice model. Because Realtime models update frequently, avoid hardcoding model names in business logic; manage them via configuration centers or model gateways, verifying active model catalogs before release.

The GA release also introduced:

1. **Remote MCP Server Support**, enabling tool calling similar to cascaded architectures;
2. **Image Input Support**, allowing models to converse about screens or camera feeds;
3. **SIP Telephony Integration**, bridging conversations directly to traditional phone networks.

Always verify active pricing models on official portals, as Realtime APIs bill across text tokens, audio tokens, cached inputs, and audio outputs.

### Refining the Barge-in Experience

interview-guide currently employs "silent discard" during AI speech: incoming mic audio is simply dropped. While simple, it feels unnatural.

Better implementations:

- Continue receiving audio during AI speech, withholding it from ASR
- Upon detecting user speech, smoothly duck AI playback volume (fade out rather than abruptly cutting off)
- Preserve context of what was heard up to the interruption point

### Multimodal Expansion

interview-guide is currently audio-only. Promising multimodal extensions include:

- **Voice + Screen Sharing**: The interviewer inspects the candidate's IDE in real time
- **Voice + Camera**: Analyzing facial expressions and non-verbal cues
- **Voice + Collaborative Whiteboard**: Sketching architecture diagrams collaboratively

These capabilities demand sophisticated multi-stream synchronization and unified state orchestration.

## How to Answer AI Voice System Questions in an Interview?

If an interviewer asks: "How would you design a real-time Voice Agent?"

Structure your response along this framework:

1. **Decompose the Pipeline**: The client captures audio, VAD detects conversational boundaries, streaming ASR transcribes speech, the LLM processes intent and tool calls, streaming TTS synthesizes responses, and the client plays audio chunks continuously.
2. **Highlight Core Challenges**: Real-time voice challenges center on end-to-end latency budgets, barge-in handling, acoustic noise resilience, conversational context tracking, and edge-cloud orchestration.
3. **Detail the State Machine**: Detail state transitions across `listening`, `thinking`, `speaking`, and `interrupted`. Explain that barge-in requires canceling playback, terminating server generation, and reconciling played vs. unplayed context.
4. **Discuss Architectural Trade-offs**: Cloud APIs allow rapid launches; local models offer privacy at high operational costs. Cascaded pipelines allow textual auditing and modular component replacement, whereas Speech-to-Speech Realtime APIs provide superior latency and paralinguistic fidelity.

## Summary

An AI Voice Agent is a real-time streaming audio pipeline: VAD controls conversational turns, ASR, LLM, and TTS must stream in harmony, and playback, interruption, cancellation, and session states must be tightly coordinated. Cascaded architectures offer transparency and auditability, while native real-time models excel in low latency and conversational naturalness. How you partition responsibilities between edge and cloud depends on your latency targets, privacy mandates, offline resilience, and operational capabilities. Regardless of the architecture chosen, design it from day one as a cancellable, observable, and graceful-degrading distributed system—never as three naive API calls strung together.
