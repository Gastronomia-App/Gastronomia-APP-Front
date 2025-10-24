import { Routes } from '@angular/router';
import { LoginPageComponent } from './domains/auth/login/login';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '**', redirectTo: '' }
];