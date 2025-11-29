/**
 * Spoolman Data Adapter
 * Transforms Spoolman API data structures to FilamentButler format
 * and vice versa
 */

/**
 * Transform Spoolman Filament to FilamentButler FilamentType
 * @param {Object} spoolmanFilament - Filament object from Spoolman API
 * @returns {Object} FilamentType object in FilamentButler format
 */
export function transformFilamentToFilamentType(spoolmanFilament) {
  if (!spoolmanFilament) return null

  // Handle multi-color filaments
  let color = 'Unknown'
  let colorHex = '#000000'
  let color2 = null
  let colorHex2 = null

  if (spoolmanFilament.color_hex) {
    // Single color - ensure it has # prefix
    colorHex = spoolmanFilament.color_hex.startsWith('#')
      ? spoolmanFilament.color_hex
      : `#${spoolmanFilament.color_hex}`
    color = colorHex
  }

  if (spoolmanFilament.multi_color_hexes) {
    // Multi-color filament - split colors
    const colors = spoolmanFilament.multi_color_hexes.split(',')
    if (colors.length > 0) {
      colorHex = colors[0].startsWith('#') ? colors[0] : `#${colors[0]}`
      color = colorHex
    }
    if (colors.length > 1) {
      colorHex2 = colors[1].startsWith('#') ? colors[1] : `#${colors[1]}`
      color2 = colorHex2
    }
  }

  return {
    id: spoolmanFilament.id,
    name: spoolmanFilament.name || 'Unknown',
    manufacturer: spoolmanFilament.vendor?.name || 'Unknown',
    material: spoolmanFilament.material || 'PLA',
    color: color,
    colorHex: colorHex,
    color2: color2,
    colorHex2: colorHex2,
    diameter: spoolmanFilament.diameter || 1.75,
    standardWeight: spoolmanFilament.weight || null,
    standardPrice: spoolmanFilament.price || null,
    printTemperature: spoolmanFilament.settings_extruder_temp || null,
    bedTemperature: spoolmanFilament.settings_bed_temp || null,
    notes: spoolmanFilament.comment || '',
    createdAt: spoolmanFilament.registered,
    updatedAt: spoolmanFilament.registered,
    // Store vendor_id for updates
    _vendorId: spoolmanFilament.vendor?.id || null,
    // Store density for calculations
    _density: spoolmanFilament.density || 1.24,
    // Store spool weight
    _spoolWeight: spoolmanFilament.spool_weight || null
  }
}

/**
 * Transform FilamentButler FilamentType to Spoolman Filament
 * @param {Object} filamentType - FilamentType object from FilamentButler
 * @returns {Object} Filament object in Spoolman format
 */
export function transformFilamentTypeToFilament(filamentType) {
  if (!filamentType) return null

  const filamentData = {
    name: filamentType.name,
    material: filamentType.material,
    density: filamentType._density || 1.24, // Default PLA density
    diameter: filamentType.diameter || 1.75,
    weight: filamentType.standardWeight || null,
    price: filamentType.standardPrice || null,
    settings_extruder_temp: filamentType.printTemperature || null,
    settings_bed_temp: filamentType.bedTemperature || null,
    comment: filamentType.notes || null,
    spool_weight: filamentType._spoolWeight || null
  }

  // Handle vendor_id
  if (filamentType._vendorId) {
    filamentData.vendor_id = filamentType._vendorId
  }

  // Handle colors
  if (filamentType.colorHex2) {
    // Multi-color filament
    const color1 = filamentType.colorHex?.replace('#', '') || '000000'
    const color2 = filamentType.colorHex2?.replace('#', '') || '000000'
    filamentData.multi_color_hexes = `${color1},${color2}`
    filamentData.multi_color_direction = 'coaxial' // Default direction
    filamentData.color_hex = null
  } else if (filamentType.colorHex) {
    // Single color
    filamentData.color_hex = filamentType.colorHex.replace('#', '')
    filamentData.multi_color_hexes = null
  }

  return filamentData
}

/**
 * Transform Spoolman Spool to FilamentButler Spool
 * @param {Object} spoolmanSpool - Spool object from Spoolman API
 * @returns {Object} Spool object in FilamentButler format
 */
export function transformSpoolToSpool(spoolmanSpool) {
  if (!spoolmanSpool) return null

  return {
    id: spoolmanSpool.id,
    filamentTypeId: spoolmanSpool.filament?.id || null,
    spoolNumber: spoolmanSpool.lot_nr || null,
    weight: spoolmanSpool.initial_weight || 0,
    remainingWeight: spoolmanSpool.remaining_weight || 0,
    price: spoolmanSpool.price || null,
    purchaseDate: spoolmanSpool.first_used || null,
    location: spoolmanSpool.location || null,
    notes: spoolmanSpool.comment || '',
    isEmpty: spoolmanSpool.archived || false,
    createdAt: spoolmanSpool.registered,
    updatedAt: spoolmanSpool.last_used || spoolmanSpool.registered,
    // Include the nested filament type for frontend compatibility
    filamentType: transformFilamentToFilamentType(spoolmanSpool.filament),
    FilamentType: transformFilamentToFilamentType(spoolmanSpool.filament),
    // Store additional Spoolman fields
    _usedWeight: spoolmanSpool.used_weight || 0,
    _spoolWeight: spoolmanSpool.spool_weight || null
  }
}

/**
 * Transform FilamentButler Spool to Spoolman Spool
 * @param {Object} spool - Spool object from FilamentButler
 * @returns {Object} Spool object in Spoolman format
 */
export function transformSpoolToSpoolman(spool) {
  if (!spool) return null

  const spoolData = {
    filament_id: spool.filamentTypeId,
    price: spool.price || null,
    initial_weight: spool.weight || null,
    location: spool.location || null,
    lot_nr: spool.spoolNumber || null,
    comment: spool.notes || null,
    archived: spool.isEmpty || false
  }

  // Handle remaining weight
  if (spool.remainingWeight !== null && spool.remainingWeight !== undefined) {
    spoolData.remaining_weight = spool.remainingWeight
  }

  // Handle first_used (purchase date)
  if (spool.purchaseDate) {
    spoolData.first_used = spool.purchaseDate
  }

  // Handle spool weight if available
  if (spool._spoolWeight !== null && spool._spoolWeight !== undefined) {
    spoolData.spool_weight = spool._spoolWeight
  }

  return spoolData
}

/**
 * Transform array of Spoolman Filaments to FilamentButler FilamentTypes
 * @param {Array} spoolmanFilaments - Array of filament objects from Spoolman
 * @returns {Array} Array of FilamentType objects in FilamentButler format
 */
export function transformFilaments(spoolmanFilaments) {
  if (!Array.isArray(spoolmanFilaments)) return []
  return spoolmanFilaments.map(transformFilamentToFilamentType).filter(Boolean)
}

/**
 * Transform array of Spoolman Spools to FilamentButler Spools
 * @param {Array} spoolmanSpools - Array of spool objects from Spoolman
 * @returns {Array} Array of Spool objects in FilamentButler format
 */
export function transformSpools(spoolmanSpools) {
  if (!Array.isArray(spoolmanSpools)) return []
  return spoolmanSpools.map(transformSpoolToSpool).filter(Boolean)
}

/**
 * Get vendor ID by name or create new vendor
 * @param {string} vendorName - Vendor name
 * @param {Object} spoolmanClient - Spoolman client instance
 * @returns {Promise<number|null>} Vendor ID or null
 */
export async function getOrCreateVendor(vendorName, spoolmanClient) {
  if (!vendorName || vendorName === 'Unknown') return null

  try {
    // Search for existing vendor
    const vendors = await spoolmanClient.getVendors({ 'name': vendorName })

    if (vendors && vendors.length > 0) {
      // Vendor exists, return first match
      return vendors[0].id
    }

    // Vendor doesn't exist, create it
    const newVendor = await spoolmanClient.createVendor({
      name: vendorName,
      comment: 'Auto-created by FilamentButler'
    })

    return newVendor.id
  } catch (error) {
    console.error('Error getting/creating vendor:', error)
    return null
  }
}

/**
 * Calculate remaining weight from used weight and initial weight
 * @param {number} initialWeight - Initial weight in grams
 * @param {number} usedWeight - Used weight in grams
 * @returns {number} Remaining weight in grams
 */
export function calculateRemainingWeight(initialWeight, usedWeight) {
  return Math.max(0, (initialWeight || 0) - (usedWeight || 0))
}

/**
 * Calculate used weight from initial weight and remaining weight
 * @param {number} initialWeight - Initial weight in grams
 * @param {number} remainingWeight - Remaining weight in grams
 * @returns {number} Used weight in grams
 */
export function calculateUsedWeight(initialWeight, remainingWeight) {
  return Math.max(0, (initialWeight || 0) - (remainingWeight || 0))
}
