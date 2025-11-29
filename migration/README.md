# FilamentButler → Spoolman Migration

Dieses Tool migriert deine Daten vom alten FilamentButler-Backend (PostgreSQL) zu Spoolman.

## Voraussetzungen

1. **Altes Backend muss laufen:**
   ```bash
   cd ..
   docker-compose --profile legacy up -d
   ```

2. **Spoolman muss erreichbar sein:**
   - Stelle sicher, dass deine Spoolman-Instanz läuft
   - Erstelle ein Backup deiner Spoolman-Datenbank (falls bereits Daten vorhanden)

3. **Node.js installiert:**
   ```bash
   node --version  # sollte v18 oder höher sein
   ```

## Installation

```bash
cd migration
npm install
```

## Verwendung

### Schritt 1: Dry Run (Test-Lauf)

Führe zuerst einen Test-Lauf durch, um zu sehen, was migriert werden würde:

```bash
npm run migrate:dry-run
```

Oder mit benutzerdefinierten URLs:

```bash
node migrate-to-spoolman.js \
  --legacy-url http://localhost:3000 \
  --spoolman-url https://spoolman.finn-harms.de \
  --dry-run
```

### Schritt 2: Echte Migration

Wenn der Dry Run erfolgreich war, führe die echte Migration durch:

```bash
npm run migrate
```

Oder mit benutzerdefinierten URLs:

```bash
node migrate-to-spoolman.js \
  --legacy-url http://localhost:3000 \
  --spoolman-url https://spoolman.finn-harms.de \
  --yes
```

## Optionen

| Option | Beschreibung |
|--------|--------------|
| `--legacy-url <url>` | URL des alten FilamentButler-Backends (Standard: http://localhost:3000) |
| `--spoolman-url <url>` | URL deiner Spoolman-Instanz (Standard: https://spoolman.finn-harms.de) |
| `--dry-run` | Testlauf ohne Änderungen |
| `--yes`, `-y` | Überspringe Bestätigungsfragen |
| `--help`, `-h` | Zeige Hilfe an |

## Was wird migriert?

### 1. Filament Types → Filaments

Das Skript migriert alle FilamentTypes zu Spoolman Filaments:

- ✅ Name
- ✅ Hersteller (wird als Vendor angelegt)
- ✅ Material
- ✅ Farbe (einfach und dual-color)
- ✅ Durchmesser
- ✅ Standardgewicht
- ✅ Standardpreis
- ✅ Drucktemperatur
- ✅ Betttemperatur
- ✅ Notizen

### 2. Spools → Spools

Das Skript migriert alle Spools:

- ✅ Verknüpfung zum Filament
- ✅ Anfangsgewicht
- ✅ Verbleibendes Gewicht
- ✅ Preis
- ✅ Standort
- ✅ Rollennummer (lot_nr)
- ✅ Kaufdatum (first_used)
- ✅ Notizen
- ✅ Leer/Archiviert Status

### 3. Vendors (automatisch)

Das Skript erstellt automatisch Vendors in Spoolman für alle Hersteller, die noch nicht existieren.

## Beispielausgabe

```
============================================================
FilamentButler → Spoolman Migration Tool
============================================================

ℹ Legacy Backend: http://localhost:3000
ℹ Spoolman URL:   https://spoolman.finn-harms.de
ℹ Mode:           DRY RUN (no changes will be made)

============================================================
Testing Connections
============================================================

ℹ Testing legacy backend connection...
✓ Legacy backend is reachable
ℹ Testing Spoolman connection...
✓ Spoolman is reachable (version 0.22.1)

============================================================
Migrating Filament Types
============================================================

ℹ Found 15 filament types to migrate

ℹ Migrating: Polymaker - PolyTerra PLA Black (PLA)
ℹ   → Vendor "Polymaker" already exists (ID: 1)
✓   → Created filament (Spoolman ID: 42)

...

============================================================
Migrating Spools
============================================================

ℹ Found 28 spools to migrate

ℹ Migrating spool: Polymaker PolyTerra PLA Black - 850g remaining
✓   → Created spool (Spoolman ID: 125)

...

============================================================
Migration Summary
============================================================

Vendors:
✓ Created: 3

Filament Types:
ℹ Total:   15
✓ Created: 15

Spools:
ℹ Total:   28
✓ Created: 28

✓ Migration completed successfully!
ℹ You can now use FilamentButler with your Spoolman instance
```

## Fehlerbehebung

### Fehler: "Cannot connect to legacy backend"

**Lösung:** Starte das alte Backend:
```bash
cd ..
docker-compose --profile legacy up -d
```

### Fehler: "Cannot connect to Spoolman"

**Lösung:**
1. Prüfe, ob die Spoolman-URL korrekt ist
2. Teste: `curl https://spoolman.finn-harms.de/api/v1/info`
3. Prüfe Firewall/Netzwerk-Einstellungen

### Fehler: "Filament already exists"

Falls ein Filament bereits existiert, wird der Fehler angezeigt, aber die Migration läuft weiter.

**Optionen:**
- Lösche doppelte Einträge manuell in Spoolman
- Passe das Skript an, um Duplikate zu überspringen

### Warnung: "No filament mapping found"

Dies passiert, wenn ein Spool auf ein Filament verweist, das nicht erfolgreich migriert wurde.

**Lösung:**
1. Prüfe die Fehler bei der Filament-Migration
2. Behebe die Ursache
3. Führe die Migration erneut aus

## Nach der Migration

### 1. Frontend-Konfiguration aktualisieren

```bash
cd ../frontend
echo "VITE_SPOOLMAN_URL=https://spoolman.finn-harms.de" > .env
```

### 2. Frontend starten

```bash
npm run dev
```

### 3. Daten überprüfen

Öffne FilamentButler und überprüfe:
- Sind alle Filamente vorhanden?
- Sind alle Spools korrekt?
- Stimmen die Gewichte?
- Sind die Farben korrekt?

### 4. Altes Backend stoppen (optional)

Wenn alles funktioniert:

```bash
cd ..
docker-compose down
```

### 5. Legacy-Services entfernen (optional)

Wenn du sicher bist, dass du das alte Backend nicht mehr brauchst:

1. Entferne die Profile-Markierungen in `docker-compose.yml`
2. Oder nutze nur noch `docker-compose.spoolman.yml`:
   ```bash
   docker-compose -f docker-compose.spoolman.yml up
   ```

## Rollback

Falls etwas schiefgeht:

1. **Spoolman-Backup wiederherstellen** (falls vorhanden)
2. **Oder:** Manuell in Spoolman löschen:
   - Gehe zu Spoolman Web UI
   - Lösche die migrierten Einträge

## Mehrfache Migration

⚠️ **Achtung:** Das Skript prüft NICHT auf Duplikate!

Wenn du die Migration mehrfach ausführst, werden die Daten mehrfach angelegt.

**Empfehlung:**
- Führe immer zuerst einen Dry Run durch
- Nutze ein frisches Spoolman-Backup für Tests
- Lösche migrierte Daten manuell, bevor du erneut migrierst

## Support

Bei Problemen:
1. Führe einen Dry Run durch und prüfe die Ausgabe
2. Prüfe die Logs beider Backends
3. Erstelle ein GitHub Issue mit:
   - Vollständiger Befehl
   - Fehlermeldung
   - Anzahl der zu migrierenden Einträge

## Weiterentwicklung

Das Skript kann erweitert werden für:
- [ ] Duplikats-Erkennung
- [ ] Batch-Verarbeitung
- [ ] Fortschritts-Speicherung (Resume-Funktion)
- [ ] Rollback-Funktion
- [ ] JSON-Export/Import
- [ ] Mapping-Datei für manuelle Zuordnungen

Pull Requests sind willkommen!
