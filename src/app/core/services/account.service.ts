
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

  private readonly apiUrl = 'http://10.96.110.94:8080/api/account';

  private getHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
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
