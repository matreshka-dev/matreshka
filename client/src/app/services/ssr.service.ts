import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PendingTasks, PLATFORM_ID } from '@angular/core';
import { timer } from 'rxjs';
import { PostmanService } from './postman.service';

export interface SsrServiceApi {
  addTask(): () => void;
  cleanupTask(task: () => void): void;
}

@Injectable({
  providedIn: 'root',
})
export class SsrService implements SsrServiceApi {
  private taskService = inject(PendingTasks);
  private postman = inject(PostmanService);
  private platformId = inject(PLATFORM_ID);
  private tasksCount = 0;

  addTask(): () => void {
    this.tasksCount++;
    return this.taskService.add();
  }

  cleanupTask(task: () => void): void {
    timer(0).subscribe(() => {
      // Таймер нужен чтобы пропустить вперед рендеринг данных, это может создать новые задачи
      task();
      this.tasksCount--;
      if (this.tasksCount === 0) {
        if (isPlatformServer(this.platformId)) {
          this.postman.detachSource();
        }
      }
    });
  }
}
