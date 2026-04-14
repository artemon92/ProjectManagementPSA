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

    // Initialize i18n FIRST (before any UI rendering)
    I18n.init();

    // Initialize UI
    this.initTheme();
    this.initNavigation();
    this.initModals();
    this.initProjectSelector();
    this.initGlobalSearch();
    this.initOptions();

    // Show changelog if new version
    this.showChangelogIfNeeded();

    // Show project selector
    this.showProjectSelector();

    // Register service worker
    this.registerSW();

    console.log('App initialized, current language:', I18n.getCurrentLang());
  },

  // Theme management
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set initial icon based on theme
    const icon = savedTheme === 'light' ? 'sun' : 'moon';
    const label = I18n.t('selector.theme_toggle');

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
    const label = next === 'light' ? I18n.t('selector.theme_toggle') : I18n.t('selector.theme_toggle');

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

    // Update title using i18n
    const titles = {
      dashboard: I18n.t('dashboard.title'),
      cover: I18n.t('cover.title'),
      scope: I18n.t('scope.title'),
      kickoff: I18n.t('kickoff.title'),
      plan: I18n.t('plan.title'),
      psr: I18n.t('psr.title'),
      oil: I18n.t('oil.title'),
      uat: I18n.t('uat.title'),
      vacation: I18n.t('vacation.title'),
      participants: I18n.t('nav.participants'),
      finance: I18n.t('nav.finance'),
      jira: I18n.t('section.jira'),
      email: I18n.t('email.title')
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
      case 'jira':
        JiraHierarchyModule.load();
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
        draft: I18n.t('status.draft'),
        active: I18n.t('status.active'),
        'on-hold': I18n.t('status.on_hold'),
        completed: I18n.t('status.completed'),
        cancelled: I18n.t('status.cancelled')
      };

      const progress = project.progress || 0;
      
      return `
        <div class="project-card" data-id="${project.id}">
          <div class="project-card-header">
            <div>
              <div class="project-card-title">${this.escapeHtml(project.name || I18n.t('selector.no_name'))}</div>
              <div class="project-card-meta">${this.escapeHtml(project.code || '')}</div>
            </div>
            <span class="badge ${statusColors[project.status] || 'badge-neutral'}">${statusLabels[project.status] || project.status}</span>
          </div>
          <div class="project-card-meta">
            <i data-lucide="building-2" style="width:14px;height:14px;"></i> ${this.escapeHtml(project.customer || I18n.t('selector.no_customer'))}
          </div>
          <div class="project-card-meta">
            <i data-lucide="calendar" style="width:14px;height:14px;"></i> ${project.startDate || I18n.t('selector.no_date')}
          </div>
          <div style="margin-top:0.75rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-tertiary);margin-bottom:0.25rem;">
              <span>${I18n.t('dashboard.progress')}</span>
              <span>${progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill ${progress >= 100 ? 'success' : progress >= 50 ? '' : 'warning'}" style="width: ${progress}%;"></div>
            </div>
          </div>
          <!-- Action buttons -->
          <div class="project-card-actions" style="display:flex;gap:0.5rem;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);">
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); App.duplicateProject(${project.id})" title="${I18n.t('action.duplicate')}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i> ${I18n.t('action.duplicate')}
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); App.deleteProject(${project.id})" title="${I18n.t('action.delete')}" style="color:var(--danger);">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i> ${I18n.t('action.delete')}
            </button>
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
    const content = `
      <div class="form-group">
        <label class="form-label required">${I18n.t('cover.project_name')}</label>
        <input type="text" class="form-control" id="new-project-name" placeholder="${I18n.t('project.name_placeholder')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.project_code')}</label>
          <input type="text" class="form-control" id="new-project-code" placeholder="${I18n.t('project.code_placeholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.project_type')}</label>
          <select class="form-select" id="new-project-type">
            <option value="">${I18n.t('action.select')}</option>
            <option value="digital">${I18n.t('type.digital')}</option>
            <option value="process">${I18n.t('type.process')}</option>
            <option value="system">${I18n.t('type.system')}</option>
            <option value="integration">${I18n.t('type.integration')}</option>
            <option value="compliance">${I18n.t('type.compliance')}</option>
            <option value="expansion">${I18n.t('type.expansion')}</option>
            <option value="other">${I18n.t('type.other')}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.region')}</label>
          <select class="form-select" id="new-project-region">
            <option value="">${I18n.t('action.select')}</option>
            <option value="global">${I18n.t('region.global')}</option>
            <option value="europe">${I18n.t('region.europe')}</option>
            <option value="americas">${I18n.t('region.americas')}</option>
            <option value="asia">${I18n.t('region.asia')}</option>
            <option value="mea">${I18n.t('region.mea')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.customer')}</label>
          <input type="text" class="form-control" id="new-project-customer" placeholder="${I18n.t('project.customer_placeholder')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.start_date')}</label>
          <input type="date" class="form-control" id="new-project-start">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('cover.end_date')}</label>
          <input type="date" class="form-control" id="new-project-end">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">JIRA Ticket</label>
        <input type="text" class="form-control" id="new-project-jira" placeholder="e.g., PSA-1234">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('cover.business_case')}</label>
        <textarea class="form-textarea" id="new-project-business-case" rows="3" placeholder="${I18n.t('project.business_placeholder')}"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('project.participants')}</label>
        <div id="new-project-participants-list" style="margin-bottom:0.5rem;"></div>
        <div style="display:flex;gap:0.5rem;">
          <input type="text" class="form-control" id="new-participant-name" placeholder="${I18n.t('participants.name')}" style="flex:1;">
          <input type="text" class="form-control" id="new-participant-role" placeholder="${I18n.t('participants.role')}" style="flex:1;">
          <button type="button" class="btn btn-outline" onclick="App.addParticipantToNewProject()">
            <i data-lucide="plus"></i>
          </button>
        </div>
      </div>
    `;

    this.newProjectParticipants = [];

    this.openModal(I18n.t('project.new_title'), content, async () => {
      const name = document.getElementById('new-project-name').value.trim();
      if (!name) {
        this.toast(I18n.t('project.name_required'), 'error');
        return false;
      }

      const code = document.getElementById('new-project-code').value.trim();
      const type = document.getElementById('new-project-type').value;
      const region = document.getElementById('new-project-region').value;
      const customer = document.getElementById('new-project-customer').value.trim();
      const startDate = document.getElementById('new-project-start').value;
      const endDate = document.getElementById('new-project-end').value;
      const jiraTicket = document.getElementById('new-project-jira').value.trim();
      const businessCase = document.getElementById('new-project-business-case').value.trim();

      const project = {
        name: name,
        code: code,
        status: 'draft',
        type: type,
        region: region,
        customer: customer,
        startDate: startDate,
        endDate: endDate,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await DB.add(STORES.PROJECTS, project);

      // Create cover data with all the information
      await DB.put(STORES.COVER, {
        projectId: id,
        projectName: name,
        projectCode: code,
        projectType: type,
        region: region,
        startDate: startDate,
        endDate: endDate,
        customer: customer,
        businessCase: businessCase,
        jiraTicket: jiraTicket,
        status: 'draft'
      });

      // Add participants if any
      if (this.newProjectParticipants.length > 0) {
        for (const participant of this.newProjectParticipants) {
          await DB.add(STORES.PARTICIPANTS, {
            projectId: id,
            name: participant.name,
            role: participant.role,
            createdAt: new Date().toISOString()
          });
        }
      }

      this.newProjectParticipants = [];
      this.toast(I18n.t('project.created'), 'success');
      await this.renderProjectList();
      this.openProject(id);
    });

    // Initialize icons after modal opens
    setTimeout(() => lucide.createIcons(), 100);
  },

  addParticipantToNewProject() {
    const nameInput = document.getElementById('new-participant-name');
    const roleInput = document.getElementById('new-participant-role');
    const name = nameInput.value.trim();
    const role = roleInput.value.trim();

    if (!name) {
      this.toast(I18n.t('participants.name_required'), 'error');
      return;
    }

    this.newProjectParticipants.push({ name, role });
    this.renderNewProjectParticipants();

    nameInput.value = '';
    roleInput.value = '';
    nameInput.focus();
  },

  removeParticipantFromNewProject(index) {
    this.newProjectParticipants.splice(index, 1);
    this.renderNewProjectParticipants();
  },

  renderNewProjectParticipants() {
    const container = document.getElementById('new-project-participants-list');
    if (!container) return;

    if (this.newProjectParticipants.length === 0) {
      container.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.875rem;">${I18n.t('participants.empty')}</p>`;
      return;
    }

    container.innerHTML = this.newProjectParticipants.map((p, i) => `
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg-tertiary);border-radius:var(--radius);margin-bottom:0.25rem;">
        <span style="flex:1;font-weight:500;">${this.escapeHtml(p.name)}</span>
        <span style="color:var(--text-secondary);font-size:0.875rem;">${this.escapeHtml(p.role || '-')}</span>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.removeParticipantFromNewProject(${i})" style="color:var(--danger);">
          <i data-lucide="x" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `).join('');

    lucide.createIcons();
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
    
    newConfirm.addEventListener('click', async () => {
      if (onConfirm) {
        const result = await onConfirm();
        // If onConfirm returns false, don't close modal (validation failed)
        if (result === false) {
          return;
        }
      }
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
  },

  // Options Menu
  initOptions() {
    const btn = document.getElementById('btn-options');
    const dropdown = document.getElementById('options-dropdown');
    const container = document.querySelector('.options-menu-container');
    
    if (!btn || !dropdown) return;
    
    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      container.classList.toggle('open', !isOpen);
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        container.classList.remove('open');
      }
    });
    
    // Update active language button
    this.updateLanguageButton();
  },

  updateLanguageButton() {
    const currentLang = I18n.getCurrentLang();
    document.querySelectorAll('.option-btn[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  },

  async setLanguage(lang) {
    if (I18n.setLanguage(lang)) {
      this.updateLanguageButton();

      // Re-render dynamic content that uses I18n.t()
      const projectSelector = document.getElementById('project-selector');
      if (projectSelector && projectSelector.style.display !== 'none') {
        console.log('Re-rendering project list in new language');
        await this.renderProjectList();
      }

      // If inside a project, reload all modules
      if (this.currentProject) {
        console.log('Reloading modules in new language. Current section:', this.currentSection);

        // Reload all modules to ensure they get the new language
        const modulesToReload = ['dashboard', 'cover', 'scope', 'kickoff', 'plan', 'psr', 'oil', 'uat', 'vacation', 'participants', 'finance', 'email'];

        for (const moduleName of modulesToReload) {
          const module = this.modules[moduleName];
          if (module && typeof module.load === 'function') {
            try {
              await module.load();
              console.log(`Reloaded module: ${moduleName}`);
            } catch (e) {
              console.error(`Error reloading module ${moduleName}:`, e);
            }
          }
        }
      }

      this.toast(I18n.t('language_changed', {lang: lang === 'es' ? 'Español' : 'English'}), 'success');
    }
  },

  // Export all projects
  async exportAllProjects() {
    try {
      this.toast(I18n.t('toast.loading'), 'info');
      
      const projects = await DB.getAll('projects');
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        projects: []
      };
      
      for (const project of projects) {
        const projectData = await this.exportProjectData(project.id);
        exportData.projects.push({
          project: project,
          data: projectData
        });
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psa_bdp_all_projects_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.toast(`${exportData.projects.length} projects exported`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      this.toast(I18n.t('toast.error'), 'error');
    }
  },

  async exportProjectData(projectId) {
    const stores = ['cover', 'scope', 'kickoff', 'plan', 'psr', 'oil', 'uat', 'vacation', 'participants', 'vendors', 'budget', 'expenses', 'email'];
    const data = {};
    
    for (const store of stores) {
      try {
        data[store] = await DB.getAll(store, 'projectId', projectId);
      } catch (e) {
        data[store] = [];
      }
    }
    
    return data;
  },

  // Project management functions
  async deleteProject(id) {
    const confirmed = await this.confirm(I18n.t('project.confirm_delete'));
    if (!confirmed) return;

    try {
      // Delete project and all related data
      await DB.delete(STORES.PROJECTS, id);

      // Delete all related store data
      const stores = [STORES.COVER, STORES.SCOPE, STORES.KICKOFF, STORES.PLAN, STORES.PSR, STORES.OIL, STORES.UAT, STORES.VACATION, STORES.PARTICIPANTS, STORES.VENDORS, STORES.BUDGET, STORES.EXPENSES, STORES.EMAIL];
      for (const store of stores) {
        try {
          const items = await DB.getAll(store, 'projectId', id);
          for (const item of items) {
            await DB.delete(store, item.id);
          }
        } catch (e) {
          // Store might not exist, continue
        }
      }

      await this.renderProjectList();
      this.toast(I18n.t('project.deleted'), 'success');
    } catch (err) {
      console.error('Error deleting project:', err);
      this.toast(I18n.t('toast.error'), 'error');
    }
  },

  async duplicateProject(id) {
    try {
      const project = await DB.get(STORES.PROJECTS, id);
      if (!project) {
        this.toast(I18n.t('project.not_found'), 'error');
        return;
      }

      // Create duplicated project
      const newProject = {
        ...project,
        id: undefined, // Let DB generate new ID
        name: `${project.name} (${I18n.t('project.copy')})`,
        code: project.code ? `${project.code}-COPY` : '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newProjectId = await DB.add(STORES.PROJECTS, newProject);

      // Duplicate all related data
      const stores = [STORES.COVER, STORES.SCOPE, STORES.KICKOFF, STORES.PLAN, STORES.PSR, STORES.OIL, STORES.UAT, STORES.VACATION, STORES.PARTICIPANTS, STORES.VENDORS, STORES.BUDGET, STORES.EXPENSES, STORES.EMAIL];
      for (const store of stores) {
        try {
          const items = await DB.getAll(store, 'projectId', id);
          for (const item of items) {
            const newItem = {
              ...item,
              id: undefined, // Let DB generate new ID
              projectId: newProjectId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await DB.add(store, newItem);
          }
        } catch (e) {
          // Store might not exist, continue
        }
      }

      await this.renderProjectList();
      this.toast(I18n.t('project.duplicated'), 'success');
    } catch (err) {
      console.error('Error duplicating project:', err);
      this.toast(I18n.t('toast.error'), 'error');
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
