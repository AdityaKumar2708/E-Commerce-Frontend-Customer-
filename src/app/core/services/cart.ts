import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem } from '../models/cart-item';

@Injectable({
  providedIn: 'root',
})
export class Cart {
  private readonly storageKey = 'ecommerce-customer-cart';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly itemsState = signal<CartItem[]>(this.readItems());

  readonly items = this.itemsState.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsState().reduce((count, item) => count + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce((total, item) => total + item.price * item.quantity, 0)
  );

  addItem(product: Omit<CartItem, 'quantity'>): void {
    const items = this.itemsState();
    const existing = items.find(item => item.id === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) return;
      this.saveItems(items.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
      return;
    }

    if (product.stock > 0) this.saveItems([...items, { ...product, quantity: 1 }]);
  }

  removeItem(id: number): void {
    this.saveItems(this.itemsState().filter(item => item.id !== id));
  }

  setQuantity(id: number, quantity: number): void {
    const item = this.itemsState().find(current => current.id === id);
    if (!item) return;
    if (quantity < 1) {
      this.removeItem(id);
      return;
    }

    this.saveItems(this.itemsState().map(current =>
      current.id === id
        ? { ...current, quantity: Math.min(quantity, current.stock) }
        : current
    ));
  }

  clear(): void {
    this.saveItems([]);
  }

  private saveItems(items: CartItem[]): void {
    this.itemsState.set(items);
    if (this.isBrowser) localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private readItems(): CartItem[] {
    if (!this.isBrowser) return [];
    try {
      const stored = localStorage.getItem(this.storageKey);
      const items: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(items) ? items as CartItem[] : [];
    } catch {
      return [];
    }
  }
}
