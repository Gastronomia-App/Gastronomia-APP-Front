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
    const isLoginEndpoint = req.url.includes('/employees/login');
    
    // Preserve the original HTTP method when cloning to prevent PATCH→PUT conversion
    const authReq = (token && !isLoginEndpoint)
      ? req.clone({ 
          setHeaders: { Authorization: `Bearer ${token}` },
          method: req.method
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/employees/login')) {
          if (this.auth.isRedirecting) {
             // Si el semáforo está en verde, ignoramos el error y no redirigimos
             return throwError(() => err);
          }
          this.auth.isRedirecting = true;
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}