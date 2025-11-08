// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './domains/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { HomePage } from './domains/homepage/homepage';

export const routes: Routes = [
  {
    path: '', // ✅ homepage principal
    component: HomePage,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./domains/products/product-page/product-page').then(
        (m) => m.ProductPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./domains/categories/category-page/category-page').then(
        (m) => m.CategoryPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'groups',
    loadComponent: () =>
      import(
        './domains/product-groups/product-group-page/product-group-page'
      ).then((m) => m.ProductGroupPage),
    canActivate: [authGuard],
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./domains/customer/customer-page/customer-page').then(
        (m) => m.CustomerPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./domains/expenses/expenses-page/expenses-page').then(
        (m) => m.ExpensesPage
      ),
    canActivate: [authGuard],
  },
  {
    path: '**', // cualquier ruta no encontrada
    redirectTo: '', // redirige al homepage
  },
];
