import { HttpErrorResponse } from '@angular/common/http';

export type ErrorSeverity = 'error' | 'warning' | 'info';

/** Raw payload returned by backend */
export interface BackendErrorPayload {
  status?: number;
  message?: string;
  code?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/** Final UI error shown in alerts */
export interface UiError {
  title: string;
  message: string;
  severity: ErrorSeverity;
}

/** Config for each backend error code */
export interface ErrorMessageConfig {
  title: string;
  message: string;
  severity?: ErrorSeverity;
}

/** Any type accepted by the translator */
export type ErrorInput = HttpErrorResponse | BackendErrorPayload | unknown;