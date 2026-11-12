import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private frenchVoice: SpeechSynthesisVoice | null = null;
  private lastText = '';
  readonly available = signal(typeof speechSynthesis !== 'undefined');
  readonly voiceReady = signal(false);
  readonly noFrenchVoice = signal(false);

  constructor() {
    if (!this.available()) return;
    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    const voices = speechSynthesis.getVoices();
    const fr = voices.find(v => v.lang.startsWith('fr-FR')) ??
               voices.find(v => v.lang.startsWith('fr')) ??
               null;
    this.frenchVoice = fr;
    this.voiceReady.set(voices.length > 0);
    this.noFrenchVoice.set(voices.length > 0 && fr === null);
  }

  speak(text: string): void {
    if (!this.available()) return;
    speechSynthesis.cancel();
    this.lastText = text;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'fr-FR';
    utt.rate = 0.8;
    if (this.frenchVoice) utt.voice = this.frenchVoice;
    speechSynthesis.speak(utt);
  }

  repeat(): void {
    if (this.lastText) this.speak(this.lastText);
  }

  stop(): void {
    if (this.available()) speechSynthesis.cancel();
  }
}