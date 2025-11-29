# Filament Butler

A modern web-based filament management system with **Spoolman integration**.

## Features

- 📊 Manage your 3D printing filament inventory
- 🎨 Support for single and dual-color filaments
- 📦 Track spools, weights, locations, and more
- 🔗 **Direct integration with Spoolman** - no separate database needed
- 🌐 Modern Vue.js frontend with responsive design

## Spoolman Integration

FilamentButler now integrates directly with your existing Spoolman installation, using it as the backend data source. This means:

- ✅ All data is stored in Spoolman
- ✅ Compatible with other Spoolman integrations (Klipper, OctoPrint, etc.)
- ✅ No need to run a separate FilamentButler backend
- ✅ Seamless data synchronization

## Quick Start

### Prerequisites

- A running [Spoolman](https://github.com/Donovan-Ye/Spoolman) instance
- Node.js 18+ (for frontend development)

### Configuration

1. Clone this repository:
```bash
git clone https://github.com/yourusername/FilamentButler.git
cd FilamentButler/frontend
```

2. Create a `.env` file in the `frontend` directory:
```bash
cp .env.example .env
```

3. Edit `.env` and set your Spoolman URL:
```env
VITE_SPOOLMAN_URL=https://your-spoolman-instance.com
```

4. Install dependencies and start the development server:
```bash
npm install
npm run dev
```

5. Open your browser at `http://localhost:5173`

## Configuration

The application is configured via environment variables in `frontend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SPOOLMAN_URL` | URL to your Spoolman instance (without trailing slash) | `https://spoolman.finn-harms.de` |

## Production Deployment

### Docker (Frontend Only)

```bash
cd frontend
docker build -t filamentbutler-frontend .
docker run -p 5173:5173 -e VITE_SPOOLMAN_URL=https://your-spoolman.com filamentbutler-frontend
```

### Static Build

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist` and can be served by any static web server.

## Development

### Project Structure

```
FilamentButler/
├── frontend/               # Vue.js frontend
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── views/         # Page views
│   │   ├── stores/        # Pinia stores
│   │   ├── services/      # API services
│   │   │   ├── spoolmanClient.js    # Spoolman API client
│   │   │   └── spoolmanAdapter.js   # Data transformation layer
│   │   └── router/        # Vue Router
│   └── .env              # Environment configuration
└── backend/              # Legacy backend (not needed for Spoolman)
```

### Data Mapping

FilamentButler uses an adapter layer to transform between Spoolman's data structure and its own:

**Filament (Spoolman) ↔ FilamentType (FilamentButler)**
- `vendor.name` → `manufacturer`
- `color_hex` → `colorHex`
- `multi_color_hexes` → `color2Hex` (for dual colors)
- `settings_extruder_temp` → `printTemperature`
- `settings_bed_temp` → `bedTemperature`

**Spool (Spoolman) ↔ Spool (FilamentButler)**
- `filament.id` → `filamentTypeId`
- `lot_nr` → `spoolNumber`
- `initial_weight` → `weight`
- `remaining_weight` → `remainingWeight`
- `archived` → `isEmpty`

## Troubleshooting

### CORS Errors

If you encounter CORS errors when connecting to Spoolman, make sure:
1. Your Spoolman instance allows CORS from your frontend URL
2. Your Spoolman instance is accessible from your browser
3. The URL in `.env` is correct (no trailing slash)

### Connection Issues

Check that:
1. Your Spoolman instance is running and accessible
2. The URL in `VITE_SPOOLMAN_URL` is correct
3. You have network connectivity to the Spoolman instance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your License Here]

