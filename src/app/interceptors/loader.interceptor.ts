// src/app/interceptors/loader.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../Services/loader.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private loaderService: LoaderService) {}

  /**
   * Intercepts every HTTP request.
   * - Calls `loaderService.show()` before the request is sent.
   * - Calls `loaderService.hide()` after the request completes, whether it succeeds or fails.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Show the loader before sending the request.
    // This will increment the counter in the service.
    this.loaderService.show();

    // 2. Pass the request to the next handler in the chain.
    // Use `finalize` to ensure the `hide` method is called regardless of success or error.
    return next.handle(request).pipe(
      // 3. Hide the loader after the request is finished (on success or error).
      // This will decrement the counter.
      finalize(() => {
        this.loaderService.hide();
      })
    );
  }
}
