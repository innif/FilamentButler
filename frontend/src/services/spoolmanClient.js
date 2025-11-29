import axios from 'axios'

// Get Spoolman URL from environment variable
const SPOOLMAN_BASE_URL = import.meta.env.VITE_SPOOLMAN_URL || 'https://spoolman.finn-harms.de'
const SPOOLMAN_API_URL = `${SPOOLMAN_BASE_URL}/api/v1`

/**
 * Spoolman API Client
 * Handles all direct communication with the Spoolman API
 */
class SpoolmanClient {
  constructor() {
    this.client = axios.create({
      baseURL: SPOOLMAN_API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // ============ Info & Health ============

  async getInfo() {
    const response = await this.client.get('/info')
    return response.data
  }

  async getHealth() {
    const response = await this.client.get('/health')
    return response.data
  }

  // ============ Filaments ============

  /**
   * Get all filaments with optional filters
   * @param {Object} filters - Filter options (vendor.name, material, etc.)
   * @returns {Promise<Array>} Array of filament objects
   */
  async getFilaments(filters = {}) {
    const response = await this.client.get('/filament', { params: filters })
    return response.data
  }

  /**
   * Get a specific filament by ID
   * @param {number} id - Filament ID
   * @returns {Promise<Object>} Filament object
   */
  async getFilament(id) {
    const response = await this.client.get(`/filament/${id}`)
    return response.data
  }

  /**
   * Create a new filament
   * @param {Object} filamentData - Filament data
   * @returns {Promise<Object>} Created filament object
   */
  async createFilament(filamentData) {
    const response = await this.client.post('/filament', filamentData)
    return response.data
  }

  /**
   * Update a filament
   * @param {number} id - Filament ID
   * @param {Object} filamentData - Updated filament data
   * @returns {Promise<Object>} Updated filament object
   */
  async updateFilament(id, filamentData) {
    const response = await this.client.patch(`/filament/${id}`, filamentData)
    return response.data
  }

  /**
   * Delete a filament
   * @param {number} id - Filament ID
   * @returns {Promise<void>}
   */
  async deleteFilament(id) {
    await this.client.delete(`/filament/${id}`)
  }

  // ============ Spools ============

  /**
   * Get all spools with optional filters
   * @param {Object} filters - Filter options (filament.id, location, etc.)
   * @returns {Promise<Array>} Array of spool objects
   */
  async getSpools(filters = {}) {
    const response = await this.client.get('/spool', { params: filters })
    return response.data
  }

  /**
   * Get a specific spool by ID
   * @param {number} id - Spool ID
   * @returns {Promise<Object>} Spool object
   */
  async getSpool(id) {
    const response = await this.client.get(`/spool/${id}`)
    return response.data
  }

  /**
   * Create a new spool
   * @param {Object} spoolData - Spool data
   * @returns {Promise<Object>} Created spool object
   */
  async createSpool(spoolData) {
    const response = await this.client.post('/spool', spoolData)
    return response.data
  }

  /**
   * Update a spool
   * @param {number} id - Spool ID
   * @param {Object} spoolData - Updated spool data
   * @returns {Promise<Object>} Updated spool object
   */
  async updateSpool(id, spoolData) {
    const response = await this.client.patch(`/spool/${id}`, spoolData)
    return response.data
  }

  /**
   * Delete a spool
   * @param {number} id - Spool ID
   * @returns {Promise<void>}
   */
  async deleteSpool(id) {
    await this.client.delete(`/spool/${id}`)
  }

  /**
   * Use filament from a spool
   * @param {number} id - Spool ID
   * @param {number} weight - Weight used in grams
   * @returns {Promise<Object>} Updated spool object
   */
  async useSpool(id, weight) {
    const response = await this.client.put(`/spool/${id}/use`, {
      use_weight: weight
    })
    return response.data
  }

  // ============ Vendors ============

  /**
   * Get all vendors
   * @returns {Promise<Array>} Array of vendor objects
   */
  async getVendors(filters = {}) {
    const response = await this.client.get('/vendor', { params: filters })
    return response.data
  }

  /**
   * Get a specific vendor by ID
   * @param {number} id - Vendor ID
   * @returns {Promise<Object>} Vendor object
   */
  async getVendor(id) {
    const response = await this.client.get(`/vendor/${id}`)
    return response.data
  }

  /**
   * Create a new vendor
   * @param {Object} vendorData - Vendor data
   * @returns {Promise<Object>} Created vendor object
   */
  async createVendor(vendorData) {
    const response = await this.client.post('/vendor', vendorData)
    return response.data
  }

  /**
   * Update a vendor
   * @param {number} id - Vendor ID
   * @param {Object} vendorData - Updated vendor data
   * @returns {Promise<Object>} Updated vendor object
   */
  async updateVendor(id, vendorData) {
    const response = await this.client.patch(`/vendor/${id}`, vendorData)
    return response.data
  }

  /**
   * Delete a vendor
   * @param {number} id - Vendor ID
   * @returns {Promise<void>}
   */
  async deleteVendor(id) {
    await this.client.delete(`/vendor/${id}`)
  }
}

// Export a singleton instance
export default new SpoolmanClient()
