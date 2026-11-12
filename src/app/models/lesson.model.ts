export type LessonType =
  | 'alphabet'
  | 'vowels'
  | 'consonants'
  | 'syllables'
  | 'articles-definite'
  | 'articles-indefinite'
  | 'words'
  | 'word-groups'
  | 'sentences';

export type ExerciseType = 'listen-recognize' | 'match' | 'listen-choose';

export interface LessonStep {
  id: string;
  display: string;
  speak: string;
  phoneticSpeak?: string;
  emoji?: string;
  hint?: string;
}

export interface ExerciseOption {
  id: string;
  display: string;
  speak: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  instruction: string;
  targetId: string;
  options: ExerciseOption[];
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  type: LessonType;
  emoji?: string;
  steps: LessonStep[];
  exercises: Exercise[];
}