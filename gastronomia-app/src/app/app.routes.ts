import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth';
import { EmployeesPage } from './domains/employees';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/employees', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'employees', component: EmployeesPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];