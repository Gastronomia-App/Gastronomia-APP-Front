import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth/login/login';
import { CreateEmployeePageComponent } from './domains/employees';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'employees/new', component: CreateEmployeePageComponent },
  { path: '**', redirectTo: '' }
];