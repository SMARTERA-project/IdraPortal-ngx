import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/error.service';
import { AppError, SUPPRESS_GLOBAL_ERROR_HEADER } from '../services/error.model';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  // Lazy-resolve ErrorService via Injector to break the circular DI:
  //   HttpErrorInterceptor -> ErrorService -> TranslateService -> HttpClient (-> interceptors).
  // Eager constructor injection of ErrorService here caused TranslateService to
  // initialize with a half-built HttpClient chain, leaving the translation
  // loader silently emitting nothing on success.
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const suppress = req.headers.has(SUPPRESS_GLOBAL_ERROR_HEADER);
    // Strip the marker so it never reaches the server.
    const outgoing = suppress
      ? req.clone({ headers: req.headers.delete(SUPPRESS_GLOBAL_ERROR_HEADER) })
      : req;

    return next.handle(outgoing).pipe(
      catchError((err: HttpErrorResponse) => {
        const appError = normalize(err);
        if (!suppress) {
          this.injector.get(ErrorService).handle(appError);
        }
        return throwError(() => appError);
      }),
    );
  }
}

function normalize(err: HttpErrorResponse): AppError {
  if (err.status === 0) {
    return {
      code: 'NETWORK_OFFLINE',
      httpStatus: 0,
      i18nKey: 'ERR.NETWORK.OFFLINE',
      correlationId: readCorrelationId(err),
      raw: err,
    };
  }
  const body: any = err.error ?? {};
  const fallback = fallbackFromStatus(err.status);
  return {
    code: body.errorCode || fallback.code,
    httpStatus: err.status,
    // Backend (GlobalExceptionMapper) populates userMessageKey from the canonical
    // ErrorCode -> i18n key mapping. Fall back to a status-based key when the
    // body isn't an Idra ErrorResponse (e.g. Keycloak 401 passthrough).
    i18nKey: body.userMessageKey || fallback.key,
    correlationId: body.correlationId || readCorrelationId(err),
    raw: err,
  };
}

function readCorrelationId(err: HttpErrorResponse): string | undefined {
  return err.headers?.get?.('X-Correlation-Id') ?? undefined;
}

function fallbackFromStatus(status: number): { code: string; key: string } {
  if (status === 401) return { code: 'ERR_UNAUTHORIZED', key: 'ERR.AUTH.UNAUTHORIZED' };
  if (status === 403) return { code: 'ERR_FORBIDDEN', key: 'ERR.AUTH.FORBIDDEN' };
  if (status === 404) return { code: 'ERR_NOT_FOUND', key: 'ERR.GENERIC.NOT_FOUND' };
  if (status === 409) return { code: 'ERR_CONFLICT', key: 'ERR.GENERIC.CONFLICT' };
  if (status === 504) return { code: 'ERR_TIMEOUT', key: 'ERR.GENERIC.TIMEOUT' };
  if (status >= 500) return { code: 'ERR_INTERNAL', key: 'ERR.GENERIC.INTERNAL' };
  if (status >= 400) return { code: 'ERR_BAD_REQUEST', key: 'ERR.GENERIC.BAD_REQUEST' };
  return { code: 'ERR_INTERNAL', key: 'ERR.GENERIC.INTERNAL' };
}
