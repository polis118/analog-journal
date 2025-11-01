# Google Maps API Setup

Pro plnou funkcionalitu map potřebujete Google Maps API klíč.

## Jak získat Google Maps API klíč:

1. **Přejděte na Google Cloud Console:**
   https://console.cloud.google.com/

2. **Vytvořte nový projekt** (nebo vyberte existující)

3. **Aktivujte potřebná API:**
   - Maps JavaScript API
   - Geocoding API

4. **Vytvořte API klíč:**
   - APIs & Services → Credentials
   - Create Credentials → API Key

5. **Omezení API klíče (doporučeno):**
   - Application restrictions: HTTP referrers
   - Přidejte: `http://localhost:4200/*`, `https://yourdomain.com/*`
   - API restrictions: Omezit na Maps JavaScript API a Geocoding API

## Kde vložit API klíč:

V souboru `src/app/pages/film-detail/film-detail.page.ts` nahraďte:

```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
```

a

```typescript
const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedLat},${selectedLon}&key=YOUR_GOOGLE_MAPS_API_KEY`);
```

Vaším API klíčem.

## Alternativa - Použít OpenStreetMap (zdarma):

Pokud nechcete používat Google Maps, aplikace má vestavěný fallback na OpenStreetMap Nominatim API, který funguje bez registrace.

## Ceny Google Maps API:

- **Prvních 28 000 map loads měsíčně zdarma** ($200 kredit)
- Maps JavaScript API: $7 za 1000 loads
- Geocoding API: $5 za 1000 požadavků

Pro osobní použití by mělo stačit free tier.
