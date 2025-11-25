<template>
  <div class="library">
    <div class="header-section">
      <h2>Bibliothek</h2>
      <div class="header-controls">
        <div class="sort-control">
          <label for="sort-select">
            <span class="material-symbols-outlined">sort</span>
            Sortieren:
          </label>
          <select id="sort-select" v-model="sortBy" class="sort-select">
            <option value="type">Typ (Name)</option>
            <option value="color">Farbe</option>
            <option value="manufacturer">Hersteller</option>
            <option value="count">Anzahl</option>
            <option value="weight">Gewicht</option>
          </select>
        </div>
        <router-link to="/add-spool" class="btn btn-primary">
          <span class="material-symbols-outlined">add</span>
          Neue Spule
        </router-link>
      </div>
    </div>

    <div class="stats-grid" v-if="!spoolStore.loading && spoolStore.spools.length > 0">
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon">inventory_2</span>
        <div class="stat-content">
          <div class="stat-value">{{ spoolStore.totalSpools }}</div>
          <div class="stat-label">Spulen insgesamt</div>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon">scale</span>
        <div class="stat-content">
          <div class="stat-value">{{ (spoolStore.totalWeight / 1000).toFixed(2) }} kg</div>
          <div class="stat-label">Gesamtgewicht</div>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-symbols-outlined stat-icon">category</span>
        <div class="stat-content">
          <div class="stat-value">{{ Object.keys(spoolStore.spoolsByMaterial).length }}</div>
          <div class="stat-label">Materialarten</div>
        </div>
      </div>
    </div>

    <div v-if="spoolStore.loading" class="loading">
      <span class="material-symbols-outlined rotating">progress_activity</span>
      Lade Spulen...
    </div>

    <div v-else-if="spoolStore.error" class="alert alert-error">
      <span class="material-symbols-outlined">error</span>
      Fehler beim Laden: {{ spoolStore.error }}
    </div>

    <div v-else-if="spoolStore.spools.length === 0" class="empty-state">
      <span class="material-symbols-outlined empty-icon">inventory_2</span>
      <p>Keine Spulen vorhanden</p>
      <router-link to="/add-spool" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Erste Spule hinzufügen
      </router-link>
    </div>

    <div v-else>
      <div v-for="(_data, material) in spoolStore.spoolsByMaterial" :key="material + '-' + sortBy" class="material-section">
        <div class="material-header">
          <h3>{{ material }}</h3>
          <span class="material-stats">
            {{ spoolsByFilamentTypeInMaterial(material).length }} Filament-Arten · {{ (materialTotalWeight(material) / 1000).toFixed(2) }} kg
          </span>
        </div>

        <div class="grid grid-cols-3">
          <div v-for="item in getSortedSpoolsArray(material)" :key="item.typeId + '-' + sortBy" class="spool-card" @click="expandFilamentType(item.typeId)">
            <div class="spool-card-layout">
              <div
                class="spool-color"
                :style="item.typeData.filamentType?.color2
                  ? { background: `linear-gradient(135deg, ${item.typeData.filamentType.colorHex} 0%, ${item.typeData.filamentType.colorHex2} 100%)` }
                  : { backgroundColor: item.typeData.filamentType?.colorHex || '#cccccc' }
                "
              ></div>

              <div class="spool-content">
                <div class="spool-title-row">
                  <h4 class="spool-name">{{ item.typeData.filamentType?.name || 'Unbekannt' }}</h4>
                  <div class="spool-actions">
                    <button v-if="item.typeData.count > 1" @click.stop="toggleExpand(item.typeId)" class="btn-icon" :title="expandedTypes[item.typeId] ? 'Einklappen' : 'Ausklappen'">
                      <span class="material-symbols-outlined">{{ expandedTypes[item.typeId] ? 'expand_less' : 'expand_more' }}</span>
                    </button>
                    <template v-else>
                      <router-link :to="`/edit-spool/${item.typeData.spools[0].id}`" class="btn-icon" title="Bearbeiten" @click.stop>
                        <span class="material-symbols-outlined">edit</span>
                      </router-link>
                      <button @click.stop="confirmDelete(item.typeData.spools[0])" class="btn-icon btn-icon-danger" title="Löschen">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </template>
                  </div>
                </div>
                <div class="spool-info-compact">
                  <div class="spool-text-info">
                    <p class="spool-manufacturer" v-if="item.typeData.filamentType?.manufacturer">{{ item.typeData.filamentType.manufacturer }}</p>
                    <p class="spool-color-name">{{ item.typeData.filamentType?.color2 ? `${item.typeData.filamentType.color} / ${item.typeData.filamentType.color2}` : item.typeData.filamentType?.color || '' }}</p>
                  </div>

                  <!-- Show spool count for multiple spools instead of weight bar -->
                  <div v-if="item.typeData.count > 1" class="spool-count-display">
                    <span class="material-symbols-outlined spool-count-icon">inventory_2</span>
                    <span class="spool-count-text">{{ item.typeData.count }} Spulen</span>
                  </div>

                  <!-- Show weight bar only for single spools -->
                  <div v-else class="spool-weight-compact">
                    <div class="weight-bar-container">
                      <div
                        class="weight-bar"
                        :style="{ width: (item.typeData.totalWeight / item.typeData.totalInitialWeight * 100) + '%' }"
                      ></div>
                    </div>
                    <div class="weight-text">
                      {{ item.typeData.totalWeight.toFixed(0) }}g / {{ item.typeData.totalInitialWeight.toFixed(0) }}g
                      ({{ ((item.typeData.totalWeight / item.typeData.totalInitialWeight) * 100).toFixed(0) }}%)
                    </div>
                  </div>
                </div>

                <div class="spool-details">
                  <template v-if="item.typeData.count === 1">
                    <span v-if="item.typeData.spools[0].location">
                      <span class="material-symbols-outlined detail-icon">location_on</span>
                      {{ item.typeData.spools[0].location }}
                    </span>
                    <span v-if="item.typeData.spools[0].spoolNumber" class="spool-number">
                      #{{ item.typeData.spools[0].spoolNumber }}
                    </span>
                  </template>
                </div>

                <!-- Expandable section showing individual spools -->
                <div v-if="item.typeData.count > 1 && expandedTypes[item.typeId]" class="expanded-spools">
                  <div class="spools-divider"></div>
                  <div v-for="spool in item.typeData.spools" :key="spool.id" class="individual-spool">
                    <div class="individual-spool-header">
                      <span v-if="spool.spoolNumber" class="spool-number-badge">#{{ spool.spoolNumber }}</span>
                      <span v-else class="spool-number-badge">Spule</span>
                      <div class="individual-spool-actions">
                        <router-link :to="`/edit-spool/${spool.id}`" class="btn-icon-small" title="Bearbeiten" @click.stop>
                          <span class="material-symbols-outlined">edit</span>
                        </router-link>
                        <button @click.stop="confirmDelete(spool)" class="btn-icon-small btn-icon-danger" title="Löschen">
                          <span class="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                    <div class="individual-spool-weight">
                      <div class="weight-bar-container-small">
                        <div
                          class="weight-bar"
                          :style="{ width: (spool.remainingWeight / spool.weight * 100) + '%' }"
                        ></div>
                      </div>
                      <div class="weight-text-small">
                        {{ spool.remainingWeight }}g / {{ spool.weight }}g ({{ ((spool.remainingWeight / spool.weight) * 100).toFixed(0) }}%)
                      </div>
                    </div>
                    <div v-if="spool.location" class="individual-spool-location">
                      <span class="material-symbols-outlined detail-icon-small">location_on</span>
                      {{ spool.location }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useSpoolStore } from '../stores/spoolStore'
import { onMounted, ref, computed } from 'vue'

export default {
  name: 'Library',
  setup() {
    const spoolStore = useSpoolStore()
    const expandedTypes = ref({})
    const sortBy = ref('type')

    onMounted(() => {
      spoolStore.fetchSpools()
    })

    const spoolsByFilamentTypeInMaterial = (material) => {
      const filtered = {}
      Object.entries(spoolStore.spoolsByFilamentType).forEach(([typeId, data]) => {
        if (data.filamentType?.material === material) {
          filtered[typeId] = data
        }
      })
      return filtered
    }

    // Create a computed property that holds all sorted spools by material
    const allSortedSpools = computed(() => {
      console.log('Computing sorted spools with sortBy:', sortBy.value)
      const result = {}

      // Iterate through each material
      Object.keys(spoolStore.spoolsByMaterial).forEach(material => {
        const filtered = {}
        Object.entries(spoolStore.spoolsByFilamentType).forEach(([typeId, data]) => {
          if (data.filamentType?.material === material) {
            filtered[typeId] = data
          }
        })

        const entries = Object.entries(filtered)
        console.log(`Sorting ${material} with ${entries.length} entries by ${sortBy.value}`)

        // Create a copy and sort it to avoid mutating the original
        const sorted = [...entries].sort(([, a], [, b]) => {
          switch (sortBy.value) {
            case 'type':
              return (a.filamentType?.name || '').localeCompare(b.filamentType?.name || '')

            case 'color':
              return (a.filamentType?.color || '').localeCompare(b.filamentType?.color || '')

            case 'manufacturer':
              return (a.filamentType?.manufacturer || '').localeCompare(b.filamentType?.manufacturer || '')

            case 'count':
              return b.count - a.count // Descending order

            case 'weight':
              return b.totalWeight - a.totalWeight // Descending order

            default:
              return 0
          }
        })

        // Store as array instead of object to preserve sort order
        result[material] = sorted
      })

      return result
    })

    const sortedSpoolsByFilamentTypeInMaterial = (material) => {
      const sorted = allSortedSpools.value[material] || []
      // Convert array back to object for template
      return Object.fromEntries(sorted)
    }

    // Return an array instead of object to ensure Vue sees the order change
    const getSortedSpoolsArray = (material) => {
      const sorted = allSortedSpools.value[material] || []
      // Convert to array of objects with typeId and typeData
      return sorted.map(([typeId, typeData]) => ({
        typeId,
        typeData
      }))
    }

    const materialTotalWeight = (material) => {
      const types = spoolsByFilamentTypeInMaterial(material)
      return Object.values(types).reduce((sum, typeData) => sum + typeData.totalWeight, 0)
    }

    const toggleExpand = (typeId) => {
      expandedTypes.value[typeId] = !expandedTypes.value[typeId]
    }

    const expandFilamentType = () => {
      // Optional: expand on card click
    }

    const confirmDelete = async (spool) => {
      const filamentType = spool.filamentType || spool.FilamentType
      const name = filamentType?.name || 'diese Spule'
      if (confirm(`Möchtest du die Spule "${name}" wirklich löschen?`)) {
        try {
          await spoolStore.deleteSpool(spool.id)
        } catch (error) {
          alert('Fehler beim Löschen der Spule')
        }
      }
    }

    return {
      spoolStore,
      expandedTypes,
      sortBy,
      spoolsByFilamentTypeInMaterial,
      sortedSpoolsByFilamentTypeInMaterial,
      getSortedSpoolsArray,
      allSortedSpools,
      materialTotalWeight,
      toggleExpand,
      expandFilamentType,
      confirmDelete
    }
  }
}
</script>

<style scoped>
.library {
  padding: 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.header-section h2 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.625rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.sort-control label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.sort-control label .material-symbols-outlined {
  font-size: 1.125rem;
  color: var(--accent-primary);
}

.sort-select {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.sort-select:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.sort-select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 1px solid var(--border-primary);
  padding: 2rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  border-color: var(--accent-primary);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-icon {
  font-size: 3rem;
  color: var(--accent-primary);
  filter: drop-shadow(0 0 15px var(--accent-glow));
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.stat-label {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.rotating {
  animation: rotate 1s linear infinite;
  font-size: 2rem;
  color: var(--accent-primary);
  filter: drop-shadow(0 0 10px var(--accent-glow));
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.empty-icon {
  font-size: 5rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.125rem;
  font-weight: 500;
}

.material-section {
  margin-bottom: 4rem;
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid;
  border-image: linear-gradient(90deg, var(--accent-primary), transparent) 1;
}

.material-header h3 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.material-stats {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 600;
  background: var(--bg-tertiary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.spool-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: visible;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  align-self: flex-start;
}

.spool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--radius-lg);
  padding: 1px;
  background: linear-gradient(135deg, var(--accent-primary), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 1;
}

.spool-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
}

.spool-card:hover::before {
  opacity: 1;
}

.spool-card-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.spool-color {
  width: 4rem;
  min-width: 4rem;
  position: relative;
  box-shadow: inset -10px 0 20px rgba(0, 0, 0, 0.3);
}

.spool-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spool-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.spool-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.spool-info-compact {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.spool-text-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.spool-weight-compact {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-left: auto;
}

.spool-count-display {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-left: auto;
  background: var(--bg-tertiary);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.spool-count-icon {
  font-size: 1.5rem;
  color: var(--accent-primary);
}

.spool-count-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.spool-info {
  flex: 1;
  min-width: 0;
}

.spool-name {
  font-size: 1.125rem;
  margin: 0;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.spool-manufacturer {
  color: var(--accent-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  margin: 0 0 0.125rem;
}

.spool-color-name {
  color: var(--text-tertiary);
  font-weight: 500;
  margin: 0;
  font-size: 0.8125rem;
}

.spool-number {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
  background: var(--bg-tertiary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.spool-weight {
  flex-shrink: 0;
}

.weight-bar-container {
  height: 5px;
  background-color: var(--bg-tertiary);
  border-radius: 2.5px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.weight-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px var(--accent-glow);
  position: relative;
}

.weight-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(255, 255, 255, 0.3), transparent);
}

.weight-text {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.spool-details {
  display: flex;
  gap: 0.625rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
  flex-wrap: wrap;
}

.spool-details span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--bg-tertiary);
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.detail-icon {
  font-size: 1rem;
  color: var(--accent-primary);
}

.spool-actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  position: relative;
  z-index: 10;
}

.btn-icon:hover {
  background: var(--bg-elevated);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-icon-danger:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-icon .material-symbols-outlined {
  font-size: 1.125rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  min-height: 2rem;
  flex: 1;
}

/* Expandable spools section */
.expanded-spools {
  margin-top: 1rem;
  animation: slideDown 0.3s ease-out;
  position: relative;
  z-index: 10;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: scaleY(0);
    transform-origin: top;
  }
  to {
    opacity: 1;
    transform: scaleY(1);
    transform-origin: top;
  }
}

.spools-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-primary), transparent);
  margin-bottom: 0.75rem;
}

.individual-spool {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.individual-spool:last-child {
  margin-bottom: 0;
}

.individual-spool:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-primary);
  transform: translateX(4px);
}

.individual-spool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.spool-number-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.individual-spool-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.btn-icon-small:hover {
  background: var(--bg-elevated);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  transform: scale(1.1);
}

.btn-icon-small.btn-icon-danger:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-icon-small .material-symbols-outlined {
  font-size: 1rem;
}

.individual-spool-weight {
  margin-bottom: 0.5rem;
}

.weight-bar-container-small {
  height: 4px;
  background-color: var(--bg-secondary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.375rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.weight-text-small {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.individual-spool-location {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.detail-icon-small {
  font-size: 0.875rem;
  color: var(--accent-primary);
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .sort-control {
    width: 100%;
  }

  .sort-select {
    flex: 1;
  }

  .material-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
