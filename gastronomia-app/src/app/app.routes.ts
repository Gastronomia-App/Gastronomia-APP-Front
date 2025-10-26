import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth/login/login';
import { CreateEmployeePageComponent } from './domains/employees';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'employees/new', component: CreateEmployeePageComponent },
  { path: 'employees', canActivate: [authGuard], loadComponent: () => import('./domains/employees/list-employees/list-employees').then(m => m.ListEmployeesComponent) },
  { path: '**', redirectTo: '' }
];