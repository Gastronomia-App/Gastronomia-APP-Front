import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login/login-page-component/login-page-component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '**', redirectTo: '' }
];