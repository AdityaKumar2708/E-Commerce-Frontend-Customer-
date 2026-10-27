import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import {
  CustomerAddress,
  CustomerAddressService
} from '../../core/services/customer-address';

import { apiBaseUrl } from '../../core/services/api-url';


interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;

  salesChannel?: 'ONLINE' | 'STORE_PICKUP';
  fulfillmentType?: 'ONLINE' | 'STORE_PICKUP';
}

interface RazorpayOrderResponse {
  orderId: string;
  currency: string;
  keyId: string;
  amount: number;
}

declare var Razorpay: any;

interface ShippingQuoteResponse {
  shippingCharge: number;
  courierName: string;
  chargeWeight: number;
  estimatedDeliveryDays: string;
}


interface DeliveryAddress {
  house: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
}

interface PostalLookupResponse {
  Status?: string;
  PostOffice?: Array<{
    District?: string;
    State?: string;
  }>;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private addressService = inject(CustomerAddressService);

savedAddresses: CustomerAddress[] = [];
selectedSavedAddressId: number | null = null;
savedAddressLoading = false;
savedAddressError = '';

private cdr = inject(ChangeDetectorRef);

shippingQuote: ShippingQuoteResponse | null = null;
private shippingQuotePinCode: string | null = null;

  private pinLookupSequence = 0;

  product: Product | null = null;

  couponCode = '';
couponLoading = false;
couponMessage = '';
couponError = '';

appliedCoupon: {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
} | null = null;

availableCoupons: Array<{
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrderValue?: number | null;
  maximumDiscount?: number | null;
  expiresAt?: string | null;
}> = [];

private readonly couponApi = `${apiBaseUrl()}/api/coupons`;

  shippingCharge = 0;
shippingLoading = false;
shippingError = '';

  step = 1;
  error = '';
  selectedPayment = '';

  pinLoading = false;
  pinError = '';
  pinMessage = '';

  // -----------------------------------
  // STORE PICKUP
  // -----------------------------------

  isStorePickup = false;

  expectedPickupTime = '';
  pickupTimeError = '';

  customerRequest = '';

  readonly pickupStartTime = '09:00';
  readonly pickupEndTime = '19:00';

  // -----------------------------------
  // ONLINE ADDRESS
  // -----------------------------------

  address: DeliveryAddress = {
    house: '',
    area: '',
    city: '',
    state: '',
    pinCode: ''
  };

  // -----------------------------------
  // CONTACT
  // -----------------------------------

  contact = {
    fullName: '',
    mobile: '',
    email: ''
  };

  // -----------------------------------
  // INIT
  // -----------------------------------

  ngOnInit(): void {

    const token = localStorage.getItem('authToken');

    if (!token) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: '/checkout',
          action: 'buy-now',
          productId: this.route.snapshot.queryParamMap.get('productId')
        }
      });

      this.loadAvailableCoupons();

      return;
    }

    

    let savedProduct: string | null = null;

if (typeof window !== 'undefined') {
  try {
    savedProduct = sessionStorage.getItem('buyNowProduct');
  } catch (error) {
    console.error('Session storage access failed:', error);
  }
}

    if (savedProduct) {

      try {

        this.product = JSON.parse(savedProduct) as Product;

        /*
         * Store Pickup can be identified from
         * fulfillmentType saved by store-pickup.ts.
         */
        this.isStorePickup =
          this.product?.fulfillmentType === 'STORE_PICKUP' ||
          this.product?.salesChannel === 'STORE_PICKUP';

      } catch {

        this.product = null;
        this.isStorePickup = false;
      }
    }

    // -----------------------------------
    // LOAD SAVED ADDRESS
    // -----------------------------------

    if (!this.isStorePickup) {
  this.loadSavedAddresses();

  if (
    this.validPinCode &&
    (!this.address.city || !this.address.state)
  ) {
    this.onPinCodeChange();
  }
}
  }


loadSavedAddresses(): void {
  this.savedAddressLoading = true;
  this.savedAddressError = '';

  this.addressService.getAddresses().subscribe({
    next: (addresses) => {
      console.log('Saved addresses API response:', addresses);

      this.savedAddresses = addresses ?? [];
      this.savedAddressLoading = false;

      const preferredAddress =
        this.savedAddresses.find(a => a.isDefault) ??
        this.savedAddresses[0];

      if (preferredAddress?.id != null) {
        this.onSavedAddressChange(preferredAddress.id);
      }

      this.cdr.detectChanges();

      console.log('Addresses assigned:', this.savedAddresses);
      console.log('Selected address ID:', this.selectedSavedAddressId);
    },

    error: (err) => {
      console.error('Failed to load saved addresses:', err);

      this.savedAddressLoading = false;
      this.savedAddressError =
        'Saved addresses could not be loaded.';

      this.cdr.detectChanges();
    }
  });
}

onSavedAddressChange(id: number | null): void {
  this.selectedSavedAddressId = id;

  if (id == null) {
    // Allow the customer to enter a different address manually.
    this.address = {
      house: '',
      area: '',
      city: '',
      state: '',
      pinCode: ''
    };

    this.shippingQuote = null;
    this.shippingCharge = 0;
    this.shippingError = '';
    this.pinError = '';
    this.pinMessage = '';
    return;
  }

  const saved = this.savedAddresses.find(
    address => address.id === id
  );

  if (!saved) {
    return;
  }

  this.address = {
    house: saved.house || '',
    area: [
      saved.street,
      saved.area,
      saved.landmark
    ].filter(value => !!value?.trim()).join(', '),
    city: saved.city || '',
    state: saved.state || '',
    pinCode: saved.pincode || ''
  };

  // Use saved recipient details to prefill checkout contact fields.
  this.contact.fullName = saved.fullName || this.contact.fullName;
  this.contact.mobile = saved.phone || this.contact.mobile;

  this.pinError = '';
  this.pinMessage = '';

  if (this.validPinCode) {
    this.getShippingQuote(this.address.pinCode);
  }
}


  // -----------------------------------
  // PICKUP WINDOW
  // -----------------------------------

  get pickupWindowText(): string {
    return '9:00 AM – 7:00 PM';
  }

  // -----------------------------------
  // PIN VALIDATION
  // -----------------------------------

  get validPinCode(): boolean {

    return /^[1-9][0-9]{5}$/.test(
      this.address.pinCode.trim()
    );
  }

  // -----------------------------------
  // PIN LOOKUP
  // -----------------------------------

  onPinCodeChange(): void {

    this.shippingQuote = null;
this.shippingQuotePinCode = null;
this.shippingCharge = 0;
this.shippingError = '';
this.shippingLoading = false;

    const pin = this.address.pinCode.trim();

    this.pinError = '';
    this.pinMessage = '';

    if (!/^[1-9][0-9]{5}$/.test(pin)) {

      this.pinLookupSequence++;

      this.pinLoading = false;

      this.address.city = '';
      this.address.state = '';

      return;
    }

    this.lookupPinCode(pin);
  }

  private lookupPinCode(pin: string): void {

    const requestSequence =
      ++this.pinLookupSequence;

    this.pinLoading = true;

    this.pinError = '';
    this.pinMessage = '';

    this.http.get<PostalLookupResponse[]>(
      `https://api.postalpincode.in/pincode/${pin}`
    ).subscribe({

      next: (response) => {

        if (
          requestSequence !== this.pinLookupSequence ||
          this.address.pinCode.trim() !== pin
        ) {
          return;
        }

        this.pinLoading = false;

        const result = response?.[0];

        const postOffice =
          result?.Status === 'Success'
            ? result.PostOffice?.find(
                location =>
                  location.District &&
                  location.State
              )
            : undefined;

        if (!postOffice) {

          this.address.city = '';
          this.address.state = '';

          this.pinError =
            'PIN code not found. Please check it.';

          return;
        }

        this.address.city =
          postOffice.District!;

        this.address.state =
          postOffice.State!;

        this.pinMessage =
          'City and state filled in from the PIN code.';

          this.getShippingQuote(pin);
      },

      error: () => {

        if (
          requestSequence !==
          this.pinLookupSequence
        ) {
          return;
        }

        this.pinLoading = false;

        this.address.city = '';
        this.address.state = '';

        this.pinError =
          'Unable to verify PIN code. Please try again or enter the city and state manually.';
      }
    });
  }

  // LOAD AVAILABLE COUPONS
loadAvailableCoupons(): void {
  this.http.get<any[]>(
    `${this.couponApi}/available`
  ).subscribe({
    next: (coupons) => {
      this.availableCoupons = coupons || [];
    },
    error: (error) => {
      console.error('Unable to load coupons:', error);
      this.couponError = 'Unable to load coupons right now.';
    }
  });
}


// APPLY COUPON
applyCoupon(): void {
  this.couponError = '';
  this.couponMessage = '';

  const code = this.couponCode.trim();

  if (!code) {
    this.couponError = 'Please enter a coupon code.';
    return;
  }

  if (!this.product) {
    this.couponError = 'Product information is missing.';
    return;
  }

  this.couponLoading = true;

  const subtotal = Number(this.product.price);

  this.http.get<any>(
    `${this.couponApi}/apply`,
    {
      params: {
        code,
        subtotal: subtotal.toFixed(2)
      }
    }
  ).subscribe({
    next: (response) => {
      this.couponLoading = false;

      this.appliedCoupon = {
        code: response.code,
        type: response.type,
        discountValue: Number(response.discountValue),
        discountAmount: Number(response.discountAmount)
      };

      this.couponCode = response.code;
      this.couponMessage = response.message ||
        'Coupon applied successfully.';
    },
    error: (error) => {
      this.couponLoading = false;
      this.appliedCoupon = null;

      this.couponError =
        error?.error?.message ||
        'Invalid coupon or coupon could not be applied.';
    }
  });
}


// REMOVE COUPON
removeCoupon(): void {
  this.appliedCoupon = null;
  this.couponCode = '';
  this.couponMessage = '';
  this.couponError = '';
}


// FINAL ORDER TOTAL
get orderTotal(): number {
  const subtotal = Number(this.product?.price || 0);
  const delivery = this.isStorePickup
    ? 0
    : Number(this.shippingCharge || 0);
  const discount = Number(
    this.appliedCoupon?.discountAmount || 0
  );

  return Math.max(0, subtotal + delivery - discount);
}

  // -----------------------------------
  // STEP 1
  // ONLINE / STORE PICKUP
  // -----------------------------------

  continueToContact(): void {

    this.error = '';

    // =================================
    // STORE PICKUP
    // =================================

    if (this.isStorePickup) {

      this.onPickupTimeChange(this.expectedPickupTime);

      if (!this.expectedPickupTime.trim()) {
        this.pickupTimeError = 'Please select your expected pickup time.';
        this.error = this.pickupTimeError;
        return;
      }

      if (!this.isPickupTimeValid()) {
        this.error = this.pickupTimeError ||
          'Pickup time must be between 9:00 AM and 7:00 PM.';
        return;
      }

      this.step = 2;

      return;
    }

    

    // =================================
    // ONLINE ORDER
    // =================================

    const {
      house,
      area,
      city,
      state
    } = this.address;

    if (
      !house.trim() ||
      !area.trim() ||
      !city.trim() ||
      !state.trim()
    ) {

      this.error =
        'Please fill in all address fields.';

      return;
    }

    if (!this.validPinCode) {

      this.error =
        'Enter a valid 6-digit Indian PIN code.';

      return;
    }

    if (this.pinLoading) {

      this.error =
        'Please wait while we look up your PIN code.';

      return;
    }


    // Delivery charge must be calculated before checkout can continue.
    if (!this.isStorePickup) {
      const pin = this.address.pinCode.trim();

      if (this.shippingLoading) {
        this.error = 'Please wait while delivery charge is calculated.';
        return;
      }

      if (
        !this.shippingQuote ||
        this.shippingQuotePinCode !== pin
      ) {
        this.error = 'Calculating delivery charge. Please wait and try again.';

        this.getShippingQuote(pin);
        return;
      }

      const charge = Number(this.shippingQuote.shippingCharge);

      if (!Number.isFinite(charge) || charge < 0) {
        this.shippingQuote = null;
        this.shippingQuotePinCode = null;
        this.shippingCharge = 0;
        this.shippingError = 'Invalid delivery charge received.';
        this.error = this.shippingError;
        return;
      }
    }


    // Save address for online orders.
    localStorage.setItem(
      'savedDeliveryAddress',
      JSON.stringify(this.address)
    );

    this.step = 2;
  }

  // -----------------------------------
  // PICKUP TIME VALIDATION
  // -----------------------------------

  onPickupTimeChange(value: string): void {
    this.expectedPickupTime = value;
    this.pickupTimeError = '';

    if (!value) {
      return;
    }

    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      this.pickupTimeError = 'Please select a valid pickup time.';
      return;
    }

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 9 * 60) {
      this.pickupTimeError = 'Store pickup starts at 9:00 AM. Please choose a later time.';
    } else if (totalMinutes > 19 * 60) {
      this.pickupTimeError = 'Store closes at 7:00 PM. Please select a pickup time at or before 7:00 PM.';
    }
  }

  private isPickupTimeValid(): boolean {

    if (!this.expectedPickupTime) {
      return false;
    }

    const [hours, minutes] =
      this.expectedPickupTime
        .split(':')
        .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return false;
    }

    const totalMinutes =
      hours * 60 + minutes;

    const startMinutes =
      9 * 60;

    const endMinutes =
      19 * 60;

    return (
      totalMinutes >= startMinutes &&
      totalMinutes <= endMinutes
    );
  }

  // -----------------------------------
  // STEP 2
  // CONTACT
  // -----------------------------------

  continueToPayment(): void {

    this.error = '';

    if (!this.contact.fullName.trim()) {

      this.error =
        'Please enter your full name.';

      return;
    }

    if (
      !/^[6-9][0-9]{9}$/.test(
        this.contact.mobile.trim()
      )
    ) {

      this.error =
        'Enter a valid 10-digit mobile number.';

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.contact.email.trim()
      )
    ) {

      this.error =
        'Enter a valid email address.';

      return;
    }

    this.step = 3;
  }

  // -----------------------------------
  // BACK
  // -----------------------------------

  back(): void {

    this.error = '';

    if (this.step > 1) {
      this.step--;
    }
  }

  // -----------------------------------
  // PAYMENT
  // -----------------------------------

  selectPayment(method: string): void {
  this.error = '';

  const paymentMethod = method.trim().toUpperCase();

  if (
    paymentMethod === 'COD' ||
    paymentMethod === 'CASH_ON_DELIVERY' ||
    paymentMethod === 'CASH ON DELIVERY'
  ) {
    this.selectedPayment = '';

    alert(
      'You are not eligible for Cash on Delivery (COD). Please select UPI OR CARD to continue.'
    );

    this.cdr.detectChanges();
    return;
  }

  this.selectedPayment = method;
}

  confirmPaymentMethod(): void {
    
  this.error = '';

  if (
  ['COD', 'CASH_ON_DELIVERY', 'CASH ON DELIVERY'].includes(
    this.selectedPayment.trim().toUpperCase()
  )
) {
  this.selectedPayment = '';
  alert(
    'You are not eligible for Cash on Delivery (COD). Please select Razorpay to continue.'
  );
  this.cdr.detectChanges();
  return;
}

  if (!this.product) {
    this.error = 'Product information is missing.';
    return;
  }

  if (!this.isStorePickup && this.shippingLoading) {
  this.error = 'Please wait while delivery charge is calculated.';
  return;
}


    // Never initiate payment without a valid shipping quote.
    if (!this.isStorePickup) {
      const pin = this.address.pinCode.trim();

      if (this.shippingLoading) {
        this.error = 'Please wait while delivery charge is calculated.';
        return;
      }

      if (
        !this.shippingQuote ||
        this.shippingQuotePinCode !== pin
      ) {
        this.error = 'Delivery charge is not confirmed. Payment is blocked.';

        this.getShippingQuote(pin);
        return;
      }

      if (
        !Number.isFinite(Number(this.shippingQuote.shippingCharge)) ||
        Number(this.shippingQuote.shippingCharge) < 0
      ) {
        this.error = 'Invalid delivery charge. Payment is blocked.';
        return;
      }
    }
const amount = Number(this.orderTotal.toFixed(2));

if (!amount || amount <= 0) {
  this.error = 'Invalid payment amount.';
  return;
}

const token = localStorage.getItem('authToken');

if (!token) {
  this.error = 'Your session has expired. Please log in again.';
  this.router.navigate(['/login'], {
    queryParams: {
      returnUrl: '/checkout'
    }
  });
  return;
}

const request = {
  amount: amount
};

const headers = new HttpHeaders({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

console.log('Creating Razorpay order...', request);

this.http.post<RazorpayOrderResponse>(
  `${apiBaseUrl()}/api/payment/create-order`,
  request,
  { headers }
).subscribe({    
    next: (response) => {

      console.log('Razorpay Order Created:', response);

      const options = {
        key: response.keyId,
        amount: response.amount,
        currency: response.currency,
        name: 'Rajesh Stationery & Novelty',
        description: this.product?.name || 'Product Purchase',
        order_id: response.orderId,

        prefill: {
          name: this.contact.fullName,
          email: this.contact.email,
          contact: this.contact.mobile
        },

        theme: {
          color: '#111827'
        },

        
handler: (paymentResponse: any) => {
  const token = localStorage.getItem('authToken');

  if (!token || !this.product) {
    this.error = 'Please log in again before confirming your order.';
    return;
  }

  const orderRequest = {
    items: [
      {
        productId: this.product.id,
        quantity: 1
      }
    ],
    fulfillmentType: this.isStorePickup ? 'STORE_PICKUP' : 'ONLINE',
    paymentMethod: 'RAZORPAY',
    customerName: this.contact.fullName.trim(),
    customerEmail: this.contact.email.trim(),
    customerPhone: this.contact.mobile.trim(),

    addressLine1: this.isStorePickup
      ? undefined
      : `${this.address.house}, ${this.address.area}`,

    addressLine2: undefined,
    city: this.isStorePickup ? undefined : this.address.city,
    state: this.isStorePickup ? undefined : this.address.state,
    pinCode: this.isStorePickup ? undefined : this.address.pinCode,

    pickupStore: this.isStorePickup
      ? 'Rajesh Stationery & Novelty'
      : undefined,

    discount: 0,
    deliveryCharge: this.isStorePickup ? 0 : this.shippingCharge
  };

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  this.http.post<any>(
    `${apiBaseUrl()}/api/payment/verify-and-create-order`,
    {
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
      order: orderRequest
    },
    { headers }
  ).subscribe({
    next: (savedOrder) => {
      console.log('Verified payment and saved order:', savedOrder);

      alert(`Payment verified! Order number: ${savedOrder.orderNumber}`);

      this.router.navigate(['/orders']);
    },
    error: (error) => {
      console.error('Order confirmation failed:', error);

      this.error =
        error?.error?.message ||
        'Payment was completed, but order confirmation failed. Contact support with your Razorpay Payment ID.';

      // Do not retry payment automatically.
    }
  });
},


        modal: {
          ondismiss: () => {
            console.log('Razorpay checkout closed.');
          }
        }
      };

      const razorpay = new Razorpay(options);

      razorpay.open();
    },

    error: (error) => {
      console.error('Payment Order Error:', error);

      this.error =
        error?.error?.message ||
        'Unable to start payment. Please try again.';
    }
  });
}
  // -----------------------------------
  // SHOP
  // -----------------------------------

  goToShop(): void {

    this.router.navigate(['/']);
  }

 
private getShippingQuote(pin: string): void {
  if (this.isStorePickup) return;

  if (!this.product) {
    this.shippingError = 'Product information is missing.';
    return;
  }

  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    this.shippingError = 'Enter a valid 6-digit PIN code.';
    return;
  }

  this.shippingLoading = true;
  this.shippingError = '';
  this.shippingQuote = null;
  this.shippingQuotePinCode = null;
  this.shippingCharge = 0;

  const request = {
    deliveryPincode: pin,
    cod: this.selectedPayment === 'COD',
    items: [
      {
        productId: this.product.id,
        quantity: 1
      }
    ]
  };

  this.http.post<ShippingQuoteResponse>(
    `${apiBaseUrl()}/api/shipping/quote`,
    request
  ).subscribe({
    next: (response) => {
      this.shippingLoading = false;

      const charge = Number(response?.shippingCharge);

      if (!Number.isFinite(charge) || charge < 0) {
        this.shippingError =
          'The delivery service returned an invalid charge.';
        return;
      }

      this.shippingQuote = response;
      this.shippingQuotePinCode = pin;
      this.shippingCharge = charge;

      console.log('Shipping quote confirmed:', response);
    },

    error: (error) => {
      this.shippingLoading = false;
      this.shippingCharge = 0;
      this.shippingQuote = null;
      this.shippingQuotePinCode = null;

      console.error('Shipping Quote Error:', error);

      this.shippingError =
        error?.error?.message ||
        'Unable to calculate delivery charge. Payment is blocked.';
    }
  });
}

}