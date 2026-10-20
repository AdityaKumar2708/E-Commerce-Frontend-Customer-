
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AccountService,
  AccountResponse
} from '../../core/services/account.service';

import { Router } from '@angular/router';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css'
})
export class Account implements OnInit {
  private accountService = inject(AccountService);

  account: AccountResponse | null = null;
  editedName = '';

  loading = false;
  saving = false;
  uploading = false;
  editMode = false;

  errorMessage = '';
  successMessage = '';

  private router = inject(Router);

goBack(): void {
  if (window.history.length > 1) {
    this.router.navigateByUrl(this.router.url).then(() => {
      window.history.back();
    });
  } else {
    this.router.navigate(['/']);
  }
}

  ngOnInit(): void {
  setTimeout(() => {
    this.loadAccount();
  }, 0);
}

  loadAccount(): void {
    this.loading = true;
    this.errorMessage = '';

    this.accountService.getMyAccount().subscribe({
      next: (response) => {
        this.account = response;
        this.editedName = response.fullName;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message ||
          `Account load nahi hua (${error.status}). Backend aur API URL check karo.`;
      }
    });
  }

  startEditing(): void {
    if (!this.account) return;

    this.editedName = this.account.fullName;
    this.editMode = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditing(): void {
    this.editedName = this.account?.fullName || '';
    this.editMode = false;
    this.errorMessage = '';
  }

  saveName(): void {
    const name = this.editedName.trim();

    if (!name) {
      this.errorMessage = 'Name enter karo.';
      return;
    }

    if (name.length > 100) {
      this.errorMessage = 'Name 100 characters se zyada nahi ho sakta.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.accountService.updateMyAccount(name).subscribe({
      next: (response) => {
        this.account = response;
        this.editedName = response.fullName;
        this.editMode = false;
        this.saving = false;
        this.successMessage = 'Name successfully update ho gaya.';
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage =
          error.error?.message ||
          `Name update nahi hua (${error.status}).`;
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.errorMessage = 'Sirf JPG aur PNG images allowed hain.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size 5 MB se kam honi chahiye.';
      input.value = '';
      return;
    }

    this.uploading = true;

    this.accountService.uploadProfileImage(file).subscribe({
      next: (response) => {
        this.account = response;
        this.uploading = false;
        this.successMessage = 'Profile photo update ho gayi.';
        input.value = '';
      },
      error: (error) => {
        this.uploading = false;
        this.errorMessage =
          error.error?.message ||
          `Photo upload nahi hui (${error.status}).`;
        input.value = '';
      }
    });
  }
}
