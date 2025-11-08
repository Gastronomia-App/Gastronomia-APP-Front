import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards';
import { UserRole } from './shared/models/auth.model';

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
    path: 'inventory',
    loadComponent: () => import('./domains/inventory/inventory-page/inventory-page')
      .then(m => m.InventoryPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])],
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'products',
        loadComponent: () => import('./domains/products/product-page/product-page')
          .then(m => m.ProductPage)
      },
      {
        path: 'categories',
        loadComponent: () => import('./domains/categories/category-page/category-page')
          .then(m => m.CategoryPage)
      },
      {
        path: 'groups',
        loadComponent: () => import('./domains/product-groups/product-group-page/product-group-page')
          .then(m => m.ProductGroupPage)
      }
    ]
  },
  {
    path: 'products',
    redirectTo: '/inventory/products',
    pathMatch: 'full'
  },
  {
    path: 'categories',
    redirectTo: '/inventory/categories',
    pathMatch: 'full'
  },
  {
    path: 'groups',
    redirectTo: '/inventory/groups',
    pathMatch: 'full'
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./domains/customer/customer-page/customer-page')
        .then(m => m.CustomerPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])]
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./domains/expenses/expenses-page/expenses-page')
        .then(m => m.ExpensesPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])]
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./domains/suppliers/suppliers-page/suppliers-page')
        .then(m => m.SuppliersPage),
    canActivate: [authGuard]
  },
  {
    path: 'audits',
    loadComponent: () =>
      import('./domains/audits/audit-page/audit-page')
        .then(m => m.AuditsPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])]
  },
  {
    path: 'tables',
    loadComponent: () =>
      import('./domains/table/table-page/table-page')
        .then(m => m.TablePage),
    canActivate: [roleGuard([UserRole.WAITER, UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])]
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./domains/employees/employees-page/employees-page')
        .then(m => m.EmployeesPage),
    canActivate: [roleGuard([UserRole.ADMIN, UserRole.OWNER])]
  },
  {
    path: 'businesses',
    loadComponent: () =>
      import('./domains/business/business-page/business-page')
        .then(m => m.BusinessPage),
    canActivate: [roleGuard([UserRole.OWNER])]
  },
  {
    path: '**',
    redirectTo: '/tables'
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
