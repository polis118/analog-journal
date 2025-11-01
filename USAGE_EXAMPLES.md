# 📚 Analog Journal - Příklady použití

Tento dokument obsahuje příklady použití jednotlivých služeb v aplikaci.

## 🗄️ Database Service

### Inicializace databáze
```typescript
import { DatabaseService } from './services/database.service';

constructor(private databaseService: DatabaseService) {}

async ngOnInit() {
  await this.databaseService.initializeDatabase();
}
```

## 🎬 Film Service

### Načtení všech filmů
```typescript
const films = await this.filmService.getAllFilms();
console.log(films);
```

### Vytvoření nového filmu
```typescript
const newFilm: Film = {
  id: this.filmService.generateId(),
  name: 'Kodak Portra 400',
  type: 'color negative',
  brand: 'Kodak',
  iso: 400,
  camera: 'Canon AE-1',
  lens: '50mm f/1.8',
  date_started: new Date().toISOString(),
  date_finished: '',
  notes: 'První film s touto kamerou'
};

await this.filmService.createFilm(newFilm);
```

### Aktualizace filmu
```typescript
const film = await this.filmService.getFilmById('film_123');
if (film) {
  film.name = 'Kodak Portra 400 - Updated';
  film.notes = 'Přidána poznámka';
  await this.filmService.updateFilm(film);
}
```

### Smazání filmu
```typescript
await this.filmService.deleteFilm('film_123');
```

## 📸 Frame Service

### Načtení snímků pro film
```typescript
const frames = await this.frameService.getFramesByFilmId('film_123');
console.log(`Film má ${frames.length} snímků`);
```

### Vytvoření nového snímku
```typescript
const nextNumber = await this.frameService.getNextFrameNumber('film_123');

const newFrame: Frame = {
  id: this.frameService.generateId(),
  film_id: 'film_123',
  frame_number: nextNumber,
  date_taken: new Date().toISOString(),
  latitude: 50.0755,
  longitude: 14.4378,
  scene_tag: 'landscape',
  exposure: '1/125 f/8',
  notes: 'Praha z Petřína'
};

await this.frameService.createFrame(newFrame);
```

### Aktualizace snímku
```typescript
const frame = await this.frameService.getFrameById('frame_456');
if (frame) {
  frame.notes = 'Aktualizovaná poznámka';
  frame.scene_tag = 'portrait';
  await this.frameService.updateFrame(frame);
}
```

### Smazání snímku
```typescript
await this.frameService.deleteFrame('frame_456');
```

## 📤 CSV Export Service

### Export filmu do CSV
```typescript
import { CsvExportService } from './services/csv-export.service';

constructor(
  private csvExportService: CsvExportService,
  private filmService: FilmService,
  private frameService: FrameService
) {}

async exportFilm(filmId: string) {
  const film = await this.filmService.getFilmById(filmId);
  const frames = await this.frameService.getFramesByFilmId(filmId);
  
  if (film) {
    try {
      await this.csvExportService.exportFilmToCSV(film, frames);
      console.log('Export úspěšný');
    } catch (error) {
      console.error('Chyba při exportu:', error);
    }
  }
}
```

## 🔔 Notification Service

### Žádost o oprávnění
```typescript
import { NotificationService } from './services/notification.service';

constructor(private notificationService: NotificationService) {}

async requestNotificationPermission() {
  const granted = await this.notificationService.requestPermission();
  if (granted) {
    console.log('Notifikace povoleny');
  } else {
    console.log('Notifikace odmítnuty');
  }
}
```

### Naplánování připomínky
```typescript
// Připomínka za 7 dní
const reminderDate = new Date();
reminderDate.setDate(reminderDate.getDate() + 7);

await this.notificationService.scheduleFilmReminder(
  'Kodak Portra 400',
  reminderDate,
  'Nezapomeň vyvolat film!'
);
```

### Okamžitá notifikace
```typescript
await this.notificationService.showInstantNotification(
  'Film dokončen!',
  'Máš 36 snímků připravených k vyvolání'
);
```

### Seznam naplánovaných notifikací
```typescript
const pending = await this.notificationService.getPendingNotifications();
console.log(`Počet čekajících notifikací: ${pending.length}`);
```

### Zrušení všech notifikací
```typescript
await this.notificationService.cancelAllNotifications();
```

## 🌍 Geolocation (GPS)

### Získání aktuální polohy
```typescript
import { Geolocation } from '@capacitor/geolocation';

async getCurrentPosition() {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    
    console.log('Latitude:', position.coords.latitude);
    console.log('Longitude:', position.coords.longitude);
    
    // Uložení do snímku
    if (this.frame) {
      this.frame.latitude = position.coords.latitude;
      this.frame.longitude = position.coords.longitude;
      await this.frameService.updateFrame(this.frame);
    }
  } catch (error) {
    console.error('GPS chyba:', error);
  }
}
```

## 🎨 Kompletní příklad: Vytvoření filmu se snímky

```typescript
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from './services/database.service';
import { FilmService } from './services/film.service';
import { FrameService } from './services/frame.service';
import { CsvExportService } from './services/csv-export.service';
import { Film } from './models/film.model';
import { Frame } from './models/frame.model';

@Component({
  selector: 'app-example',
  templateUrl: './example.page.html',
})
export class ExamplePage implements OnInit {
  
  constructor(
    private databaseService: DatabaseService,
    private filmService: FilmService,
    private frameService: FrameService,
    private csvExportService: CsvExportService
  ) {}

  async ngOnInit() {
    // 1. Inicializace databáze
    await this.databaseService.initializeDatabase();
    
    // 2. Vytvoření filmu
    const newFilm: Film = {
      id: this.filmService.generateId(),
      name: 'Ilford HP5 Plus',
      type: 'black & white',
      brand: 'Ilford',
      iso: 400,
      camera: 'Nikon FM2',
      lens: '50mm f/1.4',
      date_started: new Date().toISOString(),
      date_finished: '',
      notes: 'Street photography v Praze'
    };
    
    await this.filmService.createFilm(newFilm);
    console.log('Film vytvořen:', newFilm.id);
    
    // 3. Přidání několika snímků
    for (let i = 1; i <= 5; i++) {
      const frame: Frame = {
        id: this.frameService.generateId(),
        film_id: newFilm.id,
        frame_number: i,
        date_taken: new Date().toISOString(),
        latitude: null,
        longitude: null,
        scene_tag: i % 2 === 0 ? 'portrait' : 'landscape',
        exposure: `1/${125 * i} f/${4 + i}`,
        notes: `Snímek číslo ${i}`
      };
      
      await this.frameService.createFrame(frame);
    }
    
    console.log('Přidáno 5 snímků');
    
    // 4. Export do CSV
    const frames = await this.frameService.getFramesByFilmId(newFilm.id);
    await this.csvExportService.exportFilmToCSV(newFilm, frames);
    
    console.log('CSV export dokončen');
  }
}
```

## 📱 Ionic komponenty - Příklady

### Alert Dialog
```typescript
import { AlertController } from '@ionic/angular';

async showAlert() {
  const alert = await this.alertController.create({
    header: 'Pozor!',
    message: 'Opravdu chcete smazat tento film?',
    buttons: [
      {
        text: 'Zrušit',
        role: 'cancel'
      },
      {
        text: 'Smazat',
        role: 'destructive',
        handler: () => {
          this.deleteFilm();
        }
      }
    ]
  });

  await alert.present();
}
```

### Toast Notification
```typescript
import { ToastController } from '@ionic/angular';

async showToast(message: string) {
  const toast = await this.toastController.create({
    message: message,
    duration: 2000,
    position: 'bottom',
    color: 'success'
  });

  await toast.present();
}
```

### Loading Spinner
```typescript
import { LoadingController } from '@ionic/angular';

async showLoading() {
  const loading = await this.loadingController.create({
    message: 'Načítání...',
  });

  await loading.present();

  // Provést operaci
  await this.loadData();

  await loading.dismiss();
}
```

### Action Sheet
```typescript
import { ActionSheetController } from '@ionic/angular';

async showActionSheet() {
  const actionSheet = await this.actionSheetController.create({
    header: 'Akce filmu',
    buttons: [
      {
        text: 'Editovat',
        icon: 'create-outline',
        handler: () => this.editFilm()
      },
      {
        text: 'Exportovat',
        icon: 'download-outline',
        handler: () => this.exportFilm()
      },
      {
        text: 'Smazat',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.deleteFilm()
      },
      {
        text: 'Zrušit',
        icon: 'close',
        role: 'cancel'
      }
    ]
  });

  await actionSheet.present();
}
```

---

📘 Pro více informací navštivte:
- [Ionic Documentation](https://ionicframework.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Angular Documentation](https://angular.dev)
