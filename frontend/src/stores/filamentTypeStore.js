import { defineStore } from 'pinia'
import spoolmanClient from '@/services/spoolmanClient'
import {
  transformFilaments,
  transformFilamentToFilamentType,
  transformFilamentTypeToFilament,
  getOrCreateVendor
} from '@/services/spoolmanAdapter'

export const useFilamentTypeStore = defineStore('filamentType', {
  state: () => ({
    filamentTypes: [],
    loading: false,
    error: null
  }),

  getters: {
    totalTypes: (state) => state.filamentTypes.length,

    typesByMaterial: (state) => {
      const grouped = {}
      state.filamentTypes.forEach(type => {
        if (!grouped[type.material]) {
          grouped[type.material] = []
        }
        grouped[type.material].push(type)
      })
      return grouped
    },

    typesByManufacturer: (state) => {
      const grouped = {}
      state.filamentTypes.forEach(type => {
        if (!grouped[type.manufacturer]) {
          grouped[type.manufacturer] = []
        }
        grouped[type.manufacturer].push(type)
      })
      return grouped
    },

    getTypeById: (state) => {
      return (id) => state.filamentTypes.find(type => type.id === id)
    }
  },

  actions: {
    async fetchFilamentTypes() {
      this.loading = true
      this.error = null
      try {
        const spoolmanFilaments = await spoolmanClient.getFilaments()
        this.filamentTypes = transformFilaments(spoolmanFilaments)
      } catch (error) {
        this.error = error.message
        console.error('Error fetching filament types:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchFilamentType(id) {
      this.loading = true
      this.error = null
      try {
        const spoolmanFilament = await spoolmanClient.getFilament(id)
        return transformFilamentToFilamentType(spoolmanFilament)
      } catch (error) {
        this.error = error.message
        console.error('Error fetching filament type:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createFilamentType(typeData) {
      this.loading = true
      this.error = null
      try {
        // Get or create vendor
        const vendorId = await getOrCreateVendor(typeData.manufacturer, spoolmanClient)

        // Add vendor_id to typeData
        const typeDataWithVendor = {
          ...typeData,
          _vendorId: vendorId
        }

        const spoolmanData = transformFilamentTypeToFilament(typeDataWithVendor)
        const createdFilament = await spoolmanClient.createFilament(spoolmanData)
        const transformedType = transformFilamentToFilamentType(createdFilament)
        this.filamentTypes.push(transformedType)
        return transformedType
      } catch (error) {
        this.error = error.message
        console.error('Error creating filament type:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateFilamentType(id, typeData) {
      this.loading = true
      this.error = null
      try {
        // Get or create vendor if manufacturer changed
        const vendorId = await getOrCreateVendor(typeData.manufacturer, spoolmanClient)

        // Add vendor_id to typeData
        const typeDataWithVendor = {
          ...typeData,
          _vendorId: vendorId
        }

        const spoolmanData = transformFilamentTypeToFilament(typeDataWithVendor)
        const updatedFilament = await spoolmanClient.updateFilament(id, spoolmanData)
        const transformedType = transformFilamentToFilamentType(updatedFilament)
        const index = this.filamentTypes.findIndex(t => t.id === id)
        if (index !== -1) {
          this.filamentTypes[index] = transformedType
        }
        return transformedType
      } catch (error) {
        this.error = error.message
        console.error('Error updating filament type:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteFilamentType(id) {
      this.loading = true
      this.error = null
      try {
        await spoolmanClient.deleteFilament(id)
        this.filamentTypes = this.filamentTypes.filter(t => t.id !== id)
      } catch (error) {
        this.error = error.message
        console.error('Error deleting filament type:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
