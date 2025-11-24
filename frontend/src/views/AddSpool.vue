<template>
  <div class="add-spool">
    <h2>Neue Spule</h2>

    <div v-if="successMessage" class="alert alert-success">
      <span class="material-symbols-outlined">check_circle</span>
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      <span class="material-symbols-outlined">error</span>
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="card">
      <div class="grid grid-cols-2">
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            required
            placeholder="z.B. Premium PLA Rot"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Hersteller</label>
          <input
            v-model="form.manufacturer"
            type="text"
            class="form-input"
            placeholder="z.B. Prusa, eSun"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Material *</label>
          <select v-model="form.material" class="form-select" required>
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="ABS">ABS</option>
            <option value="TPU">TPU</option>
            <option value="Nylon">Nylon</option>
            <option value="ASA">ASA</option>
            <option value="PC">PC (Polycarbonat)</option>
            <option value="Other">Sonstiges</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Farbe *</label>
          <input
            v-model="form.color"
            type="text"
            class="form-input"
            required
            placeholder="z.B. Rot, Blau, Schwarz"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Farbcode (Hex)</label>
          <div style="display: flex; gap: 0.5rem;">
            <input
              v-model="form.colorHex"
              type="text"
              class="form-input"
              placeholder="#FF0000"
              pattern="^#[0-9A-Fa-f]{6}$"
            >
            <input
              v-model="form.colorHex"
              type="color"
              style="width: 60px; padding: 0.25rem; cursor: pointer;"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Durchmesser (mm) *</label>
          <select v-model.number="form.diameter" class="form-select" required>
            <option :value="1.75">1.75mm</option>
            <option :value="2.85">2.85mm</option>
            <option :value="3.0">3.00mm</option>
          </select>
        </div>

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
          <label class="form-label">Preis</label>
          <input
            v-model.number="form.price"
            type="number"
            class="form-input"
            min="0"
            step="0.01"
            placeholder="25.99"
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
      </div>

      <div class="form-group">
        <label class="form-label">Notizen</label>
        <textarea
          v-model="form.notes"
          class="form-textarea"
          placeholder="Zusätzliche Informationen..."
        ></textarea>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
        <router-link to="/" class="btn btn-secondary">
          <span class="material-symbols-outlined">close</span>
          Abbrechen
        </router-link>
        <button type="submit" class="btn btn-primary" :disabled="spoolStore.loading">
          <span class="material-symbols-outlined">save</span>
          {{ spoolStore.loading ? 'Speichere...' : 'Speichern' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSpoolStore } from '../stores/spoolStore'

export default {
  name: 'AddSpool',
  setup() {
    const router = useRouter()
    const spoolStore = useSpoolStore()

    const form = ref({
      name: '',
      manufacturer: '',
      material: 'PLA',
      color: '',
      colorHex: '#000000',
      weight: 1000,
      remainingWeight: 1000,
      diameter: 1.75,
      price: null,
      purchaseDate: null,
      notes: '',
      location: ''
    })

    const successMessage = ref('')
    const errorMessage = ref('')

    const handleSubmit = async () => {
      successMessage.value = ''
      errorMessage.value = ''

      try {
        await spoolStore.createSpool(form.value)
        successMessage.value = 'Spule erfolgreich hinzugefügt!'

        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (error) {
        errorMessage.value = 'Fehler beim Speichern der Spule. Bitte versuche es erneut.'
      }
    }

    return {
      form,
      spoolStore,
      successMessage,
      errorMessage,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.add-spool {
  max-width: 900px;
  margin: 0 auto;
}

.add-spool h2 {
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
