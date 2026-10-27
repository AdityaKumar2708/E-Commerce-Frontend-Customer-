import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  afterNextRender
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Cart as CartService } from '../../core/services/cart';
import { apiBaseUrl } from '../../core/services/api-url';


interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number;
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
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cart = inject(CartService);

  private cdr = inject(ChangeDetectorRef);

  private readonly API_URL = `${apiBaseUrl()}/api/products`;

  searchText = '';
  private searchScrollTriggered = false;
  selectedCategory = 'All';
  get cartCount(): number {
    return this.cart.itemCount();
  }

  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  error = '';

isLoggedIn = false;
accountMenuOpen = false;
currentYear = new Date().getFullYear();

  toggleAccountMenu(): void {
  this.accountMenuOpen = !this.accountMenuOpen;
}



constructor() {
afterNextRender(() => {
  try {
    this.isLoggedIn = !!localStorage.getItem('authToken');
  } catch (error) {
    this.isLoggedIn = false;
  }

  setTimeout(() => {
    this.loadProducts();
  }, 0);
});
}


openOrders(): void {
  this.accountMenuOpen = false;
  this.router.navigate(['/orders']);
}

manageAddress(): void {
  this.accountMenuOpen = false;
  this.router.navigate(['/address-saved']);
}

logout(): void {
  this.accountMenuOpen = false;

  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  this.isLoggedIn = false;

  this.router.navigate(['/']);
}

categories: string[] = [];


ngOnInit(): void {
  // localStorage is accessed in afterNextRender
  // to avoid errors during server-side rendering.
}


loadProducts(): void {
  this.loading = true;
  this.error = '';

  this.http.get<Product[]>(this.API_URL).subscribe({
    next: (response) => {
      console.log('API Response:', response);

      this.products = Array.isArray(response)
        ? response
            .filter(product => product.salesChannel === 'ONLINE')
            .map(product => {
              const imageUrls = product.imageUrls?.map(
                url => this.resolveImageUrl(url)
              );

              const imageUrl = product.imageUrl || imageUrls?.[0];

              return {
                ...product,
                imageUrl: imageUrl
                  ? this.resolveImageUrl(imageUrl)
                  : undefined,
                imageUrls
              };
            })
        : [];

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

      // Update the product list before ending loading state.
      this.applyFilters();
      this.loading = false;

      this.cdr.markForCheck();

      console.log('Categories:', this.categories);
      console.log('Filtered Products:', this.filteredProducts);
    },

    error: (err) => {
      console.error('API Error:', err);
      this.error = 'Products could not be loaded. Please try again.';
      this.loading = false;
    }
  });
}


  private resolveImageUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${apiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
  }

applyFilters(): void {
  const search = this.searchText.trim().toLowerCase();

  this.filteredProducts = this.products.filter(product => {
    const name = (product.name ?? '').toLowerCase();
    const category = (product.category ?? '').toLowerCase();
    const description = (product.description ?? '').toLowerCase();
    const sku = (product.sku ?? '').toLowerCase();

    const matchesCategory =
      this.selectedCategory === 'All' ||
      category === this.selectedCategory.trim().toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      category.includes(search) ||
      description.includes(search) ||
      sku.includes(search);

    console.log({
      search,
      selectedCategory: this.selectedCategory,
      matchesCategory,
      matchesSearch,
      name
    });

    return matchesCategory && matchesSearch;
  });

  console.log('Filtered products:', this.filteredProducts);
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

  

  // User is logged in, continue to checkout
addToCart(product: Product): void {
  this.cart.addItem(product);
}

buyNow(product: Product): void {
  console.log('BUY NOW CLICKED:', product);

  // Browser storage access
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(
    'buyNowProduct',
    JSON.stringify(product)
  );

  let token: string | null = null;

try {
  token = localStorage.getItem('authToken');
} catch (error) {
  token = null;
}

  if (!token) {
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: '/checkout',
        action: 'buy-now',
        productId: product.id
      }
    });
    return;
  }

  this.router.navigate(['/checkout'], {
    queryParams: {
      action: 'buy-now',
      productId: product.id
    }
  });
}

  login(): void {
    this.router.navigate(['/login']);
  }

  openCart(): void {
    this.router.navigate(['/cart']);
  }

 openAccount(): void {
  this.accountMenuOpen = false;
  this.router.navigate(['/account']);
}

  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }

  scrollToProducts(): void {
    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  openStorePickup(): void {
  this.router.navigate(['/store-pickup']);
}



}


