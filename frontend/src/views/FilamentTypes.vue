<template>
  <div class="filament-types">
    <div class="header">
      <h1>Filament-Arten</h1>
      <button @click="showAddModal = true" class="btn btn-primary btn-add">
        <span class="material-symbols-outlined">add</span>
        <span>Neue Filament-Art</span>
      </button>
    </div>

    <div v-if="loading" class="loading">Laden...</div>
    <div v-else-if="error" class="error">Fehler: {{ error }}</div>

    <div v-else class="types-grid">
      <div
        v-for="type in filamentTypes"
        :key="type.id"
        class="type-card"
        @click="goToTypeDetail(type.id)"
      >
        <div class="type-header">
          <div
            class="color-preview"
            :style="type.color2
              ? { background: `linear-gradient(135deg, ${type.colorHex} 0%, ${type.colorHex2} 100%)` }
              : { backgroundColor: type.colorHex }
            "
          ></div>
          <div class="type-info">
            <h3>{{ type.name }}</h3>
            <p class="manufacturer">{{ type.manufacturer }}</p>
          </div>
        </div>

        <div class="type-details">
          <div class="detail-item">
            <span class="label">Material:</span>
            <span class="value">{{ type.material }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Farbe:</span>
            <span class="value">{{ type.color2 ? `${type.color} / ${type.color2}` : type.color }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Durchmesser:</span>
            <span class="value">{{ type.diameter }} mm</span>
          </div>
          <div class="detail-item">
            <span class="label">Spulen:</span>
            <span class="value spool-count">{{ type.spoolCount || 0 }}</span>
          </div>
        </div>

        <div class="type-actions">
          <button @click.stop="editType(type)" class="btn-edit">Bearbeiten</button>
          <button @click.stop="deleteType(type)" class="btn-delete">Löschen</button>
        </div>
      </div>
    </div>

    <div v-if="showAddModal || editingType" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h2>{{ editingType ? 'Filament-Art bearbeiten' : 'Neue Filament-Art' }}</h2>

        <form @submit.prevent="saveType">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="formData.name" required type="text" placeholder="z.B. PLA Basic">
          </div>

          <div class="form-group">
            <label>Hersteller *</label>
            <input v-model="formData.manufacturer" required type="text" placeholder="z.B. Prusament">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Material *</label>
              <select v-model="formData.material" required>
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
                <option value="Nylon">Nylon</option>
                <option value="ASA">ASA</option>
                <option value="PC">PC</option>
              </select>
            </div>

            <div class="form-group">
              <label>Durchmesser (mm) *</label>
              <input v-model.number="formData.diameter" required type="number" step="0.01" placeholder="1.75">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Farbe *</label>
              <input v-model="formData.color" required type="text" placeholder="z.B. Rot">
            </div>

            <div class="form-group">
              <label>Farbcode</label>
              <input v-model="formData.colorHex" type="color">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>2. Farbe (optional)</label>
              <input v-model="formData.color2" type="text" placeholder="z.B. Blau">
            </div>

            <div class="form-group">
              <label>2. Farbcode</label>
              <input v-model="formData.colorHex2" type="color">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Standard-Gewicht (g)</label>
              <input v-model.number="formData.standardWeight" type="number" placeholder="1000">
            </div>

            <div class="form-group">
              <label>Standard-Preis (€)</label>
              <input v-model.number="formData.standardPrice" type="number" step="0.01" placeholder="25.00">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Druck-Temperatur (°C)</label>
              <input v-model.number="formData.printTemperature" type="number" placeholder="210">
            </div>

            <div class="form-group">
              <label>Bett-Temperatur (°C)</label>
              <input v-model.number="formData.bedTemperature" type="number" placeholder="60">
            </div>
          </div>

          <div class="form-group">
            <label>Notizen</label>
            <textarea v-model="formData.notes" rows="3" placeholder="Zusätzliche Informationen..."></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useFilamentTypeStore } from '../stores/filamentTypeStore'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'FilamentTypes',
  setup() {
    const store = useFilamentTypeStore()
    const router = useRouter()

    const showAddModal = ref(false)
    const editingType = ref(null)

    const formData = ref({
      name: '',
      manufacturer: '',
      material: 'PLA',
      color: '',
      colorHex: '#000000',
      color2: '',
      colorHex2: '#000000',
      diameter: 1.75,
      standardWeight: null,
      standardPrice: null,
      printTemperature: null,
      bedTemperature: null,
      notes: ''
    })

    const loading = computed(() => store.loading)
    const error = computed(() => store.error)
    const filamentTypes = computed(() => store.filamentTypes)

    const resetForm = () => {
      formData.value = {
        name: '',
        manufacturer: '',
        material: 'PLA',
        color: '',
        colorHex: '#000000',
        color2: '',
        colorHex2: '#000000',
        diameter: 1.75,
        standardWeight: null,
        standardPrice: null,
        printTemperature: null,
        bedTemperature: null,
        notes: ''
      }
    }

    const closeModal = () => {
      showAddModal.value = false
      editingType.value = null
      resetForm()
    }

    const editType = (type) => {
      editingType.value = type
      formData.value = { ...type }
    }

    const saveType = async () => {
      try {
        if (editingType.value) {
          await store.updateFilamentType(editingType.value.id, formData.value)
        } else {
          await store.createFilamentType(formData.value)
        }
        closeModal()
      } catch (error) {
        alert('Fehler beim Speichern: ' + error.message)
      }
    }

    const deleteType = async (type) => {
      const spoolCount = type.spoolCount || 0
      const message = spoolCount > 0
        ? `Wirklich löschen? Dies wird auch ${spoolCount} Spule(n) löschen!`
        : 'Wirklich löschen?'

      if (confirm(message)) {
        try {
          await store.deleteFilamentType(type.id)
        } catch (error) {
          alert('Fehler beim Löschen: ' + error.message)
        }
      }
    }

    const goToTypeDetail = (id) => {
      router.push(`/filament-types/${id}`)
    }

    onMounted(() => {
      store.fetchFilamentTypes()
    })

    return {
      loading,
      error,
      filamentTypes,
      showAddModal,
      editingType,
      formData,
      closeModal,
      editType,
      saveType,
      deleteType,
      goToTypeDetail
    }
  }
}
</script>

<style scoped>
.filament-types {
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.btn-add {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: none;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-add .material-symbols-outlined {
  font-size: 1.5rem;
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.btn-add:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl), 0 0 40px var(--accent-glow);
}

.btn-add:active {
  transform: translateY(-1px) scale(1);
}

.loading, .error {
  text-align: center;
  padding: 4rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.loading {
  color: var(--text-secondary);
}

.error {
  color: var(--danger-primary);
  background: var(--danger-bg);
  border: 1px solid var(--danger-primary);
  border-radius: var(--radius-lg);
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.type-card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.type-card::before {
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

.type-card:hover {
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  transform: translateY(-4px);
  border-color: var(--accent-primary);
}

.type-card:hover::before {
  transform: scaleX(1);
}

.type-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}

.color-preview {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: 3px solid var(--border-secondary);
  margin-right: 1rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-md), inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.type-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.manufacturer {
  margin: 0;
  color: var(--accent-primary);
  font-size: 0.875rem;
  font-weight: 600;
}

.type-details {
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

.spool-count {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.type-actions {
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 650px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl), 0 0 50px rgba(6, 182, 212, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-primary);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: 1rem;
  box-sizing: border-box;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.form-group input:hover,
.form-group select:hover,
.form-group textarea:hover {
  border-color: var(--border-secondary);
  background-color: var(--bg-elevated);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
  background-color: var(--bg-elevated);
}

.form-group input[type="color"] {
  height: 3rem;
  cursor: pointer;
  padding: 0.25rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
  justify-content: flex-end;
}

.form-actions .btn-secondary,
.form-actions .btn-primary {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  min-width: 120px;
  border-radius: var(--radius-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.form-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl), 0 0 30px var(--accent-glow);
}

.form-actions .btn-secondary:active,
.form-actions .btn-primary:active {
  transform: translateY(0);
}

/* Custom scrollbar for modal */
.modal::-webkit-scrollbar {
  width: 8px;
}

.modal::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.modal::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 4px;
}

.modal::-webkit-scrollbar-thumb:hover {
  background: var(--accent-secondary);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header h1 {
    font-size: 2rem;
    text-align: center;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .modal {
    width: 95%;
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .form-actions .btn-secondary,
  .form-actions .btn-primary {
    width: 100%;
    min-width: unset;
  }
}
</style>
