#!/usr/bin/env node

/**
 * Migration Script: FilamentButler Legacy Backend → Spoolman
 *
 * This script migrates data from the old FilamentButler PostgreSQL backend
 * to a Spoolman instance.
 *
 * Prerequisites:
 * - Old backend must be running (docker-compose --profile legacy up)
 * - Spoolman instance must be accessible
 * - Node.js with required packages (axios, pg)
 *
 * Usage:
 *   node migrate-to-spoolman.js --legacy-url http://localhost:3000 --spoolman-url https://spoolman.finn-harms.de
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const args = process.argv.slice(2);
const LEGACY_BACKEND_URL = getArg('--legacy-url') || 'http://localhost:3000';
const SPOOLMAN_URL = getArg('--spoolman-url') || 'https://spoolman.finn-harms.de';
const DRY_RUN = args.includes('--dry-run');
const SKIP_CONFIRMATION = args.includes('--yes') || args.includes('-y');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Statistics
const stats = {
  filamentTypes: { total: 0, created: 0, failed: 0 },
  spools: { total: 0, created: 0, failed: 0 },
  vendors: { created: 0 }
};

// Helper Functions

function getArg(name) {
  const index = args.indexOf(name);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.bright + '='.repeat(60) + colors.reset);
  log(title, colors.bright);
  console.log(colors.bright + '='.repeat(60) + colors.reset + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

async function confirm(question) {
  if (SKIP_CONFIRMATION) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question + ' (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Spoolman API Functions

async function getOrCreateVendor(vendorName, spoolmanClient) {
  try {
    // Search for existing vendor
    const response = await spoolmanClient.get('/vendor', {
      params: { 'name': vendorName }
    });

    if (response.data && response.data.length > 0) {
      logInfo(`  → Vendor "${vendorName}" already exists (ID: ${response.data[0].id})`);
      return response.data[0].id;
    }

    // Create new vendor
    if (!DRY_RUN) {
      const newVendor = await spoolmanClient.post('/vendor', {
        name: vendorName,
        comment: 'Migrated from FilamentButler'
      });
      stats.vendors.created++;
      logSuccess(`  → Created vendor "${vendorName}" (ID: ${newVendor.data.id})`);
      return newVendor.data.id;
    } else {
      logInfo(`  → [DRY RUN] Would create vendor "${vendorName}"`);
      return null;
    }
  } catch (error) {
    logError(`  → Failed to get/create vendor "${vendorName}": ${error.message}`);
    return null;
  }
}

function transformFilamentType(filamentType, vendorId) {
  const filament = {
    name: filamentType.name,
    material: filamentType.material || 'PLA',
    density: 1.24, // Default PLA density
    diameter: filamentType.diameter || 1.75,
    weight: filamentType.standardWeight || null,
    price: filamentType.standardPrice || null,
    settings_extruder_temp: filamentType.printTemperature || null,
    settings_bed_temp: filamentType.bedTemperature || null,
    comment: filamentType.notes || null,
    vendor_id: vendorId
  };

  // Handle colors
  if (filamentType.colorHex2) {
    // Multi-color
    const color1 = filamentType.colorHex?.replace('#', '') || '000000';
    const color2 = filamentType.colorHex2?.replace('#', '') || '000000';
    filament.multi_color_hexes = `${color1},${color2}`;
    filament.multi_color_direction = 'coaxial';
  } else if (filamentType.colorHex) {
    // Single color
    filament.color_hex = filamentType.colorHex.replace('#', '');
  }

  return filament;
}

function transformSpool(spool, filamentIdMap) {
  const spoolmanFilamentId = filamentIdMap[spool.filamentTypeId];

  if (!spoolmanFilamentId) {
    throw new Error(`No filament mapping found for filamentTypeId ${spool.filamentTypeId}`);
  }

  return {
    filament_id: spoolmanFilamentId,
    price: spool.price || null,
    initial_weight: spool.weight || null,
    remaining_weight: spool.remainingWeight || null,
    location: spool.location || null,
    lot_nr: spool.spoolNumber || null,
    comment: spool.notes || null,
    archived: spool.isEmpty || false,
    first_used: spool.purchaseDate || null
  };
}

// Main Migration Functions

async function migrateFilamentTypes(legacyClient, spoolmanClient) {
  logSection('Migrating Filament Types');

  try {
    // Fetch all filament types from legacy backend
    const response = await legacyClient.get('/api/filament-types');
    const filamentTypes = response.data;
    stats.filamentTypes.total = filamentTypes.length;

    logInfo(`Found ${filamentTypes.length} filament types to migrate`);

    const filamentIdMap = {};

    for (const filamentType of filamentTypes) {
      try {
        logInfo(`\nMigrating: ${filamentType.manufacturer} - ${filamentType.name} (${filamentType.material})`);

        // Get or create vendor
        const vendorId = await getOrCreateVendor(filamentType.manufacturer, spoolmanClient);

        // Transform filament type to Spoolman format
        const spoolmanFilament = transformFilamentType(filamentType, vendorId);

        if (!DRY_RUN) {
          // Create filament in Spoolman
          const created = await spoolmanClient.post('/filament', spoolmanFilament);
          filamentIdMap[filamentType.id] = created.data.id;
          stats.filamentTypes.created++;
          logSuccess(`  → Created filament (Spoolman ID: ${created.data.id})`);
        } else {
          logInfo(`  → [DRY RUN] Would create filament`);
          filamentIdMap[filamentType.id] = `DRY_RUN_${filamentType.id}`;
        }
      } catch (error) {
        stats.filamentTypes.failed++;
        logError(`  → Failed: ${error.message}`);
      }
    }

    return filamentIdMap;
  } catch (error) {
    logError(`Failed to fetch filament types: ${error.message}`);
    throw error;
  }
}

async function migrateSpools(legacyClient, spoolmanClient, filamentIdMap) {
  logSection('Migrating Spools');

  try {
    // Fetch all spools from legacy backend
    const response = await legacyClient.get('/api/spools');
    const spools = response.data;
    stats.spools.total = spools.length;

    logInfo(`Found ${spools.length} spools to migrate`);

    for (const spool of spools) {
      try {
        const filamentType = spool.filamentType || spool.FilamentType;
        const filamentName = filamentType ? `${filamentType.manufacturer} ${filamentType.name}` : 'Unknown';

        logInfo(`\nMigrating spool: ${filamentName} - ${spool.remainingWeight}g remaining`);

        // Transform spool to Spoolman format
        const spoolmanSpool = transformSpool(spool, filamentIdMap);

        if (!DRY_RUN) {
          // Create spool in Spoolman
          const created = await spoolmanClient.post('/spool', spoolmanSpool);
          stats.spools.created++;
          logSuccess(`  → Created spool (Spoolman ID: ${created.data.id})`);
        } else {
          logInfo(`  → [DRY RUN] Would create spool`);
        }
      } catch (error) {
        stats.spools.failed++;
        logError(`  → Failed: ${error.message}`);
      }
    }
  } catch (error) {
    logError(`Failed to fetch spools: ${error.message}`);
    throw error;
  }
}

// Main Function

async function main() {
  console.clear();
  logSection('FilamentButler → Spoolman Migration Tool');

  logInfo(`Legacy Backend: ${LEGACY_BACKEND_URL}`);
  logInfo(`Spoolman URL:   ${SPOOLMAN_URL}`);
  logInfo(`Mode:           ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);

  // Create axios clients
  const legacyClient = axios.create({
    baseURL: LEGACY_BACKEND_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  const spoolmanClient = axios.create({
    baseURL: `${SPOOLMAN_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // Test connections
    logSection('Testing Connections');

    logInfo('Testing legacy backend connection...');
    await legacyClient.get('/api/health');
    logSuccess('Legacy backend is reachable');

    logInfo('Testing Spoolman connection...');
    const spoolmanInfo = await spoolmanClient.get('/info');
    logSuccess(`Spoolman is reachable (version ${spoolmanInfo.data.version})`);

    // Confirm migration
    if (!DRY_RUN) {
      console.log('');
      logWarning('⚠️  WARNING: This will create new data in your Spoolman instance!');
      logWarning('⚠️  Make sure you have a backup of your Spoolman database!');
      console.log('');

      const proceed = await confirm('Do you want to proceed with the migration?');
      if (!proceed) {
        logInfo('Migration cancelled by user');
        process.exit(0);
      }
    }

    // Perform migration
    const filamentIdMap = await migrateFilamentTypes(legacyClient, spoolmanClient);
    await migrateSpools(legacyClient, spoolmanClient, filamentIdMap);

    // Print summary
    logSection('Migration Summary');

    console.log('Vendors:');
    logSuccess(`  Created: ${stats.vendors.created}`);

    console.log('\nFilament Types:');
    logInfo(`  Total:   ${stats.filamentTypes.total}`);
    logSuccess(`  Created: ${stats.filamentTypes.created}`);
    if (stats.filamentTypes.failed > 0) {
      logError(`  Failed:  ${stats.filamentTypes.failed}`);
    }

    console.log('\nSpools:');
    logInfo(`  Total:   ${stats.spools.total}`);
    logSuccess(`  Created: ${stats.spools.created}`);
    if (stats.spools.failed > 0) {
      logError(`  Failed:  ${stats.spools.failed}`);
    }

    if (DRY_RUN) {
      console.log('\n');
      logInfo('This was a DRY RUN - no changes were made to Spoolman');
      logInfo('Run without --dry-run to perform the actual migration');
    } else {
      console.log('\n');
      logSuccess('Migration completed successfully!');
      logInfo('You can now use FilamentButler with your Spoolman instance');
    }

  } catch (error) {
    console.log('\n');
    logError('Migration failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Show usage if --help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
FilamentButler → Spoolman Migration Tool

Usage:
  node migrate-to-spoolman.js [options]

Options:
  --legacy-url <url>     URL of the legacy FilamentButler backend
                         (default: http://localhost:3000)

  --spoolman-url <url>   URL of your Spoolman instance
                         (default: https://spoolman.finn-harms.de)

  --dry-run              Run migration without making any changes
                         (useful for testing)

  --yes, -y              Skip confirmation prompts

  --help, -h             Show this help message

Examples:
  # Dry run to test the migration
  node migrate-to-spoolman.js --dry-run

  # Migrate with custom URLs
  node migrate-to-spoolman.js \\
    --legacy-url http://localhost:3000 \\
    --spoolman-url https://my-spoolman.com

  # Migrate without confirmation prompts
  node migrate-to-spoolman.js --yes

Prerequisites:
  - Old backend must be running (docker-compose --profile legacy up)
  - Spoolman instance must be accessible
  - Install dependencies: npm install axios
  `);
  process.exit(0);
}

// Run migration
main();
