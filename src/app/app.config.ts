// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';

import { routes } from './app.routes';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { notificationInterceptor } from './interceptors/notification.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, FormsModule, ReactiveFormsModule, AsyncPipe),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loaderInterceptor,
        notificationInterceptor,
        authInterceptor
      ])
    )
  ]
};
