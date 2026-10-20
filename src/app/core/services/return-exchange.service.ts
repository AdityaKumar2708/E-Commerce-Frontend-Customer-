
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { apiBaseUrl } from './api-url';

export interface ReturnExchangeRequest {
  id: number;
  requestType: 'RETURN' | 'EXCHANGE' | string;
  reason: string;
  customerDescription?: string;
  status: string;
  createdAt?: string;
  adminNotes?: string;
  rejectionReason?: string;

  order?: {
    id?: number;
    orderNumber?: string;
  };

  customer?: {
    id?: number;
    name?: string;
    email?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReturnExchangeService {

  private readonly baseUrl =
    `${apiBaseUrl()}/api/admin/return-exchange`;

  constructor(private http: HttpClient) {}

  // Load pending requests
  getPendingRequests(): Observable<ReturnExchangeRequest[]> {
    return this.http.get<ReturnExchangeRequest[]>(
      `${this.baseUrl}/pending`
    );
  }

  // Approve request
  approveRequest(
    id: number,
    adminNotes: string
  ): Observable<ReturnExchangeRequest> {
    return this.http.post<ReturnExchangeRequest>(
      `${this.baseUrl}/${id}/approve`,
      { adminNotes }
    );
  }

  // Reject request with mandatory reason
  rejectRequest(
    id: number,
    rejectionReason: string
  ): Observable<ReturnExchangeRequest> {
    return this.http.post<ReturnExchangeRequest>(
      `${this.baseUrl}/${id}/reject`,
      { rejectionReason }
    );
  }
}
