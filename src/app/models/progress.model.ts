export interface ExerciseResult {
  exerciseId: string;
  attempts: number;
  correct: boolean;
  lastAttemptDate: string;
}

export interface LessonProgress {
  lessonId: string;
  currentStep: number;
  completed: boolean;
  exerciseResults: ExerciseResult[];
}

export interface AppProgress {
  currentLessonId: string;
  lessons: Record<string, LessonProgress>;
  lastUpdated: string;
}