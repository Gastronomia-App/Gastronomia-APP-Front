import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalHttpErrorInterceptor } from './core/interceptors/global-http-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';

// Register locale data for Spanish (Argentina)
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: GlobalHttpErrorInterceptor, multi: true },
    // Global Angular error handler
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Set default locale to Spanish (Argentina)
    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};
