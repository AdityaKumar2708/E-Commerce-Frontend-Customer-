
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from './core/services/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.css'
})
export class App {
  private sessionService = inject(SessionService);

  constructor() {
    this.sessionService.restoreSession().subscribe({
      next: (restored) => {
        console.log(
          restored
            ? 'Session restored successfully.'
            : 'No active session restored.'
        );
      },
      error: (error) => {
        console.error('Session restoration failed:', error);
      }
    });
  }
}