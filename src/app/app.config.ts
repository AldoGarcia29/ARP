import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { MessageService } from 'primeng/api';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // PrimeNG setup (theme + animations)
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura },
      ripple: true,
    }),

    // Toast service
    MessageService,
  ],
};