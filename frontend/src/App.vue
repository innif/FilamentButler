<template>
  <div id="app">
    <header class="app-bar">
      <div class="container">
        <div class="app-bar-content">
          <div class="logo">
            <span class="material-symbols-outlined">view_in_ar</span>
            <h1>Filament Butler</h1>
          </div>
          <nav class="nav">
            <router-link to="/" class="nav-link">
              <span class="material-symbols-outlined">library_books</span>
              <span>Bibliothek</span>
            </router-link>
            <router-link to="/filament-types" class="nav-link">
              <span class="material-symbols-outlined">category</span>
              <span>Filament-Arten</span>
            </router-link>
            <router-link to="/add-spool" class="nav-link">
              <span class="material-symbols-outlined">add_circle</span>
              <span>Spule hinzufügen</span>
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 Filament Butler</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.app-bar {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.app-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 4.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.02);
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-primary), var(--text-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo .material-symbols-outlined {
  font-size: 2rem;
  color: var(--accent-primary);
  filter: drop-shadow(0 0 10px var(--accent-glow));
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link .material-symbols-outlined {
  font-size: 1.25rem;
}

.nav-link:hover {
  background-color: var(--bg-tertiary);
  color: var(--accent-primary);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
  color: var(--accent-primary);
  box-shadow: var(--shadow-sm);
}

.nav-link.router-link-active::before {
  transform: scaleX(1);
}

.main {
  min-height: calc(100vh - 10rem);
  padding: 2.5rem 0;
}

.footer {
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.8));
  border-top: 1px solid var(--border-primary);
  color: var(--text-tertiary);
  padding: 2rem 0;
  text-align: center;
  margin-top: 4rem;
  backdrop-filter: blur(10px);
}

.footer p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .nav {
    gap: 0.25rem;
  }

  .nav-link span:not(.material-symbols-outlined) {
    display: none;
  }

  .nav-link {
    padding: 0.625rem;
  }

  .logo h1 {
    font-size: 1.25rem;
  }
}
</style>
