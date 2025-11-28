import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_MESSAGES } from './error-messages';
import {
  BackendErrorPayload,
  ErrorInput,
  UiError
} from './error.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorTranslatorService {

  translate(input: ErrorInput): UiError {
    // =========================
    // 1. HttpErrorResponse
    // =========================
    if (input instanceof HttpErrorResponse) {
      const payload = input.error as BackendErrorPayload;

      if (payload?.code && ERROR_MESSAGES[payload.code]) {
        const cfg = ERROR_MESSAGES[payload.code];

        return {
          title: cfg.title,
          message: cfg.message,
          severity: cfg.severity ?? 'error'
        };
      }

      return this.translateByStatus(input.status, payload?.message);
    }

    // =========================
    // 2. Plain backend object
    // =========================
    if (typeof input === 'object' && input !== null) {
      const payload = input as BackendErrorPayload;

      if (payload.code && ERROR_MESSAGES[payload.code]) {
        const cfg = ERROR_MESSAGES[payload.code];

        return {
          title: cfg.title,
          message: cfg.message,
          severity: cfg.severity ?? 'error'
        };
      }

      return {
        title: 'Error inesperado',
        message: payload.message ?? 'Ocurrió un error inesperado.',
        severity: 'error'
      };
    }

    // =========================
    // 3. Fallback total
    // =========================
    return {
      title: 'Error inesperado',
      message: 'Ocurrió un error inesperado.',
      severity: 'error'
    };
  }

  private translateByStatus(status?: number, backendMessage?: string): UiError {
    switch (status) {
      case 400:
        return {
          title: 'Solicitud inválida',
          message: backendMessage ?? 'Los datos enviados no son válidos.',
          severity: 'warning'
        };

      case 401:
        return {
          title: 'No autenticado',
          message: 'Tenés que iniciar sesión para continuar.',
          severity: 'error'
        };

      case 403:
        return {
          title: 'Acceso denegado',
          message: 'No tenés permisos para realizar esta acción.',
          severity: 'error'
        };

      case 404:
        return {
          title: 'Recurso no encontrado',
          message: backendMessage ?? 'El recurso solicitado no existe.',
          severity: 'error'
        };

      case 409:
        return {
          title: 'Conflicto',
          message: backendMessage ?? 'Ya existe un elemento con esos datos.',
          severity: 'warning'
        };

      case 500:
        return {
          title: 'Error del servidor',
          message: 'Ocurrió un error interno en el servidor.',
          severity: 'error'
        };

      default:
        return {
          title: 'Error inesperado',
          message: backendMessage ?? 'Ocurrió un error inesperado.',
          severity: 'error'
        };
    }
  }
}
