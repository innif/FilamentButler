import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = '/api/filament-types'

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
        const response = await axios.get(API_URL)
        this.filamentTypes = response.data
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
        const response = await axios.get(`${API_URL}/${id}`)
        return response.data
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
        const response = await axios.post(API_URL, typeData)
        this.filamentTypes.push(response.data)
        return response.data
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
        const response = await axios.put(`${API_URL}/${id}`, typeData)
        const index = this.filamentTypes.findIndex(t => t.id === id)
        if (index !== -1) {
          this.filamentTypes[index] = response.data
        }
        return response.data
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
        await axios.delete(`${API_URL}/${id}`)
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
