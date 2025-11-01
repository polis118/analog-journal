# 📷 Analog Journal - MVP

Offline mobilní aplikace pro zaznamenávání analogových filmů a jednotlivých snímků.

## 🎯 Hlavní funkce

- ✅ CRUD operace pro filmy a snímky
- ✅ Offline SQLite databáze
- ✅ GPS lokace snímků
- ✅ CSV export per film
- ✅ Lokální notifikace
- ✅ Minimalistické UI
- ✅ Ionic + Angular + Capacitor

## 📁 Struktura projektu

```
src/app/
├── models/           # TypeScript modely (Film, Frame)
│   ├── film.model.ts
│   └── frame.model.ts
├── services/         # Business logika a databáze
│   ├── database.service.ts
│   ├── film.service.ts
│   ├── frame.service.ts
│   ├── csv-export.service.ts
│   └── notification.service.ts
└── pages/            # Komponenty stránek
    ├── home/         # Seznam filmů
    ├── film-detail/  # Detail filmu + seznam snímků
    └── frame-detail/ # Detail snímku + GPS
```

## 🗄️ Databázové entity

### Film
- `id`: string (primary key)
- `name`: string
- `type`: string (color/bw/slide)
- `brand`: string (Kodak, Fuji, Ilford...)
- `iso`: number
- `camera`: string
- `lens`: string
- `date_started`: string (ISO 8601)
- `date_finished`: string (ISO 8601)
- `notes`: string

### Frame
- `id`: string (primary key)
- `film_id`: string (foreign key → Film)
- `frame_number`: number
- `date_taken`: string (ISO 8601)
- `latitude`: number | null
- `longitude`: number | null
- `scene_tag`: string (portrait, landscape, street...)
- `exposure`: string (např. "1/125 f/8")
- `notes`: string

## 🚀 Instalace a spuštění

### Prerekvizity
- Node.js 18+
- npm
- (Pro build) Xcode (iOS) nebo Android Studio (Android)

### Development server
```bash
npm install
npm start
```

Aplikace bude dostupná na `http://localhost:4200`

### Build pro produkci
```bash
npm run build
```

### Přidání mobilních platforem

#### iOS
```bash
npx cap add ios
npx cap sync
npx cap open ios
```

#### Android
```bash
npx cap add android
npx cap sync
npx cap open android
```

## 📱 Použití aplikace

### 1. Přidání filmu
- Na hlavní stránce klikněte na tlačítko "+" v pravém horním rohu
- Vyplňte základní informace o filmu (název, typ, značka, ISO, fotoaparát, objektiv)
- Film se automaticky uloží do lokální databáze

### 2. Prohlížení a editace filmu
- Klikněte na film v seznamu
- Zobrazí se detail filmu a seznam všech snímků
- Přes menu (⋮) můžete film editovat, exportovat nebo smazat

### 3. Přidání snímku
- V detailu filmu klikněte na "Přidat snímek"
- Vyplňte metadata (číslo snímku, štítek scény, expozice, poznámky)
- Snímek se automaticky přiřadí k aktuálnímu filmu

### 4. GPS lokace
- V detailu snímku klikněte na "Získat aktuální polohu"
- Aplikace požádá o GPS oprávnění a zaznamená souřadnice
- GPS lokaci můžete zobrazit na mapě nebo smazat

### 5. CSV Export
- V detailu filmu otevřete menu a vyberte "Exportovat CSV"
- CSV soubor obsahuje metadata filmu + všechny snímky
- Soubor můžete sdílet přes systémový dialog

### 6. Lokální notifikace
- Použijte `NotificationService` pro plánování připomínek
- Např. připomínka na dokončení filmu po X dnech

## 🔧 Technologie

- **Framework**: Angular 19
- **UI**: Ionic 8
- **Mobile Runtime**: Capacitor 6
- **Database**: SQLite (@capacitor-community/sqlite)
- **Lokální notifikace**: @capacitor/local-notifications
- **GPS**: @capacitor/geolocation
- **File system**: @capacitor/filesystem
- **Sharing**: @capacitor/share

## 📄 Licence

MIT

## 👨‍💻 Development notes

### SQLite v prohlížeči
Pro testování v prohlížeči bude potřeba přidat web fallback pro SQLite (např. @capacitor-community/sqlite s indexedDB).

### Produkční build
Před buildem pro produkci zkontrolujte:
- Capacitor konfigurace v `capacitor.config.ts`
- App ikony a splash screens
- Oprávnění v `AndroidManifest.xml` (Android) a `Info.plist` (iOS)

### Potřebná oprávnění

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### iOS (`ios/App/App/Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikace potřebuje přístup k vaší poloze pro zaznamenání GPS souřadnic snímků.</string>
<key>NSUserNotificationsUsageDescription</key>
<string>Aplikace potřebuje oprávnění pro zasílání připomínek o filmech.</string>
```

## 🐛 Známé problémy

1. **SQLite v browseru**: V současné době SQLite nefunguje přímo v prohlížeči. Pro webový vývoj použijte fallback nebo testujte přímo na zařízení/emulátoru.

2. **GPS v prohlížeči**: Geolocation API v prohlížeči vyžaduje HTTPS nebo localhost.

## 🚧 Budoucí vylepšení (mimo MVP)

- [ ] Import fotek snímků
- [ ] Export do jiných formátů (JSON, Excel)
- [ ] Záloha do cloudu (volitelně)
- [ ] Statistiky (počet filmů, snímků, nejpoužívanější filmy)
- [ ] Tmavý režim
- [ ] Filtrování a vyhledávání
- [ ] Tagy pro filmy
- [ ] Podpora více jazyků

---

Vytvořeno s ❤️ pro analogové fotografy
