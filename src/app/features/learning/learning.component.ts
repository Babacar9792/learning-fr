import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonComponent } from '../lesson/lesson.component';
import { ExerciseComponent } from '../exercise/exercise.component';
import { ProgressService } from '../../core/services/progress.service';
import { Lesson } from '../../models/lesson.model';
import lessonsData from '../../data/lessons.json';

type View = 'lesson' | 'exercises' | 'complete';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, LessonComponent, ExerciseComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-wrapper">
      <header class="app-header">
        <div class="header-content">
          <span class="app-logo" aria-hidden="true">🇫🇷</span>
          <h1 class="app-name">Apprendre le Français</h1>
        </div>
        <button class="btn-lessons-toggle" (click)="showLessonsList.set(!showLessonsList())"
                [attr.aria-expanded]="showLessonsList()"
                aria-label="Liste des leçons">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
      </header>

      @if (showLessonsList()) {
        <div class="lessons-drawer" role="dialog" aria-label="Toutes les leçons">
          <h2 class="drawer-title">Toutes les leçons</h2>
          <ul class="lessons-list" role="list">
            @for (lesson of lessons; track lesson.id; let i = $index) {
              <li>
                <button
                  class="lesson-item"
                  [class.active]="lesson.id === currentLesson().id"
                  [class.done]="progressService.isLessonCompleted(lesson.id)"
                  (click)="selectLesson(lesson)">
                  <span class="lesson-num">{{ i + 1 }}</span>
                  <span class="lesson-emoji-sm">{{ lesson.emoji }}</span>
                  <span class="lesson-name">{{ lesson.title }}</span>
                  @if (progressService.isLessonCompleted(lesson.id)) {
                    <span class="done-mark" aria-label="Terminé">✅</span>
                  }
                </button>
              </li>
            }
          </ul>
          <button class="btn-reset" (click)="onReset()">Recommencer depuis le début</button>
        </div>
      }

      <main class="main-content">
        @if (view() === 'lesson') {
          <app-lesson
            [lesson]="currentLesson()"
            (goToExercises)="onGoToExercises()" />
        }

        @if (view() === 'exercises') {
          <app-exercise
            [lesson]="currentLesson()"
            (completed)="onExercisesDone()" />
        }

        @if (view() === 'complete') {
          <div class="complete-screen">
            <div class="complete-emoji">🎉</div>
            <h2>Leçon terminée !</h2>
            <p class="complete-title">{{ currentLesson().title }}</p>
            @if (hasNextLesson()) {
              <button class="btn-next-lesson" (click)="onNextLesson()">
                Leçon suivante →
              </button>
            } @else {
              <div class="all-done">
                <p class="all-done-text">🏆 Tu as terminé toutes les leçons !</p>
                <button class="btn-restart" (click)="selectLesson(lessons[0])">
                  Recommencer
                </button>
              </div>
            }
            <button class="btn-redo" (click)="view.set('lesson')">
              Revoir la leçon
            </button>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    /* ── Layout racine ── */
    .app-wrapper {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--color-bg);
    }

    /* ── Header sticky ── */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      /* padding horizontal plus petit sur mobile */
      padding: 0.625rem 0.875rem;
      background: var(--color-surface);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-logo { font-size: 1.4rem; }

    .app-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    /* Cible tactile ≥ 44px */
    .btn-lessons-toggle {
      background: none;
      border: none;
      color: var(--color-text-light);
      cursor: pointer;
      /* padding agrandi pour touch target */
      padding: 0.625rem;
      min-width: var(--touch-min);
      min-height: var(--touch-min);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }

    .btn-lessons-toggle:hover { color: var(--color-primary); background: var(--color-primary-bg); }

    /* ── Drawer leçons ── */
    .lessons-drawer {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-surface-alt);
      padding: 1rem 0.875rem;
      max-height: 55vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .drawer-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.625rem;
      color: var(--color-text);
    }

    .lessons-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    /* Chaque leçon = cible tactile ≥ 44px */
    .lesson-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      background: none;
      border: 2px solid transparent;
      border-radius: 10px;
      /* padding vertical pour 44px min */
      padding: 0.625rem 0.75rem;
      min-height: var(--touch-min);
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
      color: var(--color-text);
    }

    .lesson-item:hover { background: var(--color-primary-bg); }
    .lesson-item.active { border-color: var(--color-primary); background: var(--color-primary-bg); }
    .lesson-item.done { opacity: 0.7; }

    .lesson-num {
      font-size: 0.75rem;
      color: var(--color-text-light);
      width: 18px;
      flex-shrink: 0;
    }

    .lesson-emoji-sm { font-size: 1.1rem; }
    .lesson-name { flex: 1; font-size: 0.95rem; font-weight: 500; }
    .done-mark { font-size: 0.9rem; }

    .btn-reset {
      display: block;
      margin-top: 0.75rem;
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.5rem 0;
      min-height: var(--touch-min);
      text-align: left;
    }

    .btn-reset:hover { text-decoration: underline; }

    /* ── Contenu principal ── */
    .main-content {
      flex: 1;
      /* padding-bottom inclut la safe area iOS + un peu d'air */
      padding: 1rem 0.875rem calc(1rem + var(--safe-bottom));
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ── Écran de fin de leçon ── */
    .complete-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      max-width: 400px;
      /* moins de marge en haut sur mobile */
      margin: 1rem auto 0;
      text-align: center;
    }

    .complete-emoji { font-size: 4.5rem; }

    .complete-screen h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-text);
      margin: 0;
    }

    .complete-title {
      color: var(--color-text-light);
      font-size: 0.95rem;
      margin: 0;
    }

    .btn-next-lesson {
      width: 100%;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 1rem;
      min-height: var(--touch-min);
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-next-lesson:hover { background: var(--color-primary-dark); }

    .all-done { width: 100%; }

    .all-done-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }

    .btn-restart {
      width: 100%;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 1rem;
      min-height: var(--touch-min);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-restart:hover { background: var(--color-accent-dark); }

    .btn-redo {
      background: none;
      border: none;
      color: var(--color-text-light);
      font-size: 0.95rem;
      cursor: pointer;
      padding: 0.5rem;
      min-height: var(--touch-min);
    }

    .btn-redo:hover { color: var(--color-text); text-decoration: underline; }

    /* ── Tablette / desktop (≥ 480px) ── */
    @media (min-width: 480px) {
      .app-header { padding: 0.75rem 1.25rem; }
      .app-logo { font-size: 1.5rem; }
      .main-content { padding: 1.5rem 1.25rem calc(1.5rem + var(--safe-bottom)); }
      .complete-screen { margin: 2rem auto 0; }
      .complete-emoji { font-size: 5rem; }
      .complete-screen h2 { font-size: 2rem; }
      .lessons-drawer { padding: 1rem 1.25rem; }
    }
  `]
})
export class LearningComponent implements OnInit {
  protected readonly lessons: Lesson[] = lessonsData as Lesson[];
  protected currentLesson = signal<Lesson>(this.lessons[0]);
  protected view = signal<View>('lesson');
  protected showLessonsList = signal(false);

  constructor(public progressService: ProgressService) {}

  ngOnInit(): void {
    this.progressService.init(this.lessons[0].id);
    const savedId = this.progressService.currentLessonId();
    const lesson = this.lessons.find(l => l.id === savedId) ?? this.lessons[0];
    this.currentLesson.set(lesson);
  }

  protected selectLesson(lesson: Lesson): void {
    this.currentLesson.set(lesson);
    this.view.set('lesson');
    this.showLessonsList.set(false);
    this.progressService.setCurrentLesson(lesson.id);
  }

  protected onGoToExercises(): void {
    if (this.currentLesson().exercises.length === 0) {
      this.onExercisesDone();
      return;
    }
    this.view.set('exercises');
  }

  protected onExercisesDone(): void {
    this.view.set('complete');
  }

  protected hasNextLesson(): boolean {
    const idx = this.lessons.findIndex(l => l.id === this.currentLesson().id);
    return idx < this.lessons.length - 1;
  }

  protected onNextLesson(): void {
    const idx = this.lessons.findIndex(l => l.id === this.currentLesson().id);
    if (idx < this.lessons.length - 1) {
      this.selectLesson(this.lessons[idx + 1]);
    }
  }

  protected onReset(): void {
    this.progressService.resetAll(this.lessons[0].id);
    this.selectLesson(this.lessons[0]);
  }
}