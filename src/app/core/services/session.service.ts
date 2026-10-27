
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { apiBaseUrl } from './api-url';

interface RefreshResponse {
  token?: string;
  refreshToken?: string;
  tokenType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  restoreSession(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return of(false);
    }

    return this.http
      .post<RefreshResponse>(
        `${apiBaseUrl()}/api/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        tap((response) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }

          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
        }),
        map((response) => !!response.token),
        catchError(() => of(false))
      );
  }
}