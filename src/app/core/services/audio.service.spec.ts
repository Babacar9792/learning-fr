import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioService } from './audio.service';

class MockUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  constructor(text: string) { this.text = text; }
}

describe('AudioService', () => {
  let service: AudioService;
  const mockCancel = vi.fn();
  const mockSpeak = vi.fn();
  const mockGetVoices = vi.fn();

  beforeEach(() => {
    mockCancel.mockReset();
    mockSpeak.mockReset();
    mockGetVoices.mockReset();

    const voices: Partial<SpeechSynthesisVoice>[] = [
      { lang: 'fr-FR', name: 'Amélie', voiceURI: 'Amélie', localService: true, default: false },
      { lang: 'en-US', name: 'Alex', voiceURI: 'Alex', localService: true, default: true },
    ];
    mockGetVoices.mockReturnValue(voices);

    Object.defineProperty(window, 'speechSynthesis', {
      value: { cancel: mockCancel, speak: mockSpeak, getVoices: mockGetVoices, onvoiceschanged: null },
      writable: true,
      configurable: true,
    });

    (window as unknown as Record<string, unknown>)['SpeechSynthesisUtterance'] = MockUtterance;

    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect speechSynthesis as available', () => {
    expect(service.available()).toBe(true);
  });

  it('should call cancel then speak when speak() is called', () => {
    service.speak('bonjour');
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledOnce();
    const utt = mockSpeak.mock.calls[0][0] as MockUtterance;
    expect(utt.text).toBe('bonjour');
    expect(utt.lang).toBe('fr-FR');
    expect(utt.rate).toBe(0.8);
  });

  it('should repeat last spoken text', () => {
    service.speak('merci');
    service.repeat();
    expect(mockSpeak).toHaveBeenCalledTimes(2);
    const utt = mockSpeak.mock.calls[1][0] as MockUtterance;
    expect(utt.text).toBe('merci');
  });

  it('should not throw if repeat called before any speak', () => {
    expect(() => service.repeat()).not.toThrow();
  });

  it('should stop synthesis', () => {
    service.stop();
    expect(mockCancel).toHaveBeenCalled();
  });
});