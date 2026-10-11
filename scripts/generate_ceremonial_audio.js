import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audio Synthesis Parameters
const SAMPLE_RATE = 44100;
const DURATION_SEC = 32;
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SEC;
const NUM_CHANNELS = 2; // Stereo

// Frequencies (Hz)
const NOTES = {
  D1: 36.71,
  G1: 49.00,
  A1: 55.00,
  B1: 61.74,
  D2: 73.42,
  Fsharp2: 92.50,
  G2: 98.00,
  A2: 110.00,
  B2: 123.47,
  Csharp3: 138.59,
  D3: 146.83,
  E3: 164.81,
  Fsharp3: 185.00,
  G3: 196.00,
  A3: 220.00,
  B3: 246.94,
  Csharp4: 277.18,
  D4: 293.66,
  E4: 329.63,
  Fsharp4: 369.99,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  Csharp5: 554.37,
  D5: 587.33,
  E5: 659.25,
  Fsharp5: 739.99,
  A5: 880.00,
};

// 4 Ceremonial Chords (8 seconds each)
const CHORDS = [
  // 0s - 8s: D Major (Majestic, Noble)
  {
    bass: NOTES.D2,
    sub: NOTES.D1,
    pad: [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fsharp4, NOTES.A4],
    arpeggio: [NOTES.D4, NOTES.Fsharp4, NOTES.A4, NOTES.D5, NOTES.Fsharp5, NOTES.A4, NOTES.Fsharp4, NOTES.E4],
  },
  // 8s - 16s: B Minor (Emotional, Dignified)
  {
    bass: NOTES.B2,
    sub: NOTES.B1,
    pad: [NOTES.B2, NOTES.Fsharp3, NOTES.B3, NOTES.D4, NOTES.Fsharp4],
    arpeggio: [NOTES.B3, NOTES.D4, NOTES.Fsharp4, NOTES.B4, NOTES.D5, NOTES.Fsharp4, NOTES.D4, NOTES.Csharp4],
  },
  // 16s - 24s: G Major (Expansive, Uplifting)
  {
    bass: NOTES.G2,
    sub: NOTES.G1,
    pad: [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3, NOTES.D4],
    arpeggio: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4, NOTES.B4, NOTES.D5, NOTES.B4, NOTES.A4],
  },
  // 24s - 32s: A Sus4 -> A Major (Ceremonial Resolution back to D Major)
  {
    bass: NOTES.A2,
    sub: NOTES.A1,
    pad: [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Csharp4, NOTES.E4],
    arpeggio: [NOTES.A3, NOTES.Csharp4, NOTES.E4, NOTES.A4, NOTES.Csharp5, NOTES.E5, NOTES.D5, NOTES.Csharp5],
  },
];

console.log(`Generating Ceremonial Anthem: ${DURATION_SEC}s @ ${SAMPLE_RATE}Hz stereo...`);

const leftBuffer = new Float32Array(TOTAL_SAMPLES);
const rightBuffer = new Float32Array(TOTAL_SAMPLES);

// 1. Synthesize Warm Pad & Bass Layers
for (let s = 0; s < TOTAL_SAMPLES; s++) {
  const t = s / SAMPLE_RATE;
  const chordIndex = Math.floor(t / 8) % CHORDS.length;
  const nextChordIndex = (chordIndex + 1) % CHORDS.length;
  const chordTime = t % 8; // 0 to 8s
  const currentChord = CHORDS[chordIndex];
  const nextChord = CHORDS[nextChordIndex];

  // Crossfade between chords over the last 1.8 seconds of each 8s block
  let blend = 0;
  if (chordTime > 6.2) {
    blend = (chordTime - 6.2) / 1.8;
  }

  // Bass Voice (Warm, round sine + mild 2nd harmonic)
  const bassFreq = currentChord.bass * (1 - blend) + nextChord.bass * blend;
  const subFreq = currentChord.sub * (1 - blend) + nextChord.sub * blend;
  const bassSignal = 
    Math.sin(2 * Math.PI * bassFreq * t) * 0.18 +
    Math.sin(2 * Math.PI * subFreq * t) * 0.14 +
    Math.sin(2 * Math.PI * bassFreq * 2 * t) * 0.05;

  // Pad Voices (Layered detuned strings)
  let padLeft = 0;
  let padRight = 0;

  currentChord.pad.forEach((freq, idx) => {
    const detuneL = freq * 0.998;
    const detuneR = freq * 1.002;
    const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t + idx);
    const amp = 0.08 / (1 + idx * 0.4);

    const sL = Math.sin(2 * Math.PI * detuneL * vibrato * t) * amp +
               Math.sin(2 * Math.PI * detuneL * 2 * t) * (amp * 0.25);
    const sR = Math.sin(2 * Math.PI * detuneR * vibrato * t) * amp +
               Math.sin(2 * Math.PI * detuneR * 2 * t) * (amp * 0.25);

    padLeft += sL;
    padRight += sR;
  });

  leftBuffer[s] += (bassSignal * 0.6 + padLeft) * 0.55;
  rightBuffer[s] += (bassSignal * 0.6 + padRight) * 0.55;
}

// 2. Synthesize Celesta & Concert Harp Arpeggios
const NOTE_INTERVAL = 0.5; // Note every 0.5s
const TOTAL_NOTES = Math.floor(DURATION_SEC / NOTE_INTERVAL);

for (let n = 0; n < TOTAL_NOTES; n++) {
  const noteStartTime = n * NOTE_INTERVAL;
  const chordIndex = Math.floor(noteStartTime / 8) % CHORDS.length;
  const chord = CHORDS[chordIndex];
  const arpeggioNotes = chord.arpeggio;
  const noteFreq = arpeggioNotes[n % arpeggioNotes.length];

  const noteDuration = 1.4; // ringing duration
  const startSample = Math.floor(noteStartTime * SAMPLE_RATE);
  const noteSamples = Math.floor(noteDuration * SAMPLE_RATE);

  // Pan alternates gently across stereo field
  const pan = 0.5 + 0.35 * Math.sin(n * 1.1); // 0.15 to 0.85

  for (let i = 0; i < noteSamples; i++) {
    const targetSample = (startSample + i) % TOTAL_SAMPLES;
    const noteT = i / SAMPLE_RATE;

    // Chime bell envelope: fast attack, exponential decay
    const envelope = Math.exp(-noteT * 3.8);

    // Warm bell chime timbre (fundamental + overtone ratios 2.0, 3.0, 4.2)
    const bellSignal = (
      Math.sin(2 * Math.PI * noteFreq * noteT) * 0.7 +
      Math.sin(2 * Math.PI * noteFreq * 2.0 * noteT) * 0.22 +
      Math.sin(2 * Math.PI * noteFreq * 3.0 * noteT) * 0.08 +
      Math.sin(2 * Math.PI * noteFreq * 4.2 * noteT) * 0.03
    ) * envelope * 0.14;

    leftBuffer[targetSample] += bellSignal * (1 - pan);
    rightBuffer[targetSample] += bellSignal * pan;
  }
}

// 3. Stereo Reverb & Space (Delay feedback with stereo spread)
const DELAY_L_SAMPLES = Math.floor(SAMPLE_RATE * 0.28);
const DELAY_R_SAMPLES = Math.floor(SAMPLE_RATE * 0.35);
const REVERB_DECAY = 0.32;

for (let s = 0; s < TOTAL_SAMPLES; s++) {
  const delayedSampleL = (s - DELAY_L_SAMPLES + TOTAL_SAMPLES) % TOTAL_SAMPLES;
  const delayedSampleR = (s - DELAY_R_SAMPLES + TOTAL_SAMPLES) % TOTAL_SAMPLES;
  leftBuffer[s] += rightBuffer[delayedSampleL] * REVERB_DECAY;
  rightBuffer[s] += leftBuffer[delayedSampleR] * REVERB_DECAY;
}

// 4. Smooth Loop Crossfade at Boundaries (Eliminates clicks)
const CROSSFADE_SEC = 1.5;
const CROSSFADE_SAMPLES = Math.floor(SAMPLE_RATE * CROSSFADE_SEC);
for (let i = 0; i < CROSSFADE_SAMPLES; i++) {
  const fadeOut = (CROSSFADE_SAMPLES - i) / CROSSFADE_SAMPLES;
  const fadeIn = i / CROSSFADE_SAMPLES;
  const endIdx = TOTAL_SAMPLES - CROSSFADE_SAMPLES + i;

  const blendedL = leftBuffer[i] * fadeIn + leftBuffer[endIdx] * fadeOut;
  const blendedR = rightBuffer[i] * fadeIn + rightBuffer[endIdx] * fadeOut;

  leftBuffer[i] = blendedL;
  rightBuffer[i] = blendedR;
  leftBuffer[endIdx] = blendedL;
  rightBuffer[endIdx] = blendedR;
}

// 5. Peak Normalization to -1 dBFS (Safe, audible, premium master)
let maxPeak = 0;
for (let s = 0; s < TOTAL_SAMPLES; s++) {
  const absL = Math.abs(leftBuffer[s]);
  const absR = Math.abs(rightBuffer[s]);
  if (absL > maxPeak) maxPeak = absL;
  if (absR > maxPeak) maxPeak = absR;
}

const targetPeak = 0.88; // -1.1 dBFS
const gain = targetPeak / (maxPeak || 1);
console.log(`Peak normalization: max=${maxPeak.toFixed(3)}, applied gain=${gain.toFixed(3)}`);

// 6. Encode 16-bit PCM Stereo WAV File
const bytesPerSample = 2;
const blockAlign = NUM_CHANNELS * bytesPerSample;
const byteRate = SAMPLE_RATE * blockAlign;
const dataSize = TOTAL_SAMPLES * blockAlign;
const headerSize = 44;
const totalSize = headerSize + dataSize;

const wavBuffer = Buffer.alloc(totalSize);

// RIFF header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(totalSize - 8, 4);
wavBuffer.write('WAVE', 8);

// fmt chunk
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
wavBuffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
wavBuffer.writeUInt16LE(NUM_CHANNELS, 22);
wavBuffer.writeUInt32LE(SAMPLE_RATE, 24);
wavBuffer.writeUInt32LE(byteRate, 28);
wavBuffer.writeUInt16LE(blockAlign, 32);
wavBuffer.writeUInt16LE(16, 34); // BitsPerSample

// data chunk
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let s = 0; s < TOTAL_SAMPLES; s++) {
  // Clamp & Scale to 16-bit signed integer
  let sampleL = Math.max(-1, Math.min(1, leftBuffer[s] * gain));
  let sampleR = Math.max(-1, Math.min(1, rightBuffer[s] * gain));

  const intL = sampleL < 0 ? Math.floor(sampleL * 32768) : Math.floor(sampleL * 32767);
  const intR = sampleR < 0 ? Math.floor(sampleR * 32768) : Math.floor(sampleR * 32767);

  wavBuffer.writeInt16LE(intL, offset);
  wavBuffer.writeInt16LE(intR, offset + 2);
  offset += 4;
}

const outputPath = path.resolve(__dirname, '../public/assets/audio/ceremonial-anthem.wav');
fs.writeFileSync(outputPath, wavBuffer);

const stat = fs.statSync(outputPath);
console.log(`Successfully generated ${outputPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
