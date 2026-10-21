
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ReturnExchangeRequest,
  ReturnExchangeService
} from '../../core/services/return-exchange.service';

@Component({
  selector: 'app-return-exchange',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './return-exchange.html',
  styleUrl: './return-exchange.css'
})
export class ReturnExchangeComponent implements OnInit {

  requests: ReturnExchangeRequest[] = [];

  loading = false;
  processingId: number | null = null;
  errorMessage = '';
  successMessage = '';

  rejectingRequestId: number | null = null;
  rejectionReason = '';


get returnCount(): number {
  return this.requests.filter(
    r => r.requestType === 'RETURN'
  ).length;
}

get exchangeCount(): number {
  return this.requests.filter(
    r => r.requestType === 'EXCHANGE'
  ).length;
}


  constructor(
    private returnExchangeService: ReturnExchangeService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.returnExchangeService.getPendingRequests().subscribe({
      next: (data) => {
        this.requests = data ?? [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Requests load nahi hui. Login aur backend check karo.';
      }
    });
  }

  approveRequest(request: ReturnExchangeRequest): void {
    const confirmed = window.confirm(
      `Request #${request.id} approve karni hai?`
    );

    if (!confirmed) return;

    this.processingId = request.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.returnExchangeService
      .approveRequest(
        request.id,
        'Approved by admin after review.'
      )
      .subscribe({
        next: () => {
          this.requests = this.requests.filter(
            item => item.id !== request.id
          );
          this.processingId = null;
          this.successMessage =
            `Request #${request.id} approve ho gayi.`;
        },
        error: (error) => {
          this.processingId = null;
          this.errorMessage =
            error?.error?.message || 'Request approve nahi hui.';
        }
      });
  }

  openRejectForm(request: ReturnExchangeRequest): void {
    this.rejectingRequestId = request.id;
    this.rejectionReason = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelReject(): void {
    this.rejectingRequestId = null;
    this.rejectionReason = '';
  }

  rejectRequest(request: ReturnExchangeRequest): void {
    const reason = this.rejectionReason.trim();

    if (!reason) {
      this.errorMessage = 'Rejection reason enter karo.';
      return;
    }

    this.processingId = request.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.returnExchangeService
      .rejectRequest(request.id, reason)
      .subscribe({
        next: () => {
          this.requests = this.requests.filter(
            item => item.id !== request.id
          );
          this.processingId = null;
          this.rejectingRequestId = null;
          this.rejectionReason = '';
          this.successMessage =
            `Request #${request.id} reject ho gayi.`;
        },
        error: (error) => {
          this.processingId = null;
          this.errorMessage =
            error?.error?.message || 'Request reject nahi hui.';
        }
      });
  }
}
