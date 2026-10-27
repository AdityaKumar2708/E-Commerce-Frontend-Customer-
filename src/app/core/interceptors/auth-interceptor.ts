import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  catchError,
  switchMap,
  throwError
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiBaseUrl } from '../services/api-url';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface RefreshResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // SSR mein browser storage access nahi karna.
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const http = inject(HttpClient);
  const router = inject(Router);

  const token = localStorage.getItem('authToken');

  const isAuthRequest =
    req.url.includes('/api/auth/customer/send-otp') ||
    req.url.includes('/api/auth/customer/verify-otp') ||
    req.url.includes('/api/auth/refresh');

  const authReq =
    token && !isAuthRequest
      ? req.clone({
          setHeaders: {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`
          }
        })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRequest) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('authToken');
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return http.post<RefreshResponse>(
        `${apiBaseUrl()}/api/auth/refresh`,
        { refreshToken }
      ).pipe(
        switchMap((response) => {
          const newToken = response?.token || response?.accessToken;

          if (!newToken) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            router.navigate(['/login']);
            return throwError(() => error);
          }

          localStorage.setItem('authToken', newToken);

          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          });

          return next(retryReq);
        }),
        catchError((refreshError) => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          router.navigate(['/login']);

          return throwError(() => refreshError);
        })
      );
    })
  );
};