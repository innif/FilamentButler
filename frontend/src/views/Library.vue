<template>
  <div class="library">
    <div class="header-section">
      <h2>Bibliothek</h2>
      <router-link to="/add-spool" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        Neue Spule
      </router-link>
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
      <div v-for="(data, material) in spoolStore.spoolsByMaterial" :key="material" class="material-section">
        <div class="material-header">
          <h3>{{ material }}</h3>
          <span class="material-stats">
            {{ data.count }} Spulen · {{ (data.totalWeight / 1000).toFixed(2) }} kg
          </span>
        </div>

        <div class="grid grid-cols-3">
          <div v-for="spool in data.spools" :key="spool.id" class="spool-card">
            <div class="spool-card-layout">
              <div class="spool-color" :style="{ backgroundColor: (spool.filamentType || spool.FilamentType)?.colorHex || '#cccccc' }"></div>

              <div class="spool-content">
                <div class="spool-header">
                  <div class="spool-info">
                    <h4 class="spool-name">{{ (spool.filamentType || spool.FilamentType)?.name || 'Unbekannt' }}</h4>
                    <p class="spool-manufacturer" v-if="(spool.filamentType || spool.FilamentType)?.manufacturer">{{ (spool.filamentType || spool.FilamentType).manufacturer }}</p>
                    <p class="spool-color-name">{{ (spool.filamentType || spool.FilamentType)?.color || '' }}</p>
                  </div>
                  <div class="spool-actions">
                    <router-link :to="`/edit-spool/${spool.id}`" class="btn-icon" title="Bearbeiten">
                      <span class="material-symbols-outlined">edit</span>
                    </router-link>
                    <button @click="confirmDelete(spool)" class="btn-icon btn-icon-danger" title="Löschen">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                <div class="spool-weight">
                  <div class="weight-bar-container">
                    <div
                      class="weight-bar"
                      :style="{ width: (spool.remainingWeight / spool.weight * 100) + '%' }"
                    ></div>
                  </div>
                  <div class="weight-text">
                    {{ spool.remainingWeight }}g / {{ spool.weight }}g
                    ({{ ((spool.remainingWeight / spool.weight) * 100).toFixed(0) }}%)
                  </div>
                </div>

                <div class="spool-details">
                  <span v-if="spool.location">
                    <span class="material-symbols-outlined detail-icon">location_on</span>
                    {{ spool.location }}
                  </span>
                  <span v-if="spool.spoolNumber" class="spool-number">
                    #{{ spool.spoolNumber }}
                  </span>
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
import { onMounted } from 'vue'

export default {
  name: 'Library',
  setup() {
    const spoolStore = useSpoolStore()

    onMounted(() => {
      spoolStore.fetchSpools()
    })

    const confirmDelete = async (spool) => {
      if (confirm(`Möchtest du die Spule "${spool.name}" wirklich löschen?`)) {
        try {
          await spoolStore.deleteSpool(spool.id)
        } catch (error) {
          alert('Fehler beim Löschen der Spule')
        }
      }
    }

    return {
      spoolStore,
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
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
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
  gap: 0.75rem;
}

.spool-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.spool-info {
  flex: 1;
  min-width: 0;
}

.spool-name {
  font-size: 1.125rem;
  margin: 0 0 0.25rem;
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

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .material-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
