import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, 
  trash, 
  create, 
  arrowBack, 
  chevronForward, 
  download, 
  cloudDownload, 
  locationOutline,
  filmOutline,
  closeCircle
} from 'ionicons/icons';

import { routes } from './app.routes';
import { DatabaseService } from './services/database.service';

// Database initialization function
export function initializeDatabase(databaseService: DatabaseService) {
  return () => databaseService.initializeDatabase();
}

// Register icons
addIcons({
  'add': add,
  'trash': trash,
  'create': create,
  'arrow-back': arrowBack,
  'chevron-forward': chevronForward,
  'download': download,
  'cloud-download': cloudDownload,
  'location-outline': locationOutline,
  'film-outline': filmOutline,
  'close-circle': closeCircle
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideIonicAngular({}),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDatabase,
      deps: [DatabaseService],
      multi: true
    }
  ]
};
