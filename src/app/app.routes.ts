
import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { StorePickup } from './pages/store-pickup/store-pickup';
import { AddressSaved } from './pages/address-saved/address-saved';

export const routes: Routes = [
  {
    path: '',
    component: Dashboard,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'cart',
    component: Cart
  },
  {
    path: 'checkout',
    component: Checkout
  },
  {
    path: 'store-pickup',
    component: StorePickup
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/account/account').then(m => m.Account)
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders').then(m => m.Orders)
  },
  {
    path: 'address-saved',
    component: AddressSaved
  },
  {
    path: '**',
    redirectTo: ''
  }
];
