<template>
  <div class="filament-type-detail">
    <div v-if="loading" class="loading">Laden...</div>
    <div v-else-if="error" class="error">Fehler: {{ error }}</div>

    <div v-else-if="filamentType">
      <div class="header">
        <button @click="goBack" class="btn-back">← Zurück</button>
        <button @click="addSpool" class="btn-primary">+ Spule hinzufügen</button>
      </div>

      <div class="type-info-card">
        <div class="type-header">
          <div class="color-preview" :style="{ backgroundColor: filamentType.colorHex }"></div>
          <div>
            <h1>{{ filamentType.name }}</h1>
            <p class="manufacturer">{{ filamentType.manufacturer }}</p>
          </div>
        </div>

        <div class="type-specs">
          <div class="spec-item">
            <span class="label">Material</span>
            <span class="value">{{ filamentType.material }}</span>
          </div>
          <div class="spec-item">
            <span class="label">Farbe</span>
            <span class="value">{{ filamentType.color }}</span>
          </div>
          <div class="spec-item">
            <span class="label">Durchmesser</span>
            <span class="value">{{ filamentType.diameter }} mm</span>
          </div>
          <div class="spec-item" v-if="filamentType.standardWeight">
            <span class="label">Standard-Gewicht</span>
            <span class="value">{{ filamentType.standardWeight }} g</span>
          </div>
          <div class="spec-item" v-if="filamentType.standardPrice">
            <span class="label">Standard-Preis</span>
            <span class="value">{{ filamentType.standardPrice }} €</span>
          </div>
          <div class="spec-item" v-if="filamentType.printTemperature">
            <span class="label">Druck-Temperatur</span>
            <span class="value">{{ filamentType.printTemperature }} °C</span>
          </div>
          <div class="spec-item" v-if="filamentType.bedTemperature">
            <span class="label">Bett-Temperatur</span>
            <span class="value">{{ filamentType.bedTemperature }} °C</span>
          </div>
        </div>

        <div v-if="filamentType.notes" class="type-notes">
          <h3>Notizen</h3>
          <p>{{ filamentType.notes }}</p>
        </div>
      </div>

      <div class="spools-section">
        <h2>Spulen ({{ spools.length }})</h2>

        <div class="spools-stats">
          <div class="stat-card">
            <div class="stat-value">{{ activeSpoolsCount }}</div>
            <div class="stat-label">Aktive Spulen</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ totalRemainingWeight }} g</div>
            <div class="stat-label">Verbleibendes Gewicht</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ emptySpoolsCount }}</div>
            <div class="stat-label">Leere Spulen</div>
          </div>
        </div>

        <div v-if="spools.length === 0" class="no-spools">
          <p>Noch keine Spulen für diese Filament-Art vorhanden.</p>
          <button @click="addSpool" class="btn-primary">Erste Spule hinzufügen</button>
        </div>

        <div v-else class="spools-grid">
          <div
            v-for="spool in spools"
            :key="spool.id"
            class="spool-card"
            :class="{ 'empty': spool.isEmpty }"
          >
            <div class="spool-header">
              <h3>{{ spool.spoolNumber || `Spule #${spool.id}` }}</h3>
              <span v-if="spool.isEmpty" class="badge-empty">Leer</span>
            </div>

            <div class="spool-details">
              <div class="detail-item">
                <span class="label">Gewicht:</span>
                <span class="value">{{ spool.remainingWeight }} / {{ spool.weight }} g</span>
              </div>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (spool.remainingWeight / spool.weight * 100) + '%' }"
                ></div>
              </div>

              <div class="detail-item" v-if="spool.location">
                <span class="label">Standort:</span>
                <span class="value">{{ spool.location }}</span>
              </div>

              <div class="detail-item" v-if="spool.price">
                <span class="label">Preis:</span>
                <span class="value">{{ spool.price }} €</span>
              </div>

              <div class="detail-item" v-if="spool.purchaseDate">
                <span class="label">Kaufdatum:</span>
                <span class="value">{{ formatDate(spool.purchaseDate) }}</span>
              </div>

              <div v-if="spool.notes" class="spool-notes">
                <span class="label">Notizen:</span>
                <p>{{ spool.notes }}</p>
              </div>
            </div>

            <div class="spool-actions">
              <button @click="editSpool(spool.id)" class="btn-edit">Bearbeiten</button>
              <button @click="deleteSpool(spool.id)" class="btn-delete">Löschen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useFilamentTypeStore } from '../stores/filamentTypeStore'
import { useSpoolStore } from '../stores/spoolStore'
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'FilamentTypeDetail',
  setup() {
    const typeStore = useFilamentTypeStore()
    const spoolStore = useSpoolStore()
    const route = useRoute()
    const router = useRouter()

    const filamentType = ref(null)
    const loading = ref(true)
    const error = ref(null)

    const typeId = computed(() => parseInt(route.params.id))

    const spools = computed(() =>
      spoolStore.spools.filter(s => s.filamentTypeId === typeId.value)
    )

    const activeSpoolsCount = computed(() =>
      spools.value.filter(s => !s.isEmpty).length
    )

    const emptySpoolsCount = computed(() =>
      spools.value.filter(s => s.isEmpty).length
    )

    const totalRemainingWeight = computed(() =>
      spools.value.reduce((sum, s) => sum + s.remainingWeight, 0)
    )

    const loadData = async () => {
      loading.value = true
      error.value = null
      try {
        filamentType.value = await typeStore.fetchFilamentType(typeId.value)
        await spoolStore.fetchSpools(typeId.value)
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('de-DE')
    }

    const goBack = () => {
      router.push('/filament-types')
    }

    const addSpool = () => {
      router.push(`/add-spool?filamentTypeId=${typeId.value}`)
    }

    const editSpool = (spoolId) => {
      router.push(`/edit-spool/${spoolId}`)
    }

    const deleteSpool = async (spoolId) => {
      if (confirm('Spule wirklich löschen?')) {
        try {
          await spoolStore.deleteSpool(spoolId)
        } catch (err) {
          alert('Fehler beim Löschen: ' + err.message)
        }
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      error,
      filamentType,
      spools,
      activeSpoolsCount,
      emptySpoolsCount,
      totalRemainingWeight,
      formatDate,
      goBack,
      addSpool,
      editSpool,
      deleteSpool
    }
  }
}
</script>

<style scoped>
.filament-type-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.error {
  color: var(--danger-primary);
  background: var(--danger-bg);
  border: 1px solid var(--danger-primary);
  border-radius: var(--radius-lg);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.btn-back {
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  padding: 0.875rem 1.75rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-back:hover {
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary));
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl), 0 0 30px var(--accent-glow);
}

.type-info-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.type-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.color-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--border-secondary);
  margin-right: 1.5rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-md), inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.type-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.manufacturer {
  margin: 0;
  color: var(--accent-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.type-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.spec-item .label {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.spec-item .value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.type-notes {
  border-top: 1px solid var(--border-primary);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.type-notes h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-weight: 600;
}

.type-notes p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.spools-section {
  margin-top: 2rem;
}

.spools-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.spools-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
}

.no-spools {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.no-spools p {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.spools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.spool-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.spool-card.empty {
  opacity: 0.6;
  background: var(--bg-tertiary);
}

.spool-card:hover {
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  transform: translateY(-4px);
  border-color: var(--accent-primary);
}

.spool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.spool-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-empty {
  background: linear-gradient(135deg, var(--danger-primary), var(--danger-secondary));
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.spool-details {
  border-top: 1px solid var(--border-primary);
  padding-top: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.625rem;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.detail-item .label {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
}

.detail-item .value {
  font-weight: 700;
  color: var(--text-primary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  margin: 0.75rem 0;
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-primary), #059669);
  transition: width 0.3s;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.spool-notes {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-primary);
}

.spool-notes .label {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
}

.spool-notes p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.spool-actions {
  display: flex;
  gap: 0.625rem;
}

.btn-edit {
  flex: 1;
  background: linear-gradient(135deg, var(--success-primary), #059669);
  color: white;
  border: none;
  padding: 0.625rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 0 20px rgba(16, 185, 129, 0.3);
}

.btn-delete {
  flex: 1;
  background: linear-gradient(135deg, var(--danger-primary), var(--danger-secondary));
  color: white;
  border: none;
  padding: 0.625rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 0 20px rgba(239, 68, 68, 0.3);
}
</style>
