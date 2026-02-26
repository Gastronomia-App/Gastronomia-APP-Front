import { Routes } from '@angular/router';
import { LoginComponent } from './domains/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { HomePage } from './domains/homepage/homepage';
import { roleGuard } from './core/guards';
import { UserRole } from './shared/models/auth.model';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },{
  path: 'menu/:slug',
  loadComponent: () =>
    import('./domains/menu/menu-page.component')
      .then(m => m.MenuPageComponent)
},
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./domains/inventory/inventory-page/inventory-page')
        .then(m => m.InventoryPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])],
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./domains/products/product-page/product-page')
            .then(m => m.ProductPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./domains/categories/category-page/category-page')
            .then(m => m.CategoryPage),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./domains/product-groups/product-group-page/product-group-page')
            .then(m => m.ProductGroupPage),
      },
    ],
  },
  {
    path: 'products',
    redirectTo: '/inventory/products',
    pathMatch: 'full',
  },
  {
    path: 'categories',
    redirectTo: '/inventory/categories',
    pathMatch: 'full',
  },
  {
    path: 'groups',
    redirectTo: '/inventory/groups',
    pathMatch: 'full',
  },
  {
    path: 'cash-flow',
    loadComponent: () =>
      import('./domains/cash-flow/cash-flow-page/cash-flow-page')
        .then(m => m.CashFlowPage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])],
    children: [
      {
        path: '',
        redirectTo: 'expenses',
        pathMatch: 'full',
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./domains/expenses/expenses-page/expenses-page')
            .then(m => m.ExpensesPage),
      },
      {
        path: 'audits',
        loadComponent: () =>
          import('./domains/audits/audit-page/audit-page')
            .then(m => m.AuditsPage),
      },
    ],
  },
  {
    path: 'expenses',
    redirectTo: '/cash-flow/expenses',
    pathMatch: 'full',
  },
  {
    path: 'audits',
    redirectTo: '/cash-flow/audits',
    pathMatch: 'full',
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./domains/suppliers/suppliers-page/suppliers-page')
        .then(m => m.SuppliersPage),
    canActivate: [authGuard],
  },
  {
    path: 'orders-management',
    loadComponent: () =>
      import('./domains/orders/orders-root-page/orders-root-page')
        .then(m => m.OrdersRootPage),
    canActivate: [
      roleGuard([
        UserRole.CASHIER,
        UserRole.WAITER,
        UserRole.ADMIN,
        UserRole.OWNER,
      ]),
    ],
    children: [
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./domains/orders/orders-page/orders-page')
            .then(m => m.OrdersPage),
      },
      {
        path: 'payment-methods',
        loadComponent: () =>
          import('./domains/payment-methods/payment-methods-page/payment-methods-page')
            .then(m => m.PaymentMethodsPage),
        canActivate: [roleGuard([UserRole.ADMIN, UserRole.OWNER])],
      },
    ],
  },
  {
    path: 'seatings',
    loadComponent: () =>
      import('./domains/seating/seating-root-page/seating-root-page')
        .then(m => m.SeatingRootPage),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'status',
        pathMatch: 'full',
      },
      {
        path: 'view',
        loadComponent: () =>
          import('./domains/seating/seating-view-page/seating-view-page')
            .then(m => m.SeatingViewPage),
      },
      {
        path: 'status',
        loadComponent: () =>
          import('./domains/seating/seating-status-page/seating-status-page')
            .then(m => m.SeatingStatusPage),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./domains/seating/seating-config-page/seating-config-page')
            .then(m => m.SeatingConfigPage),
        canActivate: [roleGuard([UserRole.ADMIN, UserRole.OWNER])],
      },
    ],
  },
  {
    path: 'orders',
    redirectTo: '/orders-management/orders',
    pathMatch: 'full',
  },
  {
    path: 'payment-methods',
    redirectTo: '/orders-management/payment-methods',
    pathMatch: 'full',
  },
  {
    path: 'people',
    loadComponent: () =>
      import('./domains/people/people-page/people-page')
        .then(m => m.PeoplePage),
    canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])],
    children: [
      { path: '', redirectTo: 'customers', pathMatch: 'full' },
      {
        path: 'customers',
        loadComponent: () =>
          import('./domains/customer/customer-page/customer-page')
            .then(m => m.CustomerPage),
        canActivate: [roleGuard([UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER])],
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./domains/employees/employees-page/employees-page')
            .then(m => m.EmployeesPage),
        canActivate: [roleGuard([UserRole.ADMIN, UserRole.OWNER])],
      },
    ],
  },
  {
    path: 'businesses',
    loadComponent: () =>
      import('./domains/business/business-page/business-page')
        .then(m => m.BusinessPage),
    canActivate: [roleGuard([UserRole.OWNER])],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./domains/employees/employees-profile-page/employees-profile-page')
        .then(m => m.EmployeesProfilePage),
    canActivate: [
      roleGuard([
        UserRole.ADMIN,
        UserRole.CASHIER,
        UserRole.WAITER,
        UserRole.OWNER,
      ]),
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
