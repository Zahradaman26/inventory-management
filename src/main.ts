import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import Iconify from '@iconify/iconify';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
