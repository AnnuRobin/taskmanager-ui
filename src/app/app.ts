import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task } from './models/task';
import { TaskService } from './services/task';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];

  loading = false;
  errorMessage = '';

  showForm = false;
  editingTask: Task | null = null;

  formTask: Task = this.emptyTask();

  ngOnInit(): void {
    this.loadTasks();
  }

  emptyTask(): Task {
    return {
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM'
    };
  }

 loadTasks(): void {
  this.loading = true;
  this.errorMessage = '';

  this.taskService.getTasks().subscribe({
    next: (tasks) => {
      this.tasks = tasks;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.errorMessage = 'Unable to load tasks. Please check the API connection.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  openAddForm(): void {
    this.editingTask = null;
    this.formTask = this.emptyTask();
    this.showForm = true;
  }

  openEditForm(task: Task): void {
    this.editingTask = task;
    this.formTask = { ...task };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTask = null;
    this.formTask = this.emptyTask();
  }

  saveTask(): void {
    if (!this.formTask.title.trim()) {
      return;
    }

    if (this.editingTask?.id) {
      this.taskService.updateTask(this.editingTask.id, this.formTask)
        .subscribe({
          next: (updatedTask) => {
            const index = this.tasks.findIndex(
              task => task.id === updatedTask.id
            );

            if (index !== -1) {
              this.tasks[index] = updatedTask;
            }

            this.closeForm();
          },
          error: () => {
            this.errorMessage = 'Unable to update task.';
          }
        });
    } else {
      this.taskService.createTask(this.formTask)
        .subscribe({
          next: (createdTask) => {
            this.tasks.unshift(createdTask);
            this.closeForm();
          },
          error: () => {
            this.errorMessage = 'Unable to create task.';
          }
        });
    }
  }

  deleteTask(id?: number): void {
    if (!id) {
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.taskService.deleteTask(id)
      .subscribe({
        next: () => {
          this.tasks = this.tasks.filter(task => task.id !== id);
        },
        error: () => {
          this.errorMessage = 'Unable to delete task.';
        }
      });
  }
}