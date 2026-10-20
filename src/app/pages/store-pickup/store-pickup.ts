import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Cart as CartService } from '../../core/services/cart';
import { apiBaseUrl } from '../../core/services/api-url';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;

  // Normal online price
  price: number;

  // Pickup-specific price
  pickupPrice?: number;

  originalPrice?: number;
  oldPrice?: number;

  imageUrl?: string;
  imageUrls?: string[];
  imageFailed?: boolean;

  stock: number;
  active?: boolean;
  badge?: string;
  rating?: number;
  sku?: string;

  salesChannel?: 'ONLINE' | 'STORE_PICKUP';
}

@Component({
  selector: 'app-store-pickup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './store-pickup.html',
  styleUrl: './store-pickup.css',
})
export class StorePickup implements OnInit {

  private http = inject(HttpClient);
  private router = inject(Router);
  private cart = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  private readonly API_URL = `${apiBaseUrl()}/api/products`;

  searchText = '';
  private searchScrollTriggered = false;

  selectedCategory = 'All';

  products: Product[] = [];
  filteredProducts: Product[] = [];

  loading = false;
  error = '';

  isLoggedIn = false;
  currentYear = new Date().getFullYear();

  get cartCount(): number {
    return this.cart.itemCount();
  }

  // Categories
  categories: string[] = [];

  ngOnInit(): void {

    this.isLoggedIn = !!localStorage.getItem('authToken');

    this.loadProducts();
  }

  // Load products
 
loadProducts(): void {
  this.loading = true;
  this.error = '';

  this.http.get<any>(this.API_URL).subscribe({
    next: (response: any) => {
      console.log('Store Pickup API Response:', response);

      // Handle different API response formats
      const responseData = Array.isArray(response)
        ? response
        : response?.content ??
          response?.data ??
          response?.products ??
          [];

      const allProducts: Product[] = Array.isArray(responseData)
        ? responseData
        : [];

      // Select products available for Store Pickup
      this.products = allProducts

      
        .filter((product: Product) => {
          const channel = String(product.salesChannel ?? '')
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, '_');

          // Explicitly online-only products must not appear here
          if (channel === 'ONLINE') {
            return false;
          }

          // Explicit Store Pickup products
          if (channel === 'STORE_PICKUP') {
            return true;
          }

          // Backward compatibility for older product records
          // with a pickup price but no salesChannel
          return !channel && product.pickupPrice != null;
        })
        .map((product: Product) => {
          const imageUrls = product.imageUrls?.map(url =>
            this.resolveImageUrl(url)
          );

          const imageUrl = product.imageUrl || imageUrls?.[0];

          return {
            ...product,
            imageUrl: imageUrl
              ? this.resolveImageUrl(imageUrl)
              : undefined,
            imageUrls
          };
        });


this.categories = [
  ...new Set(
    this.products
      .map(product => product.category?.trim())
      .filter(
        (category): category is string =>
          typeof category === 'string' &&
          category.length > 0
      )
  )
];


      this.loading = false;
      this.applyFilters();
      this.cdr.detectChanges();

      console.log('Store Pickup Products:', this.products);
      console.log('Filtered Store Pickup Products:', this.filteredProducts);
    },

    error: (err: any) => {
      console.error('Store Pickup API Error:', err);

      this.error =
        'Products could not be loaded. Please try again.';

      this.loading = false;
    }
  });
}

  // Resolve image URL
  private resolveImageUrl(url: string): string {

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${apiBaseUrl()}${
      url.startsWith('/') ? '' : '/'
    }${url}`;
  }

  // Filters
  applyFilters(): void {

    const search =
      this.searchText.trim().toLowerCase();

    this.filteredProducts =
      this.products.filter(product => {

        const name =
          (product.name ?? '').toLowerCase();

        const category =
          (product.category ?? '').toLowerCase();

        const description =
          (product.description ?? '').toLowerCase();

        const sku =
          (product.sku ?? '').toLowerCase();

        const matchesCategory =
          this.selectedCategory === 'All' ||
          category ===
            this.selectedCategory
              .trim()
              .toLowerCase();

        const matchesSearch =
          !search ||
          name.includes(search) ||
          category.includes(search) ||
          description.includes(search) ||
          sku.includes(search);

        return (
          matchesCategory &&
          matchesSearch
        );
      });
  }

  onSearch(value: string): void {

    this.searchText = value;

    this.applyFilters();

    if (!value.trim()) {

      this.searchScrollTriggered = false;

    } else if (!this.searchScrollTriggered) {

      this.searchScrollTriggered = true;

      this.scrollToProducts();
    }
  }

  selectCategory(category: string): void {

    this.selectedCategory = category;

    this.applyFilters();
  }

  clearFilters(): void {

    this.searchText = '';
    this.selectedCategory = 'All';
    this.searchScrollTriggered = false;

    this.applyFilters();
  }

  // Add product to cart
  addToCart(product: Product): void {

    this.cart.addItem({
      ...product,

      // Store pickup uses pickup price
      price:
        product.pickupPrice ??
        product.price
    });
  }

  // Buy Now
  buyNow(product: Product): void {

    console.log(
      'STORE PICKUP BUY NOW:',
      product
    );

    const pickupProduct = {
      ...product,

      // Store pickup price
      price:
        product.pickupPrice ??
        product.price,

      fulfillmentType: 'STORE_PICKUP'
    };

    sessionStorage.setItem(
      'buyNowProduct',
      JSON.stringify(pickupProduct)
    );

    const token =
      localStorage.getItem('authToken');

    if (!token) {

      this.router.navigate(
        ['/login'],
        {
          queryParams: {
            returnUrl: '/store-pickup',
            action: 'pickup-buy-now',
            productId: product.id
          }
        }
      );

      return;
    }

    this.router.navigate(
      ['/checkout'],
      {
        queryParams: {
          action: 'pickup-buy-now',
          productId: product.id,
          fulfillmentType: 'STORE_PICKUP'
        }
      }
    );
  }

  // Product details
  viewProduct(product: Product): void {

    this.router.navigate([
      '/product',
      product.id
    ]);
  }

  login(): void {

    this.router.navigate(['/login']);
  }

  openCart(): void {

    this.router.navigate(['/cart']);
  }

  openAccount(): void {

    this.router.navigate(['/account']);
  }

  scrollToProducts(): void {

    document
      .getElementById('products')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  trackByProductId(
    index: number,
    product: Product
  ): number {

    return product.id;
  }

  // Back to normal online store
  goToOnlineStore(): void {

    this.router.navigate(['/']);
  }
}