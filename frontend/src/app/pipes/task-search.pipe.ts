import { Pipe, PipeTransform } from '@angular/core';
import { Task, MainTask } from '../services/task.service';

@Pipe({
  name: 'taskSearch',
  standalone: true
})
export class TaskSearchPipe implements PipeTransform { //
  transform<T extends Task[] | MainTask[]>(items: T, searchText: string): T {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();
    return items.filter((item: Task | MainTask) => {
      // Handle both Task and MainTask interfaces
      const name = 'task_name' in item ? item.task_name : item.main_task_name;
      return name.toLowerCase().includes(searchText);
    }) as T;
  }
}

