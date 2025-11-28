import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorTranslatorService } from '../errors/error-translator.service';
import { AlertStoreService } from '../errors/alert-store.service';

@Injectable()
export class GlobalHttpErrorInterceptor implements HttpInterceptor {

  private readonly translator = inject(ErrorTranslatorService);
  private readonly alertStore = inject(AlertStoreService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Optional: allow skipping global alert with a custom header
    const skipGlobal = req.headers.get('X-Skip-Global-Error') === 'true';

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // If explicitly skipped, just propagate error
        if (skipGlobal) {
          return throwError(() => error);
        }

        // Do not show global alert for 401; AuthInterceptor ya se encarga
        if (error.status === 401 && !req.url.includes('/employees/login')) {
          return throwError(() => error);
        }

        const uiError = this.translator.translate(error);
        this.alertStore.show(uiError.title, uiError.message, uiError.severity);

        return throwError(() => error);
      })
    );
  }
}