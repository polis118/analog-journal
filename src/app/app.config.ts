import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
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
import { FilmService } from './services/film.service';

// Database initialization function
export function initializeDatabase(databaseService: DatabaseService) {
  return () => databaseService.initializeDatabase();
}

// Check if first run and redirect to documentation
export function checkFirstRun(filmService: FilmService, router: Router) {
  return async () => {
    // Wait a bit for database to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    const films = await filmService.getAllFilms();
    if (films.length === 0) {
      router.navigate(['/documentation'], { queryParams: { firstRun: 'true' } });
    }
  };
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
    },
    {
      provide: APP_INITIALIZER,
      useFactory: checkFirstRun,
      deps: [FilmService, Router],
      multi: true
    }
  ]
};
