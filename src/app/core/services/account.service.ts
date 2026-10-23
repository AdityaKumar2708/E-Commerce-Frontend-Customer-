
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccountResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'https://e-commerce-backend-kyir.onrender.com/api/account';

  
private getHeaders(): HttpHeaders {
  const token =
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken');

  let headers = new HttpHeaders();

  if (token) {
    const authorizationValue = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;

    headers = headers.set('Authorization', authorizationValue);
  }

  return headers;
}


  getMyAccount(): Observable<AccountResponse> {
    return this.http.get<AccountResponse>(
      `${this.apiUrl}/me`,
      { headers: this.getHeaders() }
    );
  }

  updateMyAccount(fullName: string): Observable<AccountResponse> {
    return this.http.patch<AccountResponse>(
      `${this.apiUrl}/me`,
      { fullName },
      { headers: this.getHeaders() }
    );
  }

  uploadProfileImage(file: File): Observable<AccountResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AccountResponse>(
      `${this.apiUrl}/me/profile-image`,
      formData,
      { headers: this.getHeaders() }
    );
  }
}
