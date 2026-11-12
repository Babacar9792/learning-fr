import { Injectable, signal } from '@angular/core';
import { AppProgress, LessonProgress, ExerciseResult } from '../../models/progress.model';

const STORAGE_KEY = 'learning-fr-progress';

function emptyProgress(firstLessonId: string): AppProgress {
  return {
    currentLessonId: firstLessonId,
    lessons: {},
    lastUpdated: new Date().toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private progress!: AppProgress;
  readonly currentLessonId = signal('');
  readonly currentStep = signal(0);

  init(firstLessonId: string): void {
    this.progress = this.load(firstLessonId);
    this.currentLessonId.set(this.progress.currentLessonId);
    const lp = this.getLesson(this.progress.currentLessonId);
    this.currentStep.set(lp?.currentStep ?? 0);
  }

  private load(firstLessonId: string): AppProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress(firstLessonId);
      const parsed = JSON.parse(raw) as AppProgress;
      if (!parsed.currentLessonId || !parsed.lessons) return emptyProgress(firstLessonId);
      return parsed;
    } catch {
      return emptyProgress(firstLessonId);
    }
  }

  private save(): void {
    try {
      this.progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      /* localStorage unavailable, silently ignore */
    }
  }

  getLesson(lessonId: string): LessonProgress | undefined {
    return this.progress.lessons[lessonId];
  }

  ensureLesson(lessonId: string): LessonProgress {
    if (!this.progress.lessons[lessonId]) {
      this.progress.lessons[lessonId] = {
        lessonId,
        currentStep: 0,
        completed: false,
        exerciseResults: [],
      };
    }
    return this.progress.lessons[lessonId];
  }

  setCurrentLesson(lessonId: string): void {
    this.progress.currentLessonId = lessonId;
    this.currentLessonId.set(lessonId);
    const lp = this.ensureLesson(lessonId);
    this.currentStep.set(lp.currentStep);
    this.save();
  }

  setStep(lessonId: string, step: number): void {
    const lp = this.ensureLesson(lessonId);
    lp.currentStep = step;
    this.currentStep.set(step);
    this.save();
  }

  completeLesson(lessonId: string): void {
    const lp = this.ensureLesson(lessonId);
    lp.completed = true;
    this.save();
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.progress.lessons[lessonId]?.completed ?? false;
  }

  recordExercise(lessonId: string, exerciseId: string, correct: boolean): void {
    const lp = this.ensureLesson(lessonId);
    const existing = lp.exerciseResults.find(r => r.exerciseId === exerciseId);
    if (existing) {
      existing.attempts++;
      existing.correct = correct;
      existing.lastAttemptDate = new Date().toISOString();
    } else {
      lp.exerciseResults.push({
        exerciseId,
        attempts: 1,
        correct,
        lastAttemptDate: new Date().toISOString(),
      });
    }
    this.save();
  }

  resetAll(firstLessonId: string): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    this.progress = emptyProgress(firstLessonId);
    this.currentLessonId.set(firstLessonId);
    this.currentStep.set(0);
  }
}