import { Component } from '@angular/core';
import { LearningComponent } from './features/learning/learning.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LearningComponent],
  template: `<app-learning />`,
})
export class App {}