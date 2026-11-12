import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson, Exercise, ExerciseOption } from '../../models/lesson.model';
import { AudioService } from '../../core/services/audio.service';
import { ProgressService } from '../../core/services/progress.service';

type AnswerState = 'idle' | 'correct' | 'wrong';

@Component({
  selector: 'app-exercise',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="exercise-container">
      <div class="exercise-header">
        <span class="exercise-num">Exercice {{ currentIndex() + 1 }} / {{ lesson.exercises.length }}</span>
        <div class="ex-progress">
          @for (ex of lesson.exercises; track ex.id; let i = $index) {
            <span class="ex-dot" [class.done]="i < currentIndex()" [class.current]="i === currentIndex()"></span>
          }
        </div>
      </div>

      <div class="instruction-card">
        <p class="instruction">{{ current().instruction }}</p>
        @if (current().type !== 'match') {
          <button class="btn-play-target" (click)="speakTarget()" aria-label="Écouter la question">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            Écouter
          </button>
        }
      </div>

      @if (answerState() !== 'idle') {
        <div class="feedback" [class.correct]="answerState() === 'correct'" [class.wrong]="answerState() === 'wrong'" role="alert">
          @if (answerState() === 'correct') {
            <span>🎉 Bravo !</span>
          } @else {
            <span>🔄 Essaie encore !</span>
          }
        </div>
      }

      <div class="options-grid" [class.cols-2]="current().options.length === 2">
        @for (opt of current().options; track opt.id) {
          <button
            class="option-btn"
            [class.selected]="selectedId() === opt.id"
            [class.correct]="answerState() !== 'idle' && opt.id === current().targetId"
            [class.wrong]="answerState() === 'wrong' && selectedId() === opt.id"
            [attr.aria-label]="'Choisir : ' + opt.display"
            (click)="onSelect(opt)">
            <span class="option-text">{{ opt.display }}</span>
            <button class="option-speak" (click)="$event.stopPropagation(); speakOption(opt)"
                    [attr.aria-label]="'Écouter ' + opt.display">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
          </button>
        }
      </div>

      @if (answerState() === 'correct') {
        <button class="btn-continue" (click)="onContinue()">
          @if (isLastExercise()) {
            Terminer la leçon ✅
          } @else {
            Exercice suivant →
          }
        </button>
      }

      @if (answerState() === 'wrong') {
        <button class="btn-retry" (click)="onRetry()">
          Réessayer 🔄
        </button>
      }
    </div>
  `,
  styles: [`
    /* ── Conteneur ── */
    .exercise-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 520px;
      margin: 0 auto;
    }

    /* ── En-tête ── */
    .exercise-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .exercise-num {
      font-size: 0.85rem;
      color: var(--color-text-light);
      font-weight: 600;
    }

    .ex-progress {
      display: flex;
      gap: 6px;
    }

    .ex-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-surface-alt);
      transition: background 0.2s;
    }

    .ex-dot.done { background: var(--color-primary); }
    .ex-dot.current { background: var(--color-accent); }

    /* ── Carte instruction ── */
    .instruction-card {
      background: var(--color-surface);
      border-radius: 16px;
      padding: 1rem;
      text-align: center;
      width: 100%;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .instruction {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text);
    }

    /* Bouton Écouter — largeur pleine sur mobile, auto sur tablette */
    .btn-play-target {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
      min-height: var(--touch-min);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-play-target:hover { background: var(--color-primary-dark); }

    /* ── Feedback ── */
    .feedback {
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 1.1rem;
      font-weight: 700;
      text-align: center;
      width: 100%;
    }

    .feedback.correct {
      background: #d1fae5;
      color: #065f46;
      border: 2px solid #34d399;
    }

    .feedback.wrong {
      background: #fee2e2;
      color: #991b1b;
      border: 2px solid #f87171;
    }

    /* ── Grille des options ──
       Mobile : 2 colonnes par défaut (moins serré sur 320px)
       Tablette+ : 3 colonnes quand la place le permet */
    .options-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.625rem;
      width: 100%;
    }

    .options-grid.cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    /* ── Bouton option ── */
    .option-btn {
      background: var(--color-surface);
      border: 2.5px solid var(--color-surface-alt);
      border-radius: 16px;
      /* padding vertical généreux pour touch */
      padding: 1rem 0.5rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      /* cible tactile minimum */
      min-height: 88px;
      -webkit-tap-highlight-color: transparent;
    }

    .option-btn:active {
      transform: scale(0.97);
    }

    .option-btn:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: 2px;
    }

    .option-btn.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-bg);
    }

    .option-btn.correct {
      border-color: #34d399;
      background: #d1fae5;
    }

    .option-btn.wrong {
      border-color: #f87171;
      background: #fee2e2;
    }

    /* texte option : responsive via clamp, min 1.75rem sur mobile */
    .option-text {
      font-size: clamp(1.75rem, 9vw, 2.5rem);
      font-weight: 800;
      color: var(--color-text);
      line-height: 1;
      pointer-events: none;
      word-break: break-word;
      text-align: center;
    }

    /* Mini bouton son à l'intérieur de l'option */
    .option-speak {
      background: var(--color-surface-alt);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text-light);
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .option-speak:hover { background: var(--color-primary-bg); color: var(--color-primary); }

    /* ── Boutons de validation ── */
    .btn-continue {
      width: 100%;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 1rem;
      min-height: var(--touch-min);
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-continue:hover { background: var(--color-primary-dark); }

    .btn-retry {
      width: 100%;
      background: var(--color-surface);
      color: var(--color-primary);
      border: 2px solid var(--color-primary);
      border-radius: 14px;
      padding: 0.875rem;
      min-height: var(--touch-min);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-retry:hover { background: var(--color-primary-bg); }

    /* ── Tablette / desktop (≥ 480px) ── */
    @media (min-width: 480px) {
      .options-grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .instruction { font-size: 1.1rem; }
      .btn-play-target { width: auto; }
      .option-btn { min-height: 96px; }
      .option-text { font-size: clamp(1.5rem, 7vw, 2.5rem); }
    }

    @media (prefers-reduced-motion: reduce) {
      .option-btn, .btn-play-target, .btn-continue, .btn-retry { transition: none; }
      .ex-dot { transition: none; }
    }
  `]
})
export class ExerciseComponent implements OnInit, OnChanges {
  @Input({ required: true }) lesson!: Lesson;
  @Output() completed = new EventEmitter<void>();

  protected currentIndex = signal(0);
  protected selectedId = signal<string | null>(null);
  protected answerState = signal<AnswerState>('idle');

  constructor(
    private audioService: AudioService,
    private progressService: ProgressService,
  ) {}

  ngOnInit(): void { this.reset(); }
  ngOnChanges(): void { this.reset(); }

  private reset(): void {
    this.currentIndex.set(0);
    this.selectedId.set(null);
    this.answerState.set('idle');
  }

  protected current(): Exercise {
    return this.lesson.exercises[this.currentIndex()];
  }

  protected isLastExercise(): boolean {
    return this.currentIndex() === this.lesson.exercises.length - 1;
  }

  protected speakTarget(): void {
    const target = this.current().options.find(o => o.id === this.current().targetId);
    if (target) this.audioService.speak(target.speak);
  }

  protected speakOption(opt: ExerciseOption): void {
    this.audioService.speak(opt.speak);
  }

  protected onSelect(opt: ExerciseOption): void {
    if (this.answerState() !== 'idle') return;
    this.selectedId.set(opt.id);
    const correct = opt.id === this.current().targetId;
    this.answerState.set(correct ? 'correct' : 'wrong');
    this.progressService.recordExercise(this.lesson.id, this.current().id, correct);
    if (correct) this.audioService.speak('Bravo');
  }

  protected onContinue(): void {
    if (this.isLastExercise()) {
      this.progressService.completeLesson(this.lesson.id);
      this.completed.emit();
    } else {
      this.currentIndex.set(this.currentIndex() + 1);
      this.selectedId.set(null);
      this.answerState.set('idle');
    }
  }

  protected onRetry(): void {
    this.selectedId.set(null);
    this.answerState.set('idle');
  }
}