# 🌐 SQLite Web Platform Support

## Řešení problému: "jeep-sqlite element is not present"

Aplikace nyní podporuje SQLite i ve webovém prohlížeči díky **jeep-sqlite** web componentu.

### Co bylo implementováno:

#### 1. **main.ts** - Inicializace jeep-sqlite
```typescript
// Automaticky vytvoří <jeep-sqlite> element při spuštění na webu
async function initializeApp() {
  if (platform === 'web') {
    jeepSqlite(window);
    const jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
    await customElements.whenDefined('jeep-sqlite');
  }
  bootstrapApplication(AppComponent, appConfig);
}
```

#### 2. **database.service.ts** - Web store podpora
```typescript
private async initWebStore(): Promise<void> {
  await customElements.whenDefined('jeep-sqlite');
  await this.sqlite.initWebStore();
}

async executeRun(statement: string, values?: any[]): Promise<any> {
  const result = await this.db.run(statement, values);
  
  // Uložení do IndexedDB pro web
  if (this.platform === 'web') {
    await this.sqlite.saveToStore(this.DB_NAME);
  }
  
  return result;
}
```

### Jak to funguje:

#### 🌐 **Web Platform (Chrome, Firefox, Safari)**
- SQLite běží v browseru přes **IndexedDB**
- Data jsou uložena lokálně v prohlížeči
- Automatické persist po každé write operaci
- **Výhoda**: Můžete vyvíjet bez emulátoru/zařízení
- **Nevýhoda**: Pomalejší než nativní SQLite

#### 📱 **Native Platform (iOS, Android)**
- Používá nativní SQLite databázi
- Maximální výkon
- Persistentní storage
- Žádná závislost na jeep-sqlite

### Testování:

#### V prohlížeči:
```bash
npm start
# Otevřete http://localhost:4200
# SQLite funguje přes IndexedDB
```

#### Na zařízení:
```bash
npm run build
npx cap sync
npx cap open ios   # nebo android
# Používá nativní SQLite
```

### Data Location:

- **Web**: Browser IndexedDB (`Application -> IndexedDB` v DevTools)
- **iOS**: `~/Library/Application Support/analogjournal.db`
- **Android**: `/data/data/com.analogjournal.app/databases/`

### Debugging:

Otevřete **Console** v prohlížeči a měli byste vidět:
```
✅ jeep-sqlite initialized for web platform
Platform: web
Initializing database on platform: web
Web store initialized
Database initialized successfully
```

### Známé limitace webu:

1. **Výkon**: Pomalejší než nativní SQLite
2. **Velikost**: Limitováno browser storage (~50-100MB)
3. **Sdílení**: Data jsou per-browser (Chrome != Firefox)
4. **Export**: CSV funguje přes Web Share API

### Přechod web → native:

Data z prohlížeče se **nepřenesou** automaticky na mobilní zařízení. Pro migraci použijte:
1. Export CSV z webu
2. Import na mobilním zařízení (budoucí feature)

---

**Status**: ✅ SQLite nyní funguje jak na webu, tak na mobilních zařízeních!
