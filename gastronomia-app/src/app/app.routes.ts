import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'products',
    loadComponent: () => import('./domains/products/product-page/product-page')
    .then(m => m.ProductPage),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./domains/categories/category-page/category-page')
    .then(m => m.CategoryPage),
    canActivate: [authGuard]
  },
  {
    path: 'groups',
    loadComponent: () => import('./domains/product-groups/product-group-page/product-group-page')
    .then(m => m.ProductGroupPage),
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./domains/customer/customer-page/customer-page')
        .then(m => m.CustomerPage),
    canActivate: [authGuard]
  }

  /*
  ,
  {
    path: 'home',
    loadComponent: () => import('./domains/home/home-page').then(m => m.HomePage)
  },
  {
    path: 'expenses',
    loadComponent: () => import('./domains/expenses/expenses-page').then(m => m.ExpensesPage)
  },
  {
    path: 'suppliers',
    loadComponent: () => import('./domains/suppliers/suppliers-page').then(m => m.SuppliersPage)
  },
  {
    path: 'products',
    loadComponent: () => import('./domains/products/products-page').then(m => m.ProductsPage)
  },
  {
    path: 'customers',
    loadComponent: () => import('./domains/customers/customers-page').then(m => m.CustomersPage)
  },
  {
    path: 'employees',
    loadComponent: () => import('./domains/employees/employees-page').then(m => m.EmployeesPage)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
    */
];
