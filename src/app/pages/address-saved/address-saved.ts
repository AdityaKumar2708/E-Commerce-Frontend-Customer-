
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CustomerAddress,
  CustomerAddressService
} from '../../core/services/customer-address';

@Component({
  selector: 'app-address-saved',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-saved.html',
  styleUrl: './address-saved.css'
})
export class AddressSaved implements OnInit {
  private addressService = inject(CustomerAddressService);
  private router = inject(Router);

  addresses: CustomerAddress[] = [];

  form: CustomerAddress = this.emptyAddress();

  editingId: number | null = null;
  showForm = false;
  loading = false;
  saving = false;
  error = '';
  message = '';

  private cdr = inject(ChangeDetectorRef);


  ngOnInit(): void {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');

  if (!token) {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/address-saved' }
    });
    return;
  }

  this.loadAddresses();
}

  private emptyAddress(): CustomerAddress {
    return {
      fullName: '',
      phone: '',
      alternatePhone: '',
      house: '',
      street: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
      isDefault: false
    };
  }

loadAddresses(): void {
  this.loading = true;
  this.error = '';

  this.addressService.getAddresses().subscribe({
    next: (data) => {
      this.addresses = data ?? [];
      this.loading = false;

      this.cdr.markForCheck();
    },
    error: (err) => {
      this.loading = false;
      this.handleError(err, 'Unable to load saved addresses.');

      this.cdr.markForCheck();
    }
  });
}


  goBack(): void {
  window.history.back();
}

  openAddForm(): void {
    this.form = this.emptyAddress();
    this.editingId = null;
    this.showForm = true;
    this.error = '';
    this.message = '';
  }

  editAddress(address: CustomerAddress): void {
    this.form = { ...address };
    this.editingId = address.id ?? null;
    this.showForm = true;
    this.error = '';
    this.message = '';
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form = this.emptyAddress();
    this.error = '';
  }

  saveAddress(): void {
    this.error = '';
    this.message = '';

    if (!this.form.fullName.trim() ||
        !this.form.phone.trim() ||
        !this.form.house.trim() ||
        !this.form.area.trim() ||
        !this.form.city.trim() ||
        !this.form.state.trim() ||
        !this.form.pincode.trim()) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(this.form.phone.trim())) {
      this.error = 'Enter a valid 10-digit mobile number.';
      return;
    }

    if (
      this.form.alternatePhone.trim() &&
      !/^[6-9][0-9]{9}$/.test(this.form.alternatePhone.trim())
    ) {
      this.error = 'Enter a valid alternate mobile number.';
      return;
    }

    if (!/^[0-9]{6}$/.test(this.form.pincode.trim())) {
      this.error = 'PIN code must contain 6 digits.';
      return;
    }

    const payload: CustomerAddress = {
      ...this.form,
      fullName: this.form.fullName.trim(),
      phone: this.form.phone.trim(),
      alternatePhone: this.form.alternatePhone.trim(),
      house: this.form.house.trim(),
      street: this.form.street.trim(),
      area: this.form.area.trim(),
      landmark: this.form.landmark.trim(),
      city: this.form.city.trim(),
      state: this.form.state.trim(),
      pincode: this.form.pincode.trim()
    };

    this.saving = true;

    const request = this.editingId !== null
      ? this.addressService.updateAddress(this.editingId, payload)
      : this.addressService.addAddress(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editingId = null;
        this.form = this.emptyAddress();
        this.message = 'Address saved successfully.';
        this.loadAddresses();
      },
      error: (err) => {
        this.saving = false;
        this.handleError(err, 'Unable to save address.');
      }
    });
  }

  deleteAddress(address: CustomerAddress): void {
    if (!address.id) {
      return;
    }

    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    this.error = '';
    this.message = '';

    this.addressService.deleteAddress(address.id).subscribe({
      next: () => {
        this.message = 'Address deleted successfully.';
        this.loadAddresses();
      },
      error: (err) => {
        this.handleError(err, 'Unable to delete address.');
      }
    });
  }

  private handleError(err: any, fallback: string): void {
  console.error('Address API error:', err);

  if (err.status === 401) {
    this.error =
      'Authentication failed. Please check your login session.';
  } else if (err.status === 403) {
    this.error =
      'You are not authorized to perform this action.';
  } else {
    this.error =
      err.error?.message ||
      err.error?.detail ||
      fallback;
  }
}

}
