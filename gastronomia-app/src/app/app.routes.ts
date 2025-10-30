import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './domains/auth/login/login';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  // {
  //   path: 'home',
  //   loadComponent: () => import('./domains/home/home-page').then(m => m.HomePage)
  // },
  {
    path: 'expenses',
    loadComponent: () => import('./domains/expenses/expenses-page').then(m => m.ExpensesPage)
  },
  // {
  //   path: 'suppliers',
  //   loadComponent: () => import('./domains/suppliers/suppliers-page').then(m => m.SuppliersPage)
  // },
  // {
  //   path: 'products',
  //   loadComponent: () => import('./domains/products/products-page').then(m => m.ProductsPage)
  // },
  // {
  //   path: 'customers',
  //   loadComponent: () => import('./domains/customers/customers-page').then(m => m.CustomersPage)
  // },
  // {
  //   path: 'employees',
  //   loadComponent: () => import('./domains/employees/employees-page').then(m => m.EmployeesPage)
  // },
  {
    path: '**',
    redirectTo: ''
  }
];
