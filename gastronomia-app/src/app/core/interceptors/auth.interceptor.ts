import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const token = auth.token;
  console.log('🔐 Interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('📤 Request URL:', req.url);
  
  // No agregar token en peticiones de login
  const isLoginRequest = req.url.includes('/employees/login');
  
  const authReq = token && !isLoginRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      console.error('❌ HTTP Error:', err.status, err.message);
      if (err.status === 401) {
        if (!isLoginRequest) {
          console.log('🚪 Logout por 401');
          auth.logout();
          router.navigate(['/login']);
        }
      }
      if (err.status === 403) {
        console.error('🚫 403 Forbidden - Token inválido o sin permisos');
      }
      return throwError(() => err);
    })
  );
};