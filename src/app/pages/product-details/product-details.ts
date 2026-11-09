
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Cart as CartService } from '../../core/services/cart';
import { apiBaseUrl } from '../../core/services/api-url';

interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  stock: number;
  sku?: string;
  active?: boolean;
}

interface Review {
  id: number;
  customerName: string;
  rating: number;
  message: string;
  photoUrl?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css'
})
export class ProductDetails implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cart = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  shareMenuOpen = false;
linkCopied = false; 

  private readonly API_URL = `${apiBaseUrl()}/api/products`;

  product: Product | null = null;
  reviews: Review[] = [];

  selectedImage = '';
  images: string[] = [];

  loading = true;
  error = '';
  addingToCart = false;
  buyingNow = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!id || Number.isNaN(id)) {
        this.error = 'Invalid product.';
        this.loading = false;
        return;
      }

      this.loadProduct(id);
    });
  }


loadProduct(id: number): void {
  this.loading = true;
  this.error = '';
  this.cdr.detectChanges();

  this.http.get<Product>(`${this.API_URL}/${id}`).subscribe({
    next: (product) => {
      console.log('Product API Response:', product);

      this.product = product;

      const allImages = [
        ...(product.imageUrls || []),
        ...(product.imageUrl ? [product.imageUrl] : [])
      ];

      this.images = [...new Set(allImages)]
        .filter(Boolean)
        .map(url => this.resolveImageUrl(url));

      this.selectedImage = this.images[0] || '';

      this.loading = false;
      this.cdr.detectChanges();

      console.log('Product loaded successfully:', this.product);
    },

    error: (err) => {
      console.error('Product details API Error:', err);

      this.error = 'Unable to load this product. Please try again.';
      this.loading = false;

      this.cdr.detectChanges();
    }
  });
}

  private resolveImageUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;

    return `${apiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  addToCart(): void {
    if (!this.product || this.product.stock <= 0) return;

    this.addingToCart = true;

    try {
      this.cart.addItem(this.product);
      alert('Product added to cart successfully!');
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Unable to add product to cart.');
    } finally {
      this.addingToCart = false;
    }
  }

  buyNow(): void {
    if (!this.product || this.product.stock <= 0) return;

    this.buyingNow = true;

    try {
      this.cart.addItem(this.product);
      this.router.navigate(['/checkout']);
    } catch (error) {
      console.error('Buy now error:', error);
      alert('Unable to continue. Please try again.');
    } finally {
      this.buyingNow = false;
    }
  }

  get discountPercentage(): number {
    if (!this.product?.originalPrice || !this.product.price) return 0;

    return Math.round(
      ((this.product.originalPrice - this.product.price) /
        this.product.originalPrice) * 100
    );
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;

    return this.reviews.reduce((sum, review) => sum + review.rating, 0)
      / this.reviews.length;
  }

  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < rating);
  }

  toggleShareMenu(): void {
  this.shareMenuOpen = !this.shareMenuOpen;
  this.linkCopied = false;
}

shareOnWhatsApp(): void {
  if (!this.product) return;

  const productUrl = window.location.href;

  const message =
    `Check out this product: ${this.product.name}\n` +
    `Price: ₹${this.product.price}\n` +
    `View Product: ${productUrl}`;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

  this.shareMenuOpen = false;
}

async copyProductLink(): Promise<void> {
  const productUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(productUrl);
    this.linkCopied = true;
  } catch (error) {
    console.error('Copy link error:', error);
    window.prompt('Copy this product link:', productUrl);
  }
}

loadReviews(productId: number): void {
  this.http
    .get<Review[]>(`${this.API_URL}/${productId}/reviews`)
    .subscribe({
      next: (reviews) => {
        this.reviews = reviews || [];
        this.cdr.detectChanges();

        console.log('Product Reviews:', this.reviews);
      },
      error: (err) => {
        console.error('Reviews API Error:', err);
        this.reviews = [];
        this.cdr.detectChanges();
      }
    });
}
}
