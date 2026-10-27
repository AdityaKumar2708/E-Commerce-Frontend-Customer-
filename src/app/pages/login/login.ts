
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiBaseUrl } from '../../core/services/api-url';

interface SendOtpRequest {
  email: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  refreshToken?: string;
  tokenType?: string;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  message?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  private readonly API_URL = `${apiBaseUrl()}/api/auth/customer`;

  email = '';
  otp = '';

  otpSent = false;
  loading = false;
  error = '';
  success = '';

  sendOtp(): void {
    this.error = '';
    this.success = '';

    const email = this.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.email = email;
    this.otp = '';
    this.loading = true;

    const request: SendOtpRequest = { email };

    this.http.post<{ message?: string }>(
      `${this.API_URL}/send-otp`,
      request
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.otpSent = true;
        this.success =
          response?.message || 'OTP sent to your email.';
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error =
          err.error?.message ||
          'Unable to send OTP. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  verifyOtp(): void {
    this.error = '';
    this.success = '';

    const email = this.email.trim().toLowerCase();
    const otp = this.otp.trim();

    if (!/^[0-9]{4,8}$/.test(otp)) {
      this.error = 'Enter a valid OTP received on your email.';
      return;
    }

    this.loading = true;

    const request: VerifyOtpRequest = { email, otp };

    this.http.post<AuthResponse>(
      `${this.API_URL}/verify-otp`,
      request
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.changeDetector.markForCheck();

        const token =
          response?.token ||
          response?.accessToken ||
          response?.jwt;

        if (!token) {
          this.error =
            'OTP verified, but the login token was not found in the response.';
          console.error('Auth response:', response);
          this.changeDetector.markForCheck();
          return;
        }

localStorage.setItem('authToken', token);

if (response.refreshToken) {
  localStorage.setItem('refreshToken', response.refreshToken);
} else {
  localStorage.removeItem('refreshToken');
  console.error('Login response mein refreshToken nahi mila:', response);
}

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        const safeReturnUrl =
          returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : '/';

        this.router.navigateByUrl(safeReturnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error =
          err.error?.message ||
          'Invalid OTP. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  changeEmail(): void {
    this.otpSent = false;
    this.otp = '';
    this.error = '';
    this.success = '';
  }
}
