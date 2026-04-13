/**
 * Dashboard Module - Project Overview
 */

const DashboardModule = {
  async load() {
    if (!App.currentProject) return;
    
    this.renderProjectInfo();
    await this.renderParticipants();
    await this.renderStats();
    await this.renderPSRSummary();
    this.bindEvents();
  },

  renderProjectInfo() {
    const p = App.currentProject;
    const cover = App.modules.cover?.data || {};
    
    document.getElementById('dash-project-name').value = p.name || '';
    document.getElementById('dash-project-code').value = p.code || '';
    
    const statusLabels = {
      draft: 'En preparación',
      active: 'Activo',
      'on-hold': 'En pausa',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    document.getElementById('dash-project-status').value = statusLabels[p.status] || p.status || '';
    
    const progress = p.progress || 0;
    document.getElementById('dash-progress-bar').style.width = progress + '%';
    
    // Calculate duration
    const start = cover.startDate || p.startDate;
    const end = cover.endDate || p.endDate;
    const duration = App.daysBetween(start, end);
    document.getElementById('dash-duration').value = duration > 0 ? duration + ' días' : 'N/A';
  },

  async renderParticipants() {
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', App.currentProject.id);
    
    const container = document.getElementById('dash-participants-list');
    document.getElementById('dash-participant-count').textContent = participants.length;
    
    if (participants.length === 0) {
      container.innerHTML = '<p style="color:var(--text-tertiary);">No hay participantes registrados</p>';
      return;
    }
    
    // Show first 6 participants with avatars
    const displayParticipants = participants.slice(0, 6);
    const remaining = participants.length - 6;
    
    const colors = ['#0B1F3F', '#E31837', '#00B2E3', '#10B981', '#F59E0B', '#8B5CF6'];
    
    let html = displayParticipants.map((p, i) => {
      const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const color = colors[i % colors.length];
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);">
          <div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">
            ${initials}
          </div>
          <div style="display:flex;flex-direction:column;">
            <span style="font-size:0.875rem;font-weight:500;">${App.escapeHtml(p.name)}</span>
            <span style="font-size:0.75rem;color:var(--text-secondary);">${App.escapeHtml(p.role || 'Sin rol')}</span>
          </div>
        </div>
      `;
    }).join('');
    
    if (remaining > 0) {
      html += `<div style="display:flex;align-items:center;justify-content:center;padding:0.5rem 0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);">
        <span style="font-size:0.875rem;color:var(--text-secondary);">+${remaining} más...</span>
      </div>`;
    }
    
    container.innerHTML = html;
  },

  async renderStats() {
    // OIL counts
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', App.currentProject.id);
    document.getElementById('dash-oil-count').textContent = oilItems.filter(i => i.status !== 'completed').length;
    document.getElementById('dash-oil-high').textContent = oilItems.filter(i => i.priority === 'high' && i.status !== 'completed').length;
    
    // Vacation count (active)
    const vacations = await DB.getAll(STORES.VACATION, 'projectId', App.currentProject.id);
    const today = new Date().toISOString().split('T')[0];
    const activeVacations = vacations.filter(v => v.startDate <= today && v.endDate >= today);
    document.getElementById('dash-vacation-count').textContent = activeVacations.length;
    
    // UAT count
    const uatTests = await DB.getAll(STORES.UAT, 'projectId', App.currentProject.id);
    document.getElementById('dash-uat-count').textContent = uatTests.length;
    
    // Vendors count
    const vendors = await DB.getAll(STORES.VENDORS, 'projectId', App.currentProject.id);
    const dashVendors = document.getElementById('dash-vendor-count');
    if (dashVendors) dashVendors.textContent = vendors.length;
    
    // Budget info
    const budgetItems = await DB.getAll(STORES.BUDGET, 'projectId', App.currentProject.id);
    const totalBudget = budgetItems.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    const totalSpent = budgetItems.reduce((sum, i) => sum + (i.actualCost || 0), 0);
    const dashBudget = document.getElementById('dash-budget-total');
    const dashSpent = document.getElementById('dash-budget-spent');
    if (dashBudget) dashBudget.textContent = this.formatCurrency(totalBudget);
    if (dashSpent) dashSpent.textContent = this.formatCurrency(totalSpent);
  },

  formatCurrency(value) {
    return (value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  },

  async renderPSRSummary() {
    const psrs = await DB.getAll(STORES.PSR, 'projectId', App.currentProject.id);
    const container = document.getElementById('dash-psr-summary');
    
    if (psrs.length === 0) {
      container.innerHTML = '<p style="color:var(--text-tertiary);">No hay PSR registrado aún</p>';
      return;
    }
    
    // Get latest PSR
    const latest = psrs.sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt))[0];
    
    const statusColors = {
      green: '#10B981',
      amber: '#F59E0B',
      red: '#EF4444'
    };
    
    const metrics = ['schedule', 'budget', 'resources', 'scope', 'risks'];
    const metricLabels = {
      schedule: 'Schedule',
      budget: 'Budget',
      resources: 'Resources',
      scope: 'Scope',
      risks: 'Risks'
    };
    
    let healthHtml = metrics.map(m => {
      const color = statusColors[latest[m]] || '#6B7280';
      return `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:var(--bg-tertiary);border-radius:var(--radius);">
          <div style="width:12px;height:12px;border-radius:50%;background:${color};"></div>
          <span style="font-size:0.875rem;">${metricLabels[m]}</span>
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:0.5rem;margin-bottom:1rem;">
        ${healthHtml}
      </div>
      <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;">
        <div>
          <small style="color:var(--text-secondary);">Progreso</small>
          <div style="font-size:1.25rem;font-weight:600;">${latest.progress || 0}%</div>
        </div>
        <div>
          <small style="color:var(--text-secondary);">Fecha Reporte</small>
          <div style="font-size:1rem;">${latest.reportDate || 'N/A'}</div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    document.getElementById('btn-view-all-participants')?.addEventListener('click', () => {
      App.navigateToSection('participants');
    });
    
    document.getElementById('btn-view-latest-psr')?.addEventListener('click', () => {
      App.navigateToSection('psr');
    });
  }
};

// Register module
App.modules.dashboard = DashboardModule;
