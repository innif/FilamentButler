# Spoolman Integration Guide

This document describes how FilamentButler integrates with Spoolman and provides detailed information for developers and users.

## Overview

FilamentButler has been redesigned to use Spoolman as its backend data source. Instead of maintaining its own database, FilamentButler now acts as a specialized frontend for Spoolman, providing an alternative UI focused on filament library management.

## Architecture

```
┌─────────────────────────────────────┐
│   FilamentButler Frontend (Vue.js)  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Pinia Stores                 │ │
│  │  - spoolStore.js               │ │
│  │  - filamentTypeStore.js        │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │   Spoolman Adapter             │ │
│  │  - spoolmanAdapter.js          │ │
│  │  - Data Transformation         │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │   Spoolman Client              │ │
│  │  - spoolmanClient.js           │ │
│  │  - HTTP API Calls              │ │
│  └──────────┬─────────────────────┘ │
└─────────────┼───────────────────────┘
              │
              │ HTTPS
              ▼
┌─────────────────────────────────────┐
│     Spoolman API (v1)                │
│  https://spoolman.finn-harms.de      │
│                                      │
│  - /api/v1/filament                  │
│  - /api/v1/spool                     │
│  - /api/v1/vendor                    │
└─────────────────────────────────────┘
```

## Components

### 1. Spoolman Client (`spoolmanClient.js`)

The Spoolman Client is a low-level API wrapper that handles direct communication with the Spoolman REST API.

**Responsibilities:**
- HTTP request handling
- API endpoint management
- Error handling and retries
- Authentication (if needed in future)

**Key Methods:**
```javascript
// Filaments
getFilaments(filters)
getFilament(id)
createFilament(data)
updateFilament(id, data)
deleteFilament(id)

// Spools
getSpools(filters)
getSpool(id)
createSpool(data)
updateSpool(id, data)
deleteSpool(id)
useSpool(id, weight)

// Vendors
getVendors(filters)
createVendor(data)
updateVendor(id, data)
```

### 2. Spoolman Adapter (`spoolmanAdapter.js`)

The Adapter Layer transforms data between Spoolman's format and FilamentButler's expected format.

**Responsibilities:**
- Data structure transformation
- Field mapping
- Default value handling
- Vendor management

**Key Functions:**

#### Filament Transformations
```javascript
// Spoolman → FilamentButler
transformFilamentToFilamentType(spoolmanFilament)

// FilamentButler → Spoolman
transformFilamentTypeToFilament(filamentType)
```

**Field Mapping:**
| Spoolman | FilamentButler |
|----------|----------------|
| `id` | `id` |
| `vendor.name` | `manufacturer` |
| `name` | `name` |
| `material` | `material` |
| `color_hex` | `colorHex` |
| `multi_color_hexes` | `colorHex2` (second color) |
| `diameter` | `diameter` |
| `weight` | `standardWeight` |
| `price` | `standardPrice` |
| `settings_extruder_temp` | `printTemperature` |
| `settings_bed_temp` | `bedTemperature` |
| `comment` | `notes` |
| `registered` | `createdAt` |

#### Spool Transformations
```javascript
// Spoolman → FilamentButler
transformSpoolToSpool(spoolmanSpool)

// FilamentButler → Spoolman
transformSpoolToSpoolman(spool)
```

**Field Mapping:**
| Spoolman | FilamentButler |
|----------|----------------|
| `id` | `id` |
| `filament.id` | `filamentTypeId` |
| `lot_nr` | `spoolNumber` |
| `initial_weight` | `weight` |
| `remaining_weight` | `remainingWeight` |
| `price` | `price` |
| `first_used` | `purchaseDate` |
| `location` | `location` |
| `comment` | `notes` |
| `archived` | `isEmpty` |
| `registered` | `createdAt` |

#### Special Handling

**Multi-Color Filaments:**
Spoolman uses `multi_color_hexes` as a comma-separated string:
```javascript
// Spoolman: "FF0000,00FF00"
// FilamentButler:
{
  colorHex: "#FF0000",
  colorHex2: "#00FF00"
}
```

**Vendor Management:**
FilamentButler's `manufacturer` field maps to Spoolman's `vendor` entity:
```javascript
async getOrCreateVendor(vendorName, spoolmanClient)
```
This function:
1. Searches for existing vendor by name
2. Creates new vendor if not found
3. Returns vendor ID for use in filament creation

### 3. Updated Stores

#### Spool Store (`spoolStore.js`)

**Before (Old Backend):**
```javascript
const response = await axios.get('/api/spools')
this.spools = response.data
```

**After (Spoolman):**
```javascript
const spoolmanSpools = await spoolmanClient.getSpools(params)
this.spools = transformSpools(spoolmanSpools)
```

#### Filament Type Store (`filamentTypeStore.js`)

**Before (Old Backend):**
```javascript
const response = await axios.post('/api/filament-types', typeData)
```

**After (Spoolman):**
```javascript
const vendorId = await getOrCreateVendor(typeData.manufacturer, spoolmanClient)
const spoolmanData = transformFilamentTypeToFilament({
  ...typeData,
  _vendorId: vendorId
})
const createdFilament = await spoolmanClient.createFilament(spoolmanData)
```

## Configuration

### Environment Variables

The application uses Vite's environment variable system:

**`.env` file:**
```env
VITE_SPOOLMAN_URL=https://spoolman.finn-harms.de
```

**Access in code:**
```javascript
const SPOOLMAN_BASE_URL = import.meta.env.VITE_SPOOLMAN_URL
```

### Vite Configuration

Added path alias for cleaner imports:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

## Data Flow Examples

### Fetching All Spools

1. **User Action:** Opens Library view
2. **Component:** Calls `spoolStore.fetchSpools()`
3. **Store:** Calls `spoolmanClient.getSpools()`
4. **Client:** HTTP GET to `https://spoolman.finn-harms.de/api/v1/spool`
5. **Adapter:** Transforms array with `transformSpools()`
6. **Store:** Updates `spools` state
7. **Component:** Vue reactivity updates UI

### Creating a New Spool

1. **User Action:** Submits "Add Spool" form
2. **Component:** Calls `spoolStore.createSpool(spoolData)`
3. **Adapter:** Transforms with `transformSpoolToSpoolman()`
4. **Client:** HTTP POST to `https://spoolman.finn-harms.de/api/v1/spool`
5. **Adapter:** Transforms response with `transformSpoolToSpool()`
6. **Store:** Adds to `spools` array
7. **Component:** Shows success message

### Creating a Filament Type with New Vendor

1. **User Action:** Submits "Add Filament Type" form with manufacturer "Polymaker"
2. **Store:** Calls `getOrCreateVendor("Polymaker", spoolmanClient)`
3. **Adapter:** Searches existing vendors
4. **Client:** HTTP GET to `https://spoolman.finn-harms.de/api/v1/vendor?name=Polymaker`
5. **Adapter:** Vendor not found, creates new vendor
6. **Client:** HTTP POST to `https://spoolman.finn-harms.de/api/v1/vendor`
7. **Adapter:** Returns vendor ID
8. **Store:** Adds vendor ID to filament data
9. **Adapter:** Transforms with `transformFilamentTypeToFilament()`
10. **Client:** HTTP POST to `https://spoolman.finn-harms.de/api/v1/filament`
11. **Adapter:** Transforms response
12. **Store:** Adds to `filamentTypes` array

## API Compatibility

### Supported Operations

✅ **Fully Supported:**
- List all filaments/spools
- Get single filament/spool
- Create filament/spool
- Update filament/spool
- Delete filament/spool
- Filter by material, vendor, location
- Multi-color filament support

⚠️ **Partial Support:**
- Statistics (calculated client-side)
- Grouping (done in getters)

❌ **Not Yet Supported:**
- Websocket updates (planned)
- Advanced filtering
- Batch operations

## Migration Guide

If you have existing FilamentButler data in the old PostgreSQL backend:

### Option 1: Manual Migration
1. Export data from old backend
2. Use Spoolman's web UI to import
3. Adjust colors and settings as needed

### Option 2: Migration Script (Coming Soon)
A migration script will be provided to automate the process.

## Development

### Adding New Features

When adding features that interact with Spoolman:

1. **Add method to spoolmanClient.js:**
```javascript
async getFilamentStatistics() {
  const response = await this.client.get('/filament/statistics')
  return response.data
}
```

2. **Add transformation in spoolmanAdapter.js (if needed):**
```javascript
export function transformStatistics(spoolmanStats) {
  // Transform data structure
}
```

3. **Use in store:**
```javascript
async fetchStatistics() {
  const stats = await spoolmanClient.getFilamentStatistics()
  this.statistics = transformStatistics(stats)
}
```

### Testing

Test against your Spoolman instance:

```bash
# Set test Spoolman URL
echo "VITE_SPOOLMAN_URL=http://localhost:8000" > frontend/.env.test

# Run development server
cd frontend
npm run dev
```

## Troubleshooting

### CORS Issues

**Problem:** Browser shows CORS errors

**Solution:**
Spoolman needs to allow CORS from your frontend URL. Check Spoolman's CORS configuration or use a reverse proxy.

### Authentication

**Problem:** Spoolman requires authentication

**Solution:**
Currently not implemented. Future versions will support authentication tokens.

### Data Not Showing

**Problem:** Filaments/spools not displayed

**Debug Steps:**
1. Check browser console for errors
2. Verify `VITE_SPOOLMAN_URL` is correct
3. Test Spoolman API directly: `https://your-spoolman.com/api/v1/info`
4. Check network tab in browser DevTools

### Color Not Displaying Correctly

**Problem:** Colors show as black or incorrect

**Check:**
1. Spoolman stores colors without `#` prefix
2. Adapter adds `#` automatically
3. Verify `color_hex` field in Spoolman data

## Future Enhancements

- [ ] Websocket support for real-time updates
- [ ] Offline mode with local caching
- [ ] Bulk import/export
- [ ] Advanced statistics and analytics
- [ ] Print history integration
- [ ] QR code generation for spools
- [ ] Mobile app

## API Reference

See Spoolman's official API documentation:
- [Spoolman OpenAPI Spec](https://github.com/Donovan-Ye/Spoolman/blob/master/spoolman/api/v1/openapi.yaml)

## Support

For issues related to:
- **FilamentButler UI/Frontend:** Open issue in this repository
- **Spoolman API/Backend:** Open issue in [Spoolman repository](https://github.com/Donovan-Ye/Spoolman)
