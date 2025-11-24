import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = '/api/spools'

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
          grouped[typeId] = {
            count: 0,
            totalWeight: 0,
            spools: []
          }
        }
        grouped[typeId].count++
        grouped[typeId].totalWeight += spool.remainingWeight
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
          params.filamentTypeId = filamentTypeId
        }
        const response = await axios.get(API_URL, { params })
        this.spools = response.data
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
        const response = await axios.get(`${API_URL}/${id}`)
        return response.data
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
        const response = await axios.post(API_URL, spoolData)
        this.spools.push(response.data)
        return response.data
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
        const response = await axios.put(`${API_URL}/${id}`, spoolData)
        const index = this.spools.findIndex(s => s.id === id)
        if (index !== -1) {
          this.spools[index] = response.data
        }
        return response.data
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
        await axios.delete(`${API_URL}/${id}`)
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
