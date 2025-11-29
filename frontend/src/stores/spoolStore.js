import { defineStore } from 'pinia'
import spoolmanClient from '@/services/spoolmanClient'
import {
  transformSpools,
  transformSpoolToSpool,
  transformSpoolToSpoolman
} from '@/services/spoolmanAdapter'

export const useSpoolStore = defineStore('spool', {
  state: () => ({
    spools: [],
    loading: false,
    error: null
  }),

  getters: {
    totalSpools: (state) => state.spools.length,

    activeSpools: (state) => state.spools.filter(s => !s.isEmpty),

    emptySpools: (state) => state.spools.filter(s => s.isEmpty),

    totalWeight: (state) => {
      return state.spools.reduce((sum, spool) => sum + spool.remainingWeight, 0)
    },

    spoolsByFilamentType: (state) => {
      const grouped = {}
      state.spools.forEach(spool => {
        const typeId = spool.filamentTypeId
        if (!grouped[typeId]) {
          const filamentType = spool.filamentType || spool.FilamentType
          grouped[typeId] = {
            count: 0,
            totalWeight: 0,
            totalInitialWeight: 0,
            spools: [],
            filamentType: filamentType
          }
        }
        grouped[typeId].count++
        grouped[typeId].totalWeight += spool.remainingWeight || 0
        grouped[typeId].totalInitialWeight += spool.weight || 0
        grouped[typeId].spools.push(spool)
      })
      return grouped
    },

    spoolsByLocation: (state) => {
      const grouped = {}
      state.spools.forEach(spool => {
        const location = spool.location || 'Unbekannt'
        if (!grouped[location]) {
          grouped[location] = []
        }
        grouped[location].push(spool)
      })
      return grouped
    },

    spoolsByMaterial: (state) => {
      const grouped = {}
      state.spools.forEach(spool => {
        // Material is now in the FilamentType, accessed via spool.filamentType or spool.FilamentType
        const filamentType = spool.filamentType || spool.FilamentType
        const material = filamentType?.material || 'Unbekannt'
        if (!grouped[material]) {
          grouped[material] = {
            count: 0,
            totalWeight: 0,
            spools: []
          }
        }
        grouped[material].count++
        grouped[material].totalWeight += spool.remainingWeight || 0
        grouped[material].spools.push(spool)
      })
      return grouped
    }
  },

  actions: {
    async fetchSpools(filamentTypeId = null) {
      this.loading = true
      this.error = null
      try {
        const params = {}
        if (filamentTypeId) {
          params['filament.id'] = filamentTypeId
        }
        const spoolmanSpools = await spoolmanClient.getSpools(params)
        this.spools = transformSpools(spoolmanSpools)
      } catch (error) {
        this.error = error.message
        console.error('Error fetching spools:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSpool(id) {
      this.loading = true
      this.error = null
      try {
        const spoolmanSpool = await spoolmanClient.getSpool(id)
        return transformSpoolToSpool(spoolmanSpool)
      } catch (error) {
        this.error = error.message
        console.error('Error fetching spool:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSpool(spoolData) {
      this.loading = true
      this.error = null
      try {
        const spoolmanData = transformSpoolToSpoolman(spoolData)
        const createdSpool = await spoolmanClient.createSpool(spoolmanData)
        const transformedSpool = transformSpoolToSpool(createdSpool)
        this.spools.push(transformedSpool)
        return transformedSpool
      } catch (error) {
        this.error = error.message
        console.error('Error creating spool:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSpool(id, spoolData) {
      this.loading = true
      this.error = null
      try {
        const spoolmanData = transformSpoolToSpoolman(spoolData)
        const updatedSpool = await spoolmanClient.updateSpool(id, spoolmanData)
        const transformedSpool = transformSpoolToSpool(updatedSpool)
        const index = this.spools.findIndex(s => s.id === id)
        if (index !== -1) {
          this.spools[index] = transformedSpool
        }
        return transformedSpool
      } catch (error) {
        this.error = error.message
        console.error('Error updating spool:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSpool(id) {
      this.loading = true
      this.error = null
      try {
        await spoolmanClient.deleteSpool(id)
        this.spools = this.spools.filter(s => s.id !== id)
      } catch (error) {
        this.error = error.message
        console.error('Error deleting spool:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
