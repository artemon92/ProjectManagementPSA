/**
 * Cover Page Module
 * Handles project general information
 */

const CoverModule = {
  data: null,

  async load() {
    if (!App.currentProject) return;
    
    this.data = await DB.getById(STORES.COVER, App.currentProject.id);
    if (!this.data) {
      this.data = { projectId: App.currentProject.id };
    }
    
    this.render();
    this.bindEvents();
  },

  render() {
    const d = this.data || {};
    
    // Fill form fields
    document.getElementById('cover-project-name').value = d.projectName || App.currentProject.name || '';
    document.getElementById('cover-project-code').value = d.projectCode || App.currentProject.code || '';
    document.getElementById('cover-project-type').value = d.projectType || App.currentProject.type || '';
    document.getElementById('cover-region').value = d.region || App.currentProject.region || '';
    document.getElementById('cover-status').value = d.status || App.currentProject.status || 'draft';
    document.getElementById('cover-start-date').value = d.startDate || '';
    document.getElementById('cover-end-date').value = d.endDate || '';
    document.getElementById('cover-customer').value = d.customer || '';
    document.getElementById('cover-bu').value = d.businessUnit || 'ocean-freight';
    document.getElementById('cover-business-case').value = d.businessCase || '';
    document.getElementById('cover-summary').value = d.projectSummary || '';
    document.getElementById('cover-notes').value = d.notes || '';
    
    // Calculate duration
    this.updateDuration();
    
    // Update status badge
    const statusBadge = document.getElementById('cover-status-badge');
    const statusLabels = {
      draft: 'En preparación',
      active: 'Activo',
      'on-hold': 'En pausa',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    statusBadge.textContent = statusLabels[d.status || 'draft'] || d.status;
  },

  bindEvents() {
    // Date change - recalculate duration
    document.getElementById('cover-start-date')?.addEventListener('change', () => this.updateDuration());
    document.getElementById('cover-end-date')?.addEventListener('change', () => this.updateDuration());
    
    // Save button
    document.getElementById('btn-save-cover')?.addEventListener('click', () => this.save());
  },

  updateDuration() {
    const start = document.getElementById('cover-start-date').value;
    const end = document.getElementById('cover-end-date').value;
    const duration = App.daysBetween(start, end);
    document.getElementById('cover-duration').value = duration;
  },

  async save() {
    const data = {
      projectId: App.currentProject.id,
      projectName: document.getElementById('cover-project-name').value.trim(),
      projectCode: document.getElementById('cover-project-code').value.trim(),
      projectType: document.getElementById('cover-project-type').value,
      region: document.getElementById('cover-region').value,
      status: document.getElementById('cover-status').value,
      startDate: document.getElementById('cover-start-date').value,
      endDate: document.getElementById('cover-end-date').value,
      customer: document.getElementById('cover-customer').value.trim(),
      businessUnit: document.getElementById('cover-bu').value,
      businessCase: document.getElementById('cover-business-case').value.trim(),
      projectSummary: document.getElementById('cover-summary').value.trim(),
      notes: document.getElementById('cover-notes').value.trim()
    };
    
    // Update project metadata
    await App.updateProject({
      name: data.projectName,
      code: data.projectCode,
      status: data.status,
      type: data.projectType,
      region: data.region,
      customer: data.customer,
      startDate: data.startDate,
      endDate: data.endDate
    });
    
    // Save cover data
    await DB.put(STORES.COVER, data);
    this.data = data;
    
    // Update status badge
    const statusBadge = document.getElementById('cover-status-badge');
    const statusLabels = {
      draft: 'En preparación',
      active: 'Activo',
      'on-hold': 'En pausa',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    statusBadge.textContent = statusLabels[data.status] || data.status;
    
    App.toast('Cambios guardados', 'success');
  }
};
