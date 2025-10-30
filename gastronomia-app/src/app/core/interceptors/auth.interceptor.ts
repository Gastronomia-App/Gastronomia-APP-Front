import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;
    console.log('🔐 Interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('📤 Request URL:', req.url);
    
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('❌ HTTP Error:', err.status, err.message);
        if (err.status === 401) {
          if (!req.url.includes('/employees/login')) {
            console.log('🚪 Logout por 401');
            this.auth.logout();
            this.router.navigate(['/login']);
          }
        }
        if (err.status === 403) {
          console.error('🚫 403 Forbidden - Token inválido o sin permisos');
        }
        return throwError(() => err);
      })
    );
  }
}