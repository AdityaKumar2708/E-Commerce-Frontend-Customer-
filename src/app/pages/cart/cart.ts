import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cart as CartService } from '../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  readonly cart = inject(CartService);
  private readonly router = inject(Router);

  buyAll(): void {
    if (this.cart.items().length) this.router.navigate(['/checkout']);
  }
}
