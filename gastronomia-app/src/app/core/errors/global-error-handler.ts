// core/errors/global-error-handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertStoreService } from './alert-store.service';
import { ErrorTranslatorService } from './error-translator.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private readonly translator = inject(ErrorTranslatorService);
  private readonly alertStore = inject(AlertStoreService);

  handleError(error: unknown): void {
    // Always log for debugging
    console.error('GLOBAL ERROR HANDLER:', error);

    // 1) Ignore known "noise" errors from the browser
    if (this.isResizeObserverError(error)) {
      console.warn('Ignored ResizeObserver error:', error);
      return;
    }

    // 2) For the rest, translate and show the global alert
    const uiError = this.translator.translate(error);
    this.alertStore.show(uiError.title, uiError.message, uiError.severity);
  }

  /**
   * Detect ResizeObserver loop errors that are usually harmless
   * and should not be shown to end users.
   */
  private isResizeObserverError(error: unknown): boolean {
    // Case 1: Error instance
    if (error instanceof Error) {
      const message = `${error.message ?? ''} ${String((error as any).cause?.message ?? '')}`.toLowerCase();
      return message.includes('resizeobserver loop completed');
    }

    // Case 2: ErrorEvent
    if (error instanceof ErrorEvent) {
      const message = `${error.message ?? ''} ${String((error as any).error?.message ?? '')}`.toLowerCase();
      return message.includes('resizeobserver loop completed');
    }

    return false;
  }
}