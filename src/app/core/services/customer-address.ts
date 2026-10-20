
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBaseUrl } from './api-url';
import { Observable } from 'rxjs';

export interface CustomerAddress {
  id?: number;
  fullName: string;
  phone: string;
  alternatePhone: string;
  house: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Work';
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerAddressService {
  private http = inject(HttpClient);

  private readonly API_URL =
    `${apiBaseUrl()}/api/customer/addresses`;

  
private getHeaders(): HttpHeaders {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('JWT token not found. Please sign in again.');
  }

  const authorization = token.startsWith('Bearer ')
    ? token
    : `Bearer ${token}`;

  return new HttpHeaders({
    Authorization: authorization,
    'Content-Type': 'application/json'
  });
}


  getAddresses(): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddress[]>(
      this.API_URL,
      { headers: this.getHeaders() }
    );
  }

  addAddress(
    address: CustomerAddress
  ): Observable<CustomerAddress> {
    return this.http.post<CustomerAddress>(
      this.API_URL,
      address,
      { headers: this.getHeaders() }
    );
  }

  updateAddress(
    id: number,
    address: CustomerAddress
  ): Observable<CustomerAddress> {
    return this.http.put<CustomerAddress>(
      `${this.API_URL}/${id}`,
      address,
      { headers: this.getHeaders() }
    );
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
