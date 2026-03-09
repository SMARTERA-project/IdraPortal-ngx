/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { importProvidersFrom } from '@angular/core';

// import { AppModule } from './app/app.module';
import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(AppModule)]
})
  .then(() => {
    const spinner = document.getElementById('nb-global-spinner');
    if (spinner) {
      spinner.style.display = 'none';
      // Optionally remove from DOM to prevent intercepting events
      spinner.parentElement?.removeChild(spinner);
    }
  })
  .catch(err => console.error(err));
