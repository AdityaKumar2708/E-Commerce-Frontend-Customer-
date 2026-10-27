
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';

import { Location } from '@angular/common';

interface ApiOrderItem {
  productId?: number;
  productName?: string;
  productImage?: string | null;
  unitPrice?: number | string;
  quantity?: number;
  totalPrice?: number | string;
  orderItemId?: number;
}

interface ApiOrder {
  id: number;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  fulfillmentType?: string;

  productTotal?: number | string;
  deliveryCharge?: number | string;
  discount?: number | string;
  totalAmount: number | string;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;

  shiprocketStatus?: string;
  shiprocketShipmentId?: string | number;
  shiprocketAwbCode?: string;
  shiprocketError?: string;

  pickupLocationName?: string;
  pickupAddress?: string;
  pickupPincode?: string;

  pickedUpAt?: string | null;
pickupStore?: string | null;

  createdAt: string;
  updatedAt?: string;
  items: ApiOrderItem[];
}

interface OrderItem {
  orderItemId?: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  totalPrice: number;
  imageFailed?: boolean;

  rating: number;
  reviewText: string;
  reviewOpen: boolean;
  reviewSubmitting: boolean;
  reviewMessage: string;
}


interface Order {
  id: string;
  databaseId: number;
  date: string;
  updatedAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;

  productTotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;

  razorpayOrderId: string;
  razorpayPaymentId: string;

  shiprocketStatus: string;
  shiprocketShipmentId: string;
  shiprocketAwbCode: string;
  shiprocketError: string;

  pickupLocationName: string;
  pickupAddress: string;
  pickupPincode: string;

  pickedUpAt: string | null;
pickupStore: string;

  items: OrderItem[];

    trackingLoading: boolean;
  trackingError: string;
  trackingDetails: any | null;

  cancellationLoading: boolean;
cancellationError: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  
private readonly apiUrl =
  'https://e-commerce-backend-kyir.onrender.com/api/customer/orders';


  orders: Order[] = [];
  loading = true;
  errorMessage = '';

  private location = inject(Location);

  private router = inject(Router);

  // Stores the order whose details are currently open.
  expandedOrderId: string | null = null;

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      this.orders = [];
      this.loading = false;
      this.errorMessage = 'Please log in to view your orders.';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<ApiOrder[]>(this.apiUrl, { headers }).subscribe({
      next: (response: any) => {
  console.log('Orders API raw response:', response);
  console.log('Is response an array?', Array.isArray(response));

  let apiOrders: ApiOrder[] = [];

if (Array.isArray(response)) {
  apiOrders = response;
} else if (Array.isArray(response?.orders)) {
  apiOrders = response.orders;
} else if (Array.isArray(response?.data)) {
  apiOrders = response.data;
} else if (Array.isArray(response?.content)) {
  apiOrders = response.content;
} else if (Array.isArray(response?.data?.orders)) {
  apiOrders = response.data.orders;
}

console.log('Complete API response:', response);
console.log('Orders found:', apiOrders.length);
console.log('Orders data:', apiOrders);

  console.log('Orders received:', apiOrders.length);

apiOrders.forEach(order => {
  console.log('Order ID:', order.id);
  console.log('Shiprocket status:', order.shiprocketStatus);
  console.log('Shipment ID:', order.shiprocketShipmentId);
  console.log('AWB code:', order.shiprocketAwbCode);
});

        this.orders = apiOrders.map((order) => {
          const items: OrderItem[] = (order.items ?? []).map((item) => {
            const price = Number(item.unitPrice) || 0;
            const quantity = Number(item.quantity) || 1;

            return {
  orderItemId: item.orderItemId,
  name: item.productName || 'Product',
  image: this.resolveProductImage(item.productImage),
  imageFailed: false,
  price,
  quantity,
  totalPrice: Number(item.totalPrice) || price * quantity,

  rating: 0,
  reviewText: '',
  reviewOpen: false,
  reviewSubmitting: false,
  reviewMessage: ''
};
          });

          return {
            id: order.orderNumber || String(order.id),
            databaseId: order.id,
            date: order.createdAt || '',
            updatedAt: order.updatedAt || '',
            status: order.orderStatus || 'PENDING',
            paymentStatus: order.paymentStatus || 'UNKNOWN',
            paymentMethod: order.paymentMethod || '',
            fulfillmentType: order.fulfillmentType || '',

            productTotal: Number(order.productTotal) || 0,
            deliveryCharge: Number(order.deliveryCharge) || 0,
            discount: Number(order.discount) || 0,
            total: Number(order.totalAmount) || 0,

            customerName: order.customerName || '',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',

            addressLine1: order.addressLine1 || '',
            addressLine2: order.addressLine2 || '',
            city: order.city || '',
            state: order.state || '',
            pinCode: order.pinCode || '',

            razorpayOrderId: order.razorpayOrderId || '',
            razorpayPaymentId: order.razorpayPaymentId || '',

            shiprocketStatus: order.shiprocketStatus || '',
            shiprocketShipmentId: String(order.shiprocketShipmentId || ''),
            shiprocketAwbCode: order.shiprocketAwbCode || '',
            shiprocketError: order.shiprocketError || '',

            
            pickupLocationName: order.pickupLocationName || '',
pickupAddress: order.pickupAddress || '',
pickupPincode: order.pickupPincode || '',

pickedUpAt: order.pickedUpAt || null,
pickupStore: order.pickupStore || order.pickupLocationName || '',

            items,

            // Tracking properties
            trackingLoading: false,
            trackingError: '',
            trackingDetails: null,
            cancellationLoading: false,
            cancellationError: ''

          };
        });

        // Close details if the list is refreshed.
        if (
          this.expandedOrderId &&
          !this.orders.some(order => order.id === this.expandedOrderId)
        ) {
          this.expandedOrderId = null;
        }

        this.loading = false;
this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Failed to load customer orders:', error);

       this.orders = [];
this.loading = false;
this.cdr.detectChanges();

        if (error.status === 401 || error.status === 403) {
          this.errorMessage =
            'Your session has expired. Please log in again.';
        } else {
          this.errorMessage =
            'Unable to load orders. Please try again.';
        }
      }
    });
  }

  toggleDetails(order: Order): void {
    this.expandedOrderId =
      this.expandedOrderId === order.id ? null : order.id;
  }

  isExpanded(order: Order): boolean {
    return this.expandedOrderId === order.id;
  }

  getItemCount(order: Order): number {
    return order.items.reduce(
      (count, item) => count + item.quantity,
      0
    );
  }

  formatDate(date: string): string {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
  this.router.navigate(['/dashboard'], {
    replaceUrl: true
  });
}

  getStatusClass(status: string): string {
    const value = (status || '').toLowerCase();

    if (value.includes('deliver')) return 'delivered';
    if (value.includes('cancel')) return 'cancelled';

    if (
      value.includes('ship') ||
      value.includes('transit') ||
      value.includes('dispatch')
    ) {
      return 'shipped';
    }

    if (value.includes('accept') || value.includes('confirm')) {
      return 'confirmed';
    }

    return 'placed';
  }


  /**
   * Cancellation rules:
   * ONLINE: cancellable until dispatch/shipping starts.
   * STORE_PICKUP (offline): cancellable during the first hour even if packed;
   * after one hour, cancellable only while not packed. Picked-up/delivered
   * and already-cancelled orders cannot be cancelled.
   * The backend must enforce these rules too; this method only controls the UI.
   */
  canCancelOrder(order: Order): boolean {
    const status = this.normalizeStatus(order.status);
    const shipmentStatus = this.normalizeStatus(order.shiprocketStatus);

    if (status.includes('CANCEL')) return false;
    if (status.includes('DELIVER') || status.includes('PICKED_UP')) return false;

    if (order.fulfillmentType === 'ONLINE') {
      const dispatchIndicators = [
        'DISPATCH', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
        'DELIVERED', 'PICKED_UP_BY_COURIER'
      ];
      return !dispatchIndicators.some(value =>
        status.includes(value) || shipmentStatus.includes(value)
      );
    }

    // Treat STORE_PICKUP as the offline/store order flow.
    if (order.fulfillmentType === 'STORE_PICKUP') {
      const createdAt = new Date(order.date).getTime();
      if (!Number.isFinite(createdAt)) return false;

      const withinFirstHour = Date.now() - createdAt <= 60 * 60 * 1000;
      if (withinFirstHour) return true; // even if already packed

      return status !== 'PACKED'; // after 1 hour, allow only if not packed
    }

    return false;
  }

  getCancellationHint(order: Order): string {
    if (this.canCancelOrder(order)) {
      if (order.fulfillmentType === 'ONLINE') {
        return 'You can cancel this order until it is dispatched.';
      }
      return 'Within 1 hour of placing the order, cancellation is allowed even if packed. After 1 hour, cancellation is allowed only before packing.';
    }

    const status = this.normalizeStatus(order.status);
    const shipmentStatus = this.normalizeStatus(order.shiprocketStatus);

    if (status.includes('CANCEL')) return 'This order has already been cancelled.';
    if (order.fulfillmentType === 'ONLINE' &&
        ['DISPATCH', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP_BY_COURIER']
          .some(value => status.includes(value) || shipmentStatus.includes(value))) {
      return 'This online order can no longer be cancelled because dispatch has started.';
    }
    if (order.fulfillmentType === 'STORE_PICKUP' && status === 'PACKED') {
      return 'This order is packed and the first hour has passed, so it can no longer be cancelled.';
    }
    if (status.includes('DELIVER') || status.includes('PICKED_UP')) {
      return 'This order has already been completed.';
    }
    return 'This order cannot be cancelled in its current status.';
  }

  private normalizeStatus(value: string | null | undefined): string {
    return (value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  }

  cancelOrder(order: Order): void {
    if (order.cancellationLoading || !this.canCancelOrder(order)) return;

    const confirmed = window.confirm(
      `Cancel order #${order.id}? This action cannot be undone.`
    );
    if (!confirmed) return;

    const token = this.isBrowser ? localStorage.getItem('authToken') : null;
    if (!token) {
      order.cancellationError = 'Please log in again to cancel this order.';
      return;
    }

    order.cancellationLoading = true;
    order.cancellationError = '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<any>(`${this.apiUrl}/${order.databaseId}/cancel`, {}, { headers })
      .subscribe({
        next: () => {
          order.cancellationLoading = false;
          this.loadOrders();
        },
        error: (error) => {
          console.error('Order cancellation failed:', error);
          order.cancellationLoading = false;
          order.cancellationError = error.error?.message ||
            error.error?.detail ||
            (error.status === 404
              ? 'Cancellation endpoint is not available on the backend yet.'
              : 'Unable to cancel this order. Please refresh and try again.');
          this.cdr.detectChanges();
        }
      });
  }


  loadTracking(order: Order): void {
    if (order.trackingLoading) return;

    if (!order.shiprocketAwbCode) {
      order.trackingError = 'Tracking number is not available yet.';
      return;
    }

    if (!this.isBrowser) return;

    const token = localStorage.getItem('authToken');

    if (!token) {
      order.trackingError = 'Please log in again to track this order.';
      return;
    }

    order.trackingLoading = true;
    order.trackingError = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http
      .get<any>(
        `${this.apiUrl}/${order.databaseId}/tracking`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          order.trackingDetails = response?.trackingDetails ?? response;
          order.trackingLoading = false;
        },
        error: (error) => {
          console.error('Shipment tracking failed:', error);

          order.trackingLoading = false;
          order.trackingError =
            error.error?.message ||
            error.error?.detail ||
            'Unable to fetch live tracking. Please try again.';
        }
      });
  }


getPickupStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    PENDING: 'Order Placed',
    CONFIRMED: 'Accepted',
    PACKED: 'Packed',
    PICKED_UP: 'Picked Up',
    CANCELLED: 'Cancelled'
  };

  return labels[status ?? ''] ?? status ?? 'Unknown';
}


  getTrackingData(order: Order): any {
    const details = order.trackingDetails;

    if (!details) return null;

    // Shiprocket responses can wrap tracking data in tracking_data.
    if (details.tracking_data) {
      return details.tracking_data;
    }

    // Some responses use the AWB as the top-level key.
    const awbData = details[order.shiprocketAwbCode];

    if (awbData?.tracking_data) {
      return awbData.tracking_data;
    }

    if (awbData) {
      return awbData;
    }

    return details;
  }

  getTrackingStatus(order: Order): string {
    const data = this.getTrackingData(order);

    if (!data) return '';

    const activities = this.getTrackingActivities(order);
    const latestActivity = activities.length
      ? activities[0]
      : null;

    return (
      data.shipment_track?.[0]?.current_status ||
      data.current_status ||
      data.shipment_status ||
      latestActivity?.activity ||
      data.track_status_text ||
      'Tracking information received'
    );
  }

  getTrackingActivities(order: Order): any[] {
    const data = this.getTrackingData(order);

    if (!data) return [];

    const activities =
      data.shipment_track_activities ||
      data.tracking_history ||
      data.activities ||
      [];

    // Display newest events first when the API returns a list.
    return Array.isArray(activities) ? activities : [];
  }

  getTrackingUrl(order: Order): string {
    const data = this.getTrackingData(order);

    return (
      data?.track_url ||
      data?.tracking_url ||
      data?.shipment_track?.[0]?.url ||
      ''
    );
  }

  getActivityDate(activity: any): string {
    return (
      activity?.date ||
      activity?.activity_date ||
      activity?.timestamp ||
      ''
    );
  }

  getActivityText(activity: any): string {
    return (
      activity?.activity ||
      activity?.status ||
      activity?.description ||
      'Shipment update'
    );
  }

  getActivityLocation(activity: any): string {
    return activity?.location || activity?.city || '';
  }

  private resolveProductImage(imageUrl?: string | null): string {
  const value = imageUrl?.trim();

  if (!value) {
    return '';
  }

  // Full URL, such as Cloudinary or another image host.
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  // Relative image path: resolve against the backend host.
  const backendOrigin = new URL(this.apiUrl).origin;

  return new URL(
    value.replace(/^\/+/, ''),
    `${backendOrigin}/`
  ).toString();
}

setRating(item: OrderItem, rating: number): void {
  item.rating = rating;
}


submitReview(item: OrderItem, order: Order): void {
  const status = this.normalizeStatus(order.status);

  // Rating is currently allowed only for delivered orders.
  if (status !== 'DELIVERED') {
    item.reviewMessage = 'You can review only delivered orders.';
    return;
  }

  if (!item.orderItemId) {
    item.reviewMessage =
      'Order item ID is missing. Refresh orders and try again.';
    return;
  }

  if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5) {
    item.reviewMessage = 'Please select a rating from 1 to 5 stars.';
    return;
  }

  if (!this.isBrowser) return;

  const token = localStorage.getItem('authToken');

  if (!token) {
    item.reviewMessage = 'Please log in again.';
    return;
  }

  item.reviewSubmitting = true;
  item.reviewMessage = '';

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  const request = {
    rating: item.rating,
    reviewText: item.reviewText.trim() || null,
    photoUrl: null
  };

  this.http.post<any>(
    `${new URL(this.apiUrl).origin}/api/customer/reviews/order-item/${item.orderItemId}`,
    request,
    { headers }
  ).subscribe({
    next: (response) => {
      item.reviewSubmitting = false;
      item.reviewMessage =
        response?.message || 'Review submitted successfully.';
      item.reviewOpen = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      item.reviewSubmitting = false;
      item.reviewMessage =
        error.error?.message ||
        error.error?.detail ||
        'Unable to submit review. Please try again.';
      this.cdr.detectChanges();
    }
  });
}


}
