import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson, LessonStep } from '../../models/lesson.model';
import { AudioService } from '../../core/services/audio.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lesson-container">
      <div class="lesson-header">
        <span class="lesson-emoji">{{ lesson.emoji }}</span>
        <div>
          <h2 class="lesson-title">{{ lesson.title }}</h2>
          <p class="lesson-subtitle">{{ lesson.subtitle }}</p>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>
      <p class="progress-label">{{ currentIndex() + 1 }} / {{ lesson.steps.length }}</p>

      @if (audioService.noFrenchVoice()) {
        <div class="voice-warning" role="alert">
          Voix française non disponible sur cet appareil
        </div>
      }

      <div class="step-card"
           role="button"
           tabindex="0"
           [attr.aria-label]="'Écouter : ' + currentStep().display"
           (click)="onSpeak()"
           (keydown.enter)="onSpeak()"
           (keydown.space)="onSpeak()">
        <div class="step-emoji" aria-hidden="true">{{ currentStep().emoji }}</div>
        <div class="step-display">{{ currentStep().display }}</div>
        @if (currentStep().hint) {
          <p class="step-hint">{{ currentStep().hint }}</p>
        }
        <div class="speak-indicator" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <span>Appuie pour écouter</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn-repeat" (click)="onRepeat()" aria-label="Réécouter">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
          Réécouter
        </button>

        <button class="btn-next" (click)="onNext()" [disabled]="isLastStep()">
          Suivant →
        </button>
      </div>

      @if (isLastStep()) {
        <button class="btn-exercises" (click)="goToExercises.emit()">
          Faire les exercices 🎯
        </button>
      }

      @if (currentIndex() > 0) {
        <button class="btn-prev" (click)="onPrev()" aria-label="Précédent">
          ← Précédent
        </button>
      }
    </div>
  `,
  styles: [`
    /* ── Conteneur ── */
    .lesson-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      /* gap réduit sur mobile */
      gap: 0.875rem;
      /* pas de padding ici : géré par .main-content parent */
      max-width: 520px;
      margin: 0 auto;
      /* réserve la place pour la barre d'actions épinglée */
      padding-bottom: calc(5rem + var(--safe-bottom));
    }

    /* ── En-tête de leçon ── */
    .lesson-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
    }

    .lesson-emoji { font-size: 1.75rem; }

    .lesson-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .lesson-subtitle {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-text-light);
    }

    /* ── Barre de progression ── */
    .progress-bar {
      width: 100%;
      height: 7px;
      background: var(--color-surface-alt);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .progress-label {
      font-size: 0.8rem;
      color: var(--color-text-light);
      margin: 0;
      align-self: flex-end;
    }

    /* ── Alerte voix ── */
    .voice-warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffc107;
      border-radius: 10px;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      width: 100%;
      text-align: center;
    }

    /* ── Carte principale — cliquable pour écouter ── */
    .step-card {
      background: var(--color-surface);
      border-radius: 20px;
      /* padding compact sur mobile */
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      width: 100%;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      outline: none;
      /* feedback tactile immédiat */
      -webkit-tap-highlight-color: transparent;
    }

    .step-card:active { transform: scale(0.98); }

    .step-card:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: 3px;
    }

    /* emoji plus petit sur mobile pour économiser de la place */
    .step-emoji {
      font-size: 3rem;
      margin-bottom: 0.375rem;
      display: block;
    }

    /* lettre / syllabe : responsive via clamp */
    .step-display {
      font-size: clamp(3.5rem, 20vw, 6rem);
      font-weight: 800;
      color: var(--color-primary);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .step-hint {
      font-size: 0.875rem;
      color: var(--color-text-light);
      margin: 0.5rem 0 0;
      font-style: italic;
    }

    .speak-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      margin-top: 0.875rem;
      color: var(--color-primary-light);
      font-size: 0.85rem;
    }

    /* ── Barre d'actions épinglée en bas ── */
    .actions {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      /* respecte la safe area iOS */
      padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
      background: var(--color-surface);
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
      display: flex;
      gap: 0.625rem;
      z-index: 50;
    }

    .btn-repeat {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      background: var(--color-surface);
      color: var(--color-primary);
      border: 2px solid var(--color-primary);
      border-radius: 12px;
      padding: 0 1rem;
      min-height: var(--touch-min);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      flex: 0 0 auto;
      white-space: nowrap;
    }

    .btn-repeat:hover { background: var(--color-primary-bg); }

    .btn-next {
      flex: 1;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 12px;
      min-height: var(--touch-min);
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }

    .btn-next:hover { background: var(--color-primary-dark); }
    .btn-next:disabled { opacity: 0.35; cursor: default; }

    /* ── Bouton exercices (affiché à la place de Suivant) ── */
    .btn-exercises {
      width: 100%;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 1rem;
      min-height: var(--touch-min);
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
      animation: pulse 2s infinite;
    }

    .btn-exercises:hover { background: var(--color-accent-dark); animation: none; }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    /* ── Bouton Précédent ── */
    .btn-prev {
      background: none;
      border: none;
      color: var(--color-text-light);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      min-height: var(--touch-min);
      align-self: center;
    }

    .btn-prev:hover { color: var(--color-text); }

    /* ── Tablette / desktop (≥ 480px) ── */
    @media (min-width: 480px) {
      .lesson-container {
        gap: 1rem;
        padding-bottom: calc(5.5rem + var(--safe-bottom));
      }
      .lesson-emoji { font-size: 2rem; }
      .lesson-title { font-size: 1.25rem; }
      .lesson-subtitle { font-size: 0.875rem; }
      .step-emoji { font-size: 4rem; margin-bottom: 0.5rem; }
      .step-card { padding: 2rem 1.5rem; }
      .actions { padding: 0.875rem 1.25rem calc(0.875rem + var(--safe-bottom)); }
      .btn-next { font-size: 1.1rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      .btn-exercises { animation: none; }
      .step-card, .progress-fill, .btn-repeat, .btn-next { transition: none; }
    }
  `]
})
export class LessonComponent implements OnInit, OnChanges {
  @Input({ required: true }) lesson!: Lesson;
  @Output() goToExercises = new EventEmitter<void>();

  protected currentIndex = signal(0);
  protected progressPercent = signal(0);

  constructor(
    public audioService: AudioService,
    private progressService: ProgressService,
  ) {}

  ngOnInit(): void {
    const saved = this.progressService.getLesson(this.lesson.id);
    const idx = saved ? Math.min(saved.currentStep, this.lesson.steps.length - 1) : 0;
    this.currentIndex.set(idx);
    this.updateProgress();
  }

  ngOnChanges(): void {
    const saved = this.progressService.getLesson(this.lesson.id);
    const idx = saved ? Math.min(saved.currentStep, this.lesson.steps.length - 1) : 0;
    this.currentIndex.set(idx);
    this.updateProgress();
  }

  protected currentStep(): LessonStep {
    return this.lesson.steps[this.currentIndex()];
  }

  protected isLastStep(): boolean {
    return this.currentIndex() === this.lesson.steps.length - 1;
  }

  protected onSpeak(): void {
    this.audioService.speak(this.currentStep().speak);
  }

  protected onRepeat(): void {
    this.audioService.repeat();
  }

  protected onNext(): void {
    if (this.isLastStep()) return;
    const next = this.currentIndex() + 1;
    this.currentIndex.set(next);
    this.progressService.setStep(this.lesson.id, next);
    this.updateProgress();
    this.audioService.speak(this.lesson.steps[next].speak);
  }

  protected onPrev(): void {
    if (this.currentIndex() === 0) return;
    const prev = this.currentIndex() - 1;
    this.currentIndex.set(prev);
    this.progressService.setStep(this.lesson.id, prev);
    this.updateProgress();
  }

  private updateProgress(): void {
    const pct = ((this.currentIndex() + 1) / this.lesson.steps.length) * 100;
    this.progressPercent.set(pct);
  }
}