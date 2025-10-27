import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
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
];
