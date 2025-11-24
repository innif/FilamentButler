<template>
  <div class="add-spool">
    <div class="header">
      <h2>Neue Spule hinzufügen</h2>
      <button @click="goBack" class="btn-back">← Zurück</button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="card">
      <div class="form-group">
        <label class="form-label">Filament-Art auswählen *</label>
        <select v-model.number="form.filamentTypeId" class="form-select" required @change="onFilamentTypeChange">
          <option :value="null" disabled>-- Bitte auswählen --</option>
          <option v-for="type in filamentTypes" :key="type.id" :value="type.id">
            {{ type.manufacturer }} - {{ type.name }} ({{ type.material }}, {{ type.color }})
          </option>
        </select>
        <p class="form-help">
          Keine passende Filament-Art vorhanden?
          <router-link to="/filament-types">Neue Filament-Art anlegen</router-link>
        </p>
      </div>

      <div v-if="selectedType" class="selected-type-info">
        <h3>Ausgewählte Filament-Art:</h3>
        <div class="type-preview">
          <div class="color-preview" :style="{ backgroundColor: selectedType.colorHex }"></div>
          <div class="type-details">
            <p><strong>{{ selectedType.manufacturer }} - {{ selectedType.name }}</strong></p>
            <p>{{ selectedType.material }}, {{ selectedType.color }}, {{ selectedType.diameter }}mm</p>
            <p v-if="selectedType.printTemperature">
              Druck: {{ selectedType.printTemperature }}°C
              <span v-if="selectedType.bedTemperature">| Bett: {{ selectedType.bedTemperature }}°C</span>
            </p>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Spulen-Details</h3>

        <div class="form-group">
          <label class="form-label">Spulennummer (optional)</label>
          <input
            v-model="form.spoolNumber"
            type="text"
            class="form-input"
            placeholder="z.B. A-123 oder Spule 1"
          >
        </div>

        <div class="grid grid-cols-2">
          <div class="form-group">
            <label class="form-label">Anfangsgewicht (g) *</label>
            <input
              v-model.number="form.weight"
              type="number"
              class="form-input"
              required
              min="0"
              step="1"
              placeholder="1000"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Verbleibendes Gewicht (g) *</label>
            <input
              v-model.number="form.remainingWeight"
              type="number"
              class="form-input"
              required
              min="0"
              step="1"
              placeholder="1000"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Preis (€)</label>
            <input
              v-model.number="form.price"
              type="number"
              class="form-input"
              min="0"
              step="0.01"
              placeholder="25.00"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Kaufdatum</label>
            <input
              v-model="form.purchaseDate"
              type="date"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Lagerort</label>
            <input
              v-model="form.location"
              type="text"
              class="form-input"
              placeholder="z.B. Regal 1, Box A"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <div class="checkbox-wrapper">
              <input
                v-model="form.isEmpty"
                type="checkbox"
                id="isEmpty"
              >
              <label for="isEmpty">Spule ist leer</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notizen</label>
          <textarea
            v-model="form.notes"
            class="form-textarea"
            rows="3"
            placeholder="Zusätzliche Informationen zu dieser Spule..."
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="goBack" class="btn btn-secondary">
          Abbrechen
        </button>
        <button type="submit" class="btn btn-primary" :disabled="spoolStore.loading || !form.filamentTypeId">
          {{ spoolStore.loading ? 'Speichere...' : 'Spule speichern' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSpoolStore } from '../stores/spoolStore'
import { useFilamentTypeStore } from '../stores/filamentTypeStore'

export default {
  name: 'AddSpoolNew',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const spoolStore = useSpoolStore()
    const typeStore = useFilamentTypeStore()

    const form = ref({
      filamentTypeId: null,
      spoolNumber: '',
      weight: 1000,
      remainingWeight: 1000,
      price: null,
      purchaseDate: null,
      location: '',
      notes: '',
      isEmpty: false
    })

    const successMessage = ref('')
    const errorMessage = ref('')

    const filamentTypes = computed(() => typeStore.filamentTypes)

    const selectedType = computed(() => {
      if (!form.value.filamentTypeId) return null
      return typeStore.getTypeById(form.value.filamentTypeId)
    })

    const onFilamentTypeChange = () => {
      const type = selectedType.value
      if (type && type.standardWeight) {
        form.value.weight = type.standardWeight
        form.value.remainingWeight = type.standardWeight
      }
      if (type && type.standardPrice) {
        form.value.price = type.standardPrice
      }
    }

    const handleSubmit = async () => {
      successMessage.value = ''
      errorMessage.value = ''

      try {
        await spoolStore.createSpool(form.value)
        successMessage.value = 'Spule erfolgreich hinzugefügt!'

        setTimeout(() => {
          if (form.value.filamentTypeId) {
            router.push(`/filament-types/${form.value.filamentTypeId}`)
          } else {
            router.push('/')
          }
        }, 1000)
      } catch (error) {
        errorMessage.value = 'Fehler beim Speichern: ' + error.message
      }
    }

    const goBack = () => {
      router.back()
    }

    onMounted(async () => {
      await typeStore.fetchFilamentTypes()

      // Check if filamentTypeId is passed as query parameter
      const typeId = route.query.filamentTypeId
      if (typeId) {
        form.value.filamentTypeId = parseInt(typeId)
        onFilamentTypeChange()
      }
    })

    return {
      form,
      spoolStore,
      typeStore,
      filamentTypes,
      selectedType,
      successMessage,
      errorMessage,
      handleSubmit,
      goBack,
      onFilamentTypeChange
    }
  }
}
</script>

<style scoped>
.add-spool {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.alert {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.alert-success {
  background: linear-gradient(135deg, var(--success-primary), #059669);
  color: white;
  border: 1px solid var(--success-primary);
}

.alert-error {
  background: linear-gradient(135deg, var(--danger-primary), var(--danger-secondary));
  color: white;
  border: 1px solid var(--danger-primary);
}

.card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.form-input,
.form-select,
.form-textarea {
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

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: var(--border-secondary);
  background-color: var(--bg-elevated);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
  background-color: var(--bg-elevated);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-help {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.form-help a {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.form-help a:hover {
  color: var(--accent-secondary);
  text-decoration: underline;
}

.selected-type-info {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}

.selected-type-info h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.type-preview {
  display: flex;
  align-items: center;
}

.color-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid var(--border-secondary);
  margin-right: 1rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm), inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.type-details p {
  margin: 0.375rem 0;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.type-details strong {
  font-weight: 700;
  color: var(--text-primary);
}

.form-section {
  margin-top: 2rem;
}

.form-section h3 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent-primary);
  padding-bottom: 0.75rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-2 {
  grid-template-columns: 1fr 1fr;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding-top: 0.5rem;
}

.checkbox-wrapper input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
  cursor: pointer;
  accent-color: var(--accent-primary);
}

.checkbox-wrapper label {
  cursor: pointer;
  margin: 0;
  font-weight: 500;
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.btn {
  padding: 0.875rem 2rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl), 0 0 30px var(--accent-glow);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary));
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header h2 {
    text-align: center;
    font-size: 1.75rem;
  }

  .btn-back {
    width: 100%;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .form-actions .btn {
    width: 100%;
    min-width: unset;
  }
}
</style>
