# Quick Start Guide - FilamentButler mit Spoolman

Diese Anleitung hilft dir, FilamentButler schnell mit deiner bestehenden Spoolman-Installation zu verbinden.

## ⚡ Schnellstart (5 Minuten)

### Schritt 1: Repository klonen

```bash
git clone https://github.com/yourusername/FilamentButler.git
cd FilamentButler/frontend
```

### Schritt 2: Spoolman-URL konfigurieren

Erstelle eine `.env` Datei im `frontend` Verzeichnis:

```bash
echo "VITE_SPOOLMAN_URL=https://spoolman.finn-harms.de" > .env
```

Oder kopiere die Beispieldatei und bearbeite sie:

```bash
cp .env.example .env
# Dann bearbeite .env mit deinem bevorzugten Editor
```

### Schritt 3: Abhängigkeiten installieren

```bash
npm install
```

### Schritt 4: Development Server starten

```bash
npm run dev
```

### Schritt 5: Im Browser öffnen

Öffne deinen Browser und navigiere zu:
```
http://localhost:5173
```

🎉 **Fertig!** FilamentButler sollte jetzt mit deiner Spoolman-Installation verbunden sein.

## ✅ Verbindung testen

1. **Info-Check:** Öffne in einem neuen Tab:
   ```
   https://spoolman.finn-harms.de/api/v1/info
   ```
   Du solltest JSON mit Versionsinformationen sehen.

2. **Frontend-Check:** In FilamentButler solltest du:
   - Deine vorhandenen Filamente sehen (falls welche in Spoolman vorhanden sind)
   - Neue Filamente und Spools erstellen können
   - Bestehende Daten bearbeiten können

## 🔧 Konfiguration anpassen

### Andere Spoolman-URL verwenden

Bearbeite die `.env` Datei:

```env
# Für lokale Spoolman-Instanz
VITE_SPOOLMAN_URL=http://localhost:8000

# Für Remote-Instanz
VITE_SPOOLMAN_URL=https://deine-spoolman-url.com

# Wichtig: Kein "/" am Ende!
```

Nach Änderungen den Dev-Server neu starten:

```bash
# Strg+C zum Stoppen
npm run dev
```

## 📱 Erste Schritte nach dem Start

### 1. Filament-Typen anlegen

Falls noch keine Filamente in Spoolman vorhanden sind:

1. Klicke auf "Filament Types" im Menü
2. Klicke auf "Add Filament Type"
3. Fülle die Felder aus:
   - **Name**: z.B. "PolyTerra PLA Black"
   - **Manufacturer**: z.B. "Polymaker"
   - **Material**: z.B. "PLA"
   - **Color**: Wähle eine Farbe
   - **Diameter**: 1.75mm oder 2.85mm
4. Optional: Temperaturen, Gewicht, Preis eintragen
5. Klicke "Save"

### 2. Spools hinzufügen

1. Klicke auf "Add Spool" oder "Add Spool (New)" im Menü
2. Wähle den Filament-Typ aus dem Dropdown
3. Fülle die Felder aus:
   - **Initial Weight**: Anfangsgewicht in Gramm (z.B. 1000)
   - **Remaining Weight**: Aktuelles Gewicht (z.B. 1000 für neue Rolle)
   - **Location**: Lagerort (z.B. "Shelf A")
   - **Spool Number**: Optionale Rollennummer
4. Klicke "Save"

### 3. Bibliothek ansehen

1. Klicke auf "Library" im Menü
2. Hier siehst du alle deine Spools:
   - Gruppiert nach Material
   - Mit Farbanzeige
   - Gewichtsanzeigen
   - Sortieroptionen

## 🚀 Production Build

Für den produktiven Einsatz:

### Static Build erstellen

```bash
cd frontend
npm run build
```

Die Build-Dateien befinden sich dann in `frontend/dist/` und können mit jedem Webserver bereitgestellt werden.

### Mit nginx bereitstellen

Beispiel nginx-Konfiguration:

```nginx
server {
    listen 80;
    server_name filamentbutler.example.com;

    root /var/www/filamentbutler/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Wichtig:** Die Spoolman-URL muss dann zur Build-Zeit gesetzt werden:

```bash
VITE_SPOOLMAN_URL=https://spoolman.finn-harms.de npm run build
```

### Mit Docker

```bash
cd frontend

# Image bauen
docker build -t filamentbutler .

# Container starten
docker run -p 5173:5173 \
  -e VITE_SPOOLMAN_URL=https://spoolman.finn-harms.de \
  filamentbutler
```

## 🔍 Problemlösung

### Problem: "Cannot connect to Spoolman"

**Lösung:**
1. Prüfe, ob die URL in `.env` korrekt ist
2. Teste die Spoolman-URL direkt im Browser
3. Prüfe, ob Spoolman läuft
4. Schaue in die Browser-Konsole (F12) für detaillierte Fehlermeldungen

### Problem: CORS-Fehler

**Symptom:** Browser-Konsole zeigt CORS-Fehler

**Lösung:**
Spoolman muss CORS erlauben. Prüfe die Spoolman-Konfiguration oder nutze einen Reverse-Proxy.

**Temporäre Lösung für Entwicklung:**
```bash
# Chrome mit deaktivierten CORS-Checks starten (nur für Tests!)
# Windows:
chrome.exe --user-data-dir="C:/tmp/chrome" --disable-web-security

# macOS:
open -na "Google Chrome" --args --user-data-dir="/tmp/chrome" --disable-web-security

# Linux:
google-chrome --user-data-dir="/tmp/chrome" --disable-web-security
```

### Problem: Keine Daten sichtbar

**Prüfe:**
1. Sind in Spoolman bereits Daten vorhanden?
2. Browser-Konsole auf Fehler prüfen (F12)
3. Network-Tab im Browser öffnen und API-Calls beobachten
4. Spoolman-API direkt testen:
   ```
   https://spoolman.finn-harms.de/api/v1/filament
   https://spoolman.finn-harms.de/api/v1/spool
   ```

### Problem: Farben werden nicht angezeigt

**Häufige Ursache:** Spoolman speichert Farben ohne `#` Präfix

**Lösung:** Der Adapter fügt das `#` automatisch hinzu. Falls Farben trotzdem nicht angezeigt werden:
1. Prüfe in Spoolman, ob `color_hex` gesetzt ist
2. Format sollte sein: `FF0000` (ohne `#`)
3. FilamentButler wandelt automatisch zu `#FF0000`

## 📚 Weitere Ressourcen

- **Vollständige Dokumentation:** [README.md](README.md)
- **Spoolman Integration Details:** [SPOOLMAN_INTEGRATION.md](SPOOLMAN_INTEGRATION.md)
- **Spoolman Projekt:** [https://github.com/Donovan-Ye/Spoolman](https://github.com/Donovan-Ye/Spoolman)

## 💡 Tipps

1. **Vendor Management:** FilamentButler erstellt automatisch Vendors (Hersteller) in Spoolman, wenn diese noch nicht existieren.

2. **Multi-Color Filamente:** Nutze die Dual-Color-Funktion für Filamente mit zwei Farben.

3. **Gewichtsverfolgung:** Aktualisiere `Remaining Weight` regelmäßig, um den Überblick zu behalten.

4. **Location Tracking:** Nutze konsistente Ortsnamen (z.B. "Shelf A", "Shelf B") für bessere Organisation.

5. **Archivierung:** Setze Spools auf "Empty" oder "Archived" statt sie zu löschen, um Historie zu behalten.

## 🆘 Support

Bei Problemen:

1. **Prüfe die Logs:** Browser-Konsole (F12)
2. **Teste Spoolman direkt:** API-Endpoints im Browser aufrufen
3. **GitHub Issues:** Erstelle ein Issue mit:
   - Fehlermeldung
   - Browser-Konsolen-Log
   - Spoolman-Version
   - FilamentButler-Version

Viel Erfolg! 🎉
