import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth';
import { CreateEmployeePageComponent } from './domains/employees';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/employees', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'employees/new', component: CreateEmployeePageComponent, canActivate: [authGuard] },
  { path: 'employees', canActivate: [authGuard], loadComponent: () => import('./domains/employees/list-employees/list-employees').then(m => m.ListEmployeesComponent) },
  { path: '**', redirectTo: '/login' }
];