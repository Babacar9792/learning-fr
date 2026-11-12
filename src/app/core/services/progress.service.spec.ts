import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressService);
    service.init('lesson-1');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with first lesson', () => {
    expect(service.currentLessonId()).toBe('lesson-1');
    expect(service.currentStep()).toBe(0);
  });

  it('should update current lesson', () => {
    service.setCurrentLesson('lesson-2');
    expect(service.currentLessonId()).toBe('lesson-2');
  });

  it('should save and restore step', () => {
    service.setStep('lesson-1', 3);
    expect(service.currentStep()).toBe(3);

    const service2 = new ProgressService();
    service2.init('lesson-1');
    expect(service2.currentStep()).toBe(3);
  });

  it('should mark a lesson as completed', () => {
    service.completeLesson('lesson-1');
    expect(service.isLessonCompleted('lesson-1')).toBe(true);
  });

  it('should record exercise results', () => {
    service.recordExercise('lesson-1', 'ex-1-1', true);
    const lp = service.getLesson('lesson-1');
    expect(lp?.exerciseResults.length).toBe(1);
    expect(lp?.exerciseResults[0].correct).toBe(true);
  });

  it('should increment attempts on repeated exercise', () => {
    service.recordExercise('lesson-1', 'ex-1-1', false);
    service.recordExercise('lesson-1', 'ex-1-1', true);
    const lp = service.getLesson('lesson-1');
    expect(lp?.exerciseResults[0].attempts).toBe(2);
    expect(lp?.exerciseResults[0].correct).toBe(true);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('learning-fr-progress', 'not-json{{{');
    const service3 = new ProgressService();
    expect(() => service3.init('lesson-1')).not.toThrow();
    expect(service3.currentLessonId()).toBe('lesson-1');
  });

  it('should reset all progress', () => {
    service.setCurrentLesson('lesson-5');
    service.completeLesson('lesson-1');
    service.resetAll('lesson-1');
    expect(service.currentLessonId()).toBe('lesson-1');
    expect(service.isLessonCompleted('lesson-1')).toBe(false);
  });
});