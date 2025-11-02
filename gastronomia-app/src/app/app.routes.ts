import { Routes } from '@angular/router';
import { LoginPageComponent, RegisterComponent } from './domains/auth';
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
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./domains/customer/customer-page/customer-page')
        .then(m => m.CustomerPage),
    canActivate: [authGuard]
  },
  {
    path: 'businesses',
    loadComponent: () =>
      import('./domains/business/business-page/business-page')
        .then(m => m.BusinessPage)
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
