/**
 * PSA BDP Project Management - Main Application
 */

const App = {
  currentProject: null,
  currentSection: 'cover',
  modules: {},
  
  async init() {
    // Initialize database
    await DB.init();
    
    // Initialize UI
    this.initTheme();
    this.initNavigation();
    this.initModals();
    this.initProjectSelector();
    this.initGlobalSearch();
    
    // Show changelog if new version
    this.showChangelogIfNeeded();
    
    // Show project selector
    this.showProjectSelector();
    
    // Register service worker
    this.registerSW();
    
    console.log('App initialized');
  },

  // Theme management
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set initial icon based on theme
    const icon = savedTheme === 'light' ? 'sun' : 'moon';
    const label = savedTheme === 'light' ? 'Modo Oscuro' : 'Modo Claro';
    
    // Update project selector theme button
    const selectorBtn = document.getElementById('btn-theme-selector');
    if (selectorBtn) {
      selectorBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
    }
    
    // Update sidebar theme button
    const sidebarBtn = document.getElementById('btn-theme-toggle');
    if (sidebarBtn) {
      sidebarBtn.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
    }
    
    // Set initial logo
    const logoImg = document.getElementById('project-selector-logo');
    if (logoImg) {
      logoImg.src = savedTheme === 'light' ? 'img/logo-psa-bdp.svg' : 'img/logo-psa-bdp-white.svg';
    }
    
    document.getElementById('btn-theme-selector')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    
    // Update theme toggle buttons
    const icon = next === 'light' ? 'sun' : 'moon';
    const label = next === 'light' ? 'Modo Oscuro' : 'Modo Claro';
    
    // Update project selector theme button
    const selectorBtn = document.getElementById('btn-theme-selector');
    if (selectorBtn) {
      selectorBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
    }
    
    // Update sidebar theme button
    const sidebarBtn = document.getElementById('btn-theme-toggle');
    if (sidebarBtn) {
      sidebarBtn.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
    }
    
    // Update project selector logo
    const logoImg = document.getElementById('project-selector-logo');
    if (logoImg) {
      logoImg.src = next === 'light' ? 'img/logo-psa-bdp.svg' : 'img/logo-psa-bdp-white.svg';
    }
    
    // Update icons
    lucide.createIcons();
  },

  // Navigation
  initNavigation() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    // Mobile menu
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const overlay = document.getElementById('mobile-overlay');
    
    mobileToggle?.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });

    // Section navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.navigateTo(section);
      });
    });

    // Back to projects
    document.getElementById('btn-back-projects')?.addEventListener('click', () => {
      this.showProjectSelector();
    });

    // Topbar back
    document.getElementById('btn-topbar-projects')?.addEventListener('click', () => {
      this.showProjectSelector();
    });
  },

  navigateTo(section) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Show section
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update title
    const titles = {
      dashboard: 'Dashboard del Proyecto',
      cover: 'Cover Page',
      scope: 'Scope & Requisitos',
      kickoff: 'Kick-off Template',
      plan: 'Project Plan',
      psr: 'PSR - Project Status Report',
      oil: 'Open Items - Action Tracker',
      uat: 'UAT Test Tracker',
      vacation: 'Vacation Coverage',
      participants: 'Participantes',
      finance: 'Cost Management',
      email: 'Email Reporting'
    };
    
    document.getElementById('section-title').textContent = titles[section] || section;
    this.currentSection = section;
    
    // Re-initialize icons
    lucide.createIcons();

    // Mobile: close sidebar
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('mobile-overlay').classList.remove('active');
    }

    // Load section data
    this.loadSection(section);
    
    // Re-render icons
    lucide.createIcons();
  },

  loadSection(section) {
    switch (section) {
      case 'dashboard':
        DashboardModule.load();
        break;
      case 'cover':
        CoverModule.load();
        break;
      case 'scope':
        ScopeModule.load();
        break;
      case 'kickoff':
        KickoffModule.load();
        break;
      case 'plan':
        PlanModule.load();
        break;
      case 'psr':
        PsrModule.load();
        break;
      case 'oil':
        OilModule.load();
        break;
      case 'uat':
        UatModule.load();
        break;
      case 'vacation':
        VacationModule.load();
        break;
      case 'participants':
        ParticipantsModule.load();
        break;
      case 'finance':
        FinanceModule.load();
        break;
      case 'email':
        EmailModule.load();
        break;
    }
  },

  // Project Selector
  async showProjectSelector() {
    this.currentProject = null;
    document.getElementById('project-selector').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    
    await this.renderProjectList();
    lucide.createIcons();
  },

  async renderProjectList() {
    const projects = await DB.getAll(STORES.PROJECTS);
    const grid = document.getElementById('project-grid');
    const empty = document.getElementById('projects-empty');
    
    if (projects.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    // Sort by updatedAt desc
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    grid.innerHTML = projects.map(project => {
      const statusColors = {
        draft: 'badge-neutral',
        active: 'badge-success',
        'on-hold': 'badge-warning',
        completed: 'badge-info',
        cancelled: 'badge-danger'
      };
      
      const statusLabels = {
        draft: 'En preparación',
        active: 'Activo',
        'on-hold': 'En pausa',
        completed: 'Completado',
        cancelled: 'Cancelado'
      };

      const progress = project.progress || 0;
      
      return `
        <div class="project-card" data-id="${project.id}">
          <div class="project-card-header">
            <div>
              <div class="project-card-title">${this.escapeHtml(project.name || 'Sin nombre')}</div>
              <div class="project-card-meta">${this.escapeHtml(project.code || '')}</div>
            </div>
            <span class="badge ${statusColors[project.status] || 'badge-neutral'}">${statusLabels[project.status] || project.status}</span>
          </div>
          <div class="project-card-meta">
            <i data-lucide="building-2" style="width:14px;height:14px;"></i> ${this.escapeHtml(project.customer || 'Sin cliente')}
          </div>
          <div class="project-card-meta">
            <i data-lucide="calendar" style="width:14px;height:14px;"></i> ${project.startDate || 'Sin fecha'}
          </div>
          <div style="margin-top:0.75rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-tertiary);margin-bottom:0.25rem;">
              <span>Progreso</span>
              <span>${progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill ${progress >= 100 ? 'success' : progress >= 50 ? '' : 'warning'}" style="width: ${progress}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        this.openProject(parseInt(card.dataset.id));
      });
    });
  },

  initProjectSelector() {
    // New project button
    document.getElementById('btn-new-project')?.addEventListener('click', () => this.createProject());
    document.getElementById('btn-new-project-empty')?.addEventListener('click', () => this.createProject());

    // Import project
    document.getElementById('btn-import-project')?.addEventListener('click', () => this.importProject());

    // Export project
    document.getElementById('btn-export-project')?.addEventListener('click', () => this.exportCurrentProject());

    // Report button
    document.getElementById('btn-report')?.addEventListener('click', () => ReportModule.generate());
  },

  async createProject() {
    const name = await this.prompt('Nombre del proyecto:', '');
    if (!name || !name.trim()) return;

    const project = {
      name: name.trim(),
      code: '',
      status: 'draft',
      type: '',
      region: '',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const id = await DB.add(STORES.PROJECTS, project);
    
    // Initialize empty cover data
    await DB.put(STORES.COVER, {
      projectId: id,
      projectName: project.name,
      status: 'draft'
    });

    this.toast('Proyecto creado', 'success');
    await this.renderProjectList();
    
    // Auto-open the new project
    this.openProject(id);
  },

  async openProject(id) {
    this.currentProject = await DB.getById(STORES.PROJECTS, id);
    if (!this.currentProject) {
      this.toast('Proyecto no encontrado', 'error');
      return;
    }

    // Update project name in topbar
    document.getElementById('topbar-project-name').textContent = this.currentProject.name;

    // Show app
    document.getElementById('project-selector').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    // Navigate to cover page
    this.navigateTo('cover');
    lucide.createIcons();
  },

  async updateProject(data) {
    if (!this.currentProject) return;
    
    const updated = {
      ...this.currentProject,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await DB.put(STORES.PROJECTS, updated);
    this.currentProject = updated;
    
    // Update topbar
    if (data.name) {
      document.getElementById('topbar-project-name').textContent = data.name;
    }
  },

  async exportCurrentProject() {
    if (!this.currentProject) return;
    
    const data = await DB.exportProject(this.currentProject.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `psa-project-${this.currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.toast('Proyecto exportado', 'success');
  },

  async importProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.project || !data.data) {
          throw new Error('Formato inválido');
        }
        
        const newId = await DB.importProject(data);
        this.toast('Proyecto importado correctamente', 'success');
        await this.renderProjectList();
      } catch (err) {
        this.toast('Error al importar: ' + err.message, 'error');
      }
    };
    
    input.click();
  },

  // Global Search
  initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    
    searchInput?.addEventListener('input', async (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query || !this.currentProject) return;
      
      // Search in all project data
      const results = await this.searchProject(query);
      // Could show dropdown with results
    });
  },

  async searchProject(query) {
    const results = [];
    const projectId = this.currentProject.id;
    
    // Search in scope
    const scope = await DB.getAll(STORES.SCOPE, 'projectId', projectId);
    scope.forEach(item => {
      if (item.requirement?.toLowerCase().includes(query) || 
          item.comments?.toLowerCase().includes(query)) {
        results.push({ type: 'scope', item });
      }
    });
    
    // Search in OIL
    const oil = await DB.getAll(STORES.OIL, 'projectId', projectId);
    oil.forEach(item => {
      if (item.description?.toLowerCase().includes(query) || 
          item.comments?.toLowerCase().includes(query)) {
        results.push({ type: 'oil', item });
      }
    });
    
    // Search in tasks
    const tasks = await DB.getAll(STORES.TASKS, 'projectId', projectId);
    tasks.forEach(item => {
      if (item.name?.toLowerCase().includes(query)) {
        results.push({ type: 'task', item });
      }
    });
    
    return results;
  },

  // Modal System
  initModals() {
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
    
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    
    // Prevent clicks inside modal from closing it
    modal?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Only close when clicking directly on overlay
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeModal();
      }
    });
    
    // Handle touch events for mobile
    let touchStartY = 0;
    modal?.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    modal?.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      // Prevent closing when scrolling inside modal (swipe up/down less than 100px)
      if (Math.abs(diff) < 100) {
        e.stopPropagation();
      }
    }, { passive: true });
  },

  openModal(title, content, onConfirm, options = {}) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    confirmBtn.textContent = options.confirmText || 'Guardar';
    cancelBtn.style.display = options.hideCancel ? 'none' : 'inline-flex';
    
    // Remove old listeners
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    
    newConfirm.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      if (!options.keepOpen) this.closeModal();
    });
    
    newCancel.addEventListener('click', () => this.closeModal());
    
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('modal').className = `modal ${options.size || ''}`;
    
    lucide.createIcons();
    
    // Focus first input (but not on mobile to avoid keyboard issues)
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) {
      const firstInput = document.querySelector('#modal-body input:not([type=number]), #modal-body textarea, #modal-body select');
      firstInput?.focus();
    }
    
    // Add click prevention to modal body
    const modalBody = document.getElementById('modal-body');
    modalBody?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  // Prompt helper
  prompt(message, defaultValue = '') {
    return new Promise(resolve => {
      const content = `
        <div class="form-group">
          <label class="form-label">${this.escapeHtml(message)}</label>
          <input type="text" class="form-control" id="prompt-input" value="${this.escapeHtml(defaultValue)}">
        </div>
      `;
      
      this.openModal('Confirmar', content, () => {
        const value = document.getElementById('prompt-input').value.trim();
        resolve(value);
      });
    });
  },

  confirm(message) {
    return new Promise(resolve => {
      this.openModal('Confirmar', `<p>${this.escapeHtml(message)}</p>`, () => {
        resolve(true);
      }, { confirmText: 'Sí', hideCancel: false });
      
      document.getElementById('modal-cancel').onclick = () => {
        this.closeModal();
        resolve(false);
      };
    });
  },

  // Toast notifications
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };
    
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}"></i>
      <span>${this.escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Utility: escape HTML
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Utility: format date
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  // Utility: days between dates
  daysBetween(start, end) {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  },

  // Changelog
  showChangelogIfNeeded() {
    const currentVersion = '1.1.0';
    const lastVersion = localStorage.getItem('appVersion');
    
    if (lastVersion === currentVersion) return;
    
    const changelog = {
      'es': {
        title: 'Novedades de la versión 1.1.0',
        items: [
          'Nuevo módulo de Vendors para gestionar proveedores (carriers, brokers, etc.)',
          'Nuevo módulo de Budget para control de presupuesto vs gastos reales',
          'Nuevo módulo de Expenses para seguimiento de gastos del proyecto',
          'Nuevo Dashboard del proyecto con resumen de participantes y estadísticas',
          'El tema oscuro/claro ahora funciona también en la pantalla de inicio',
          'Mejoras en el PSR: indicadores de salud con botones de colores y comentarios',
          'El Vacation Planner ahora usa los participantes del proyecto',
          'Logo oficial de PSA BDP actualizado'
        ]
      },
      'en': {
        title: "What's new in version 1.1.0",
        items: [
          'New Vendors module to manage suppliers (carriers, brokers, etc.)',
          'New Budget module for budget vs actual cost tracking',
          'New Expenses module for project expense tracking',
          'New Project Dashboard with participants summary and stats',
          'Dark/light theme now works on the home screen',
          'PSR improvements: health indicators with color buttons and comments',
          'Vacation Planner now uses project participants',
          'Updated official PSA BDP logo'
        ]
      }
    };
    
    // Detect language (default to Spanish)
    const lang = navigator.language?.startsWith('es') ? 'es' : 'en';
    const content = changelog[lang];
    
    const html = `
      <div style="max-height: 60vh; overflow-y: auto;">
        <h3 style="margin-bottom: 1rem; color: var(--primary);">${content.title}</h3>
        <ul style="padding-left: 1.5rem; line-height: 1.8;">
          ${content.items.map(item => `<li style="margin-bottom: 0.5rem;">${item}</li>`).join('')}
        </ul>
      </div>
    `;
    
    // Show modal with a slight delay to not block initial render
    setTimeout(() => {
      this.openModal(content.title, html, () => {
        localStorage.setItem('appVersion', currentVersion);
      });
    }, 500);
  },

  // Service Worker
  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW registration failed'));
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
