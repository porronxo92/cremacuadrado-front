import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Mirrors main.ts: LOCALE_ID is set to 'es' in app.config.ts, but locale data
// isn't bundled automatically — any pipe needing Spanish formatting
// (currency, dates, numbers) throws NG0701 (MISSING_LOCALE_DATA) during SSR
// without this, even though the exact same code works fine in the browser.
registerLocaleData(localeEs);

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, config, context);

export default bootstrap;
