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
    await this.renderOpenItemsPreview();
    await this.renderVacationPreview();
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
    
    // Calculate duration
    const start = cover.startDate || p.startDate;
    const end = cover.endDate || p.endDate;
    const duration = App.daysBetween(start, end);
    document.getElementById('dash-duration').value = duration > 0 ? duration + ' días' : 'N/A';
    
    // Progress will be set by renderPSRSummary or calculated from tasks
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
    
    // Update progress bar
    const progress = latest.progress || 0;
    document.getElementById('dash-progress-bar').style.width = progress + '%';
    
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:0.5rem;margin-bottom:1rem;">
        ${healthHtml}
      </div>
      <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;">
        <div>
          <small style="color:var(--text-secondary);">Progreso</small>
          <div style="font-size:1.25rem;font-weight:600;">${progress}%</div>
        </div>
        <div>
          <small style="color:var(--text-secondary);">Fecha Reporte</small>
          <div style="font-size:1rem;">${latest.reportDate || 'N/A'}</div>
        </div>
      </div>
    `;
  },

  async renderOpenItemsPreview() {
    const container = document.getElementById('dash-openitems-list');
    if (!container) return;
    
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', App.currentProject.id);
    const openItems = oilItems.filter(i => i.status !== 'completed').slice(0, 5); // Show first 5
    
    if (openItems.length === 0) {
      container.innerHTML = '<p style="color:var(--text-tertiary);">No hay Open Items abiertos</p>';
      return;
    }
    
    const priorityColors = {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981'
    };
    
    const html = openItems.map(item => `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);border-left:3px solid ${priorityColors[item.priority] || '#6B7280'};">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.875rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${App.escapeHtml(item.description)}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);">
            ${item.assignedTo || 'Sin asignar'} · ${item.targetDate || 'Sin fecha'}
          </div>
        </div>
        <span style="font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:4px;background:${priorityColors[item.priority] || '#6B7280'};color:white;text-transform:uppercase;">${item.priority}</span>
      </div>
    `).join('');
    
    container.innerHTML = html;
  },

  async renderVacationPreview() {
    const container = document.getElementById('dash-vacation-list');
    if (!container) return;
    
    const vacations = await DB.getAll(STORES.VACATION, 'projectId', App.currentProject.id);
    const today = new Date().toISOString().split('T')[0];
    
    // Show upcoming and active vacations
    const relevantVacations = vacations
      .filter(v => v.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5);
    
    if (relevantVacations.length === 0) {
      container.innerHTML = '<p style="color:var(--text-tertiary);">No hay vacaciones programadas</p>';
      return;
    }
    
    const html = relevantVacations.map(v => {
      const isActive = v.startDate <= today && v.endDate >= today;
      const statusColor = isActive ? '#10B981' : '#F59E0B';
      const statusText = isActive ? 'Activa' : 'Próxima';
      
      return `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);border-left:3px solid ${statusColor};">
          <div style="width:32px;height:32px;border-radius:50%;background:${statusColor};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;">
            <i data-lucide="calendar" style="width:16px;height:16px;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.875rem;font-weight:500;">${App.escapeHtml(v.member)}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">
              ${v.startDate} - ${v.endDate} · ${v.days} días · Backup: ${App.escapeHtml(v.backup)}
            </div>
          </div>
          <span style="font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:4px;background:${statusColor};color:white;">${statusText}</span>
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
  },

  bindEvents() {
    // Fix: use App.navigateTo instead of App.navigateToSection
    document.getElementById('btn-view-all-participants')?.addEventListener('click', () => {
      App.navigateTo('participants');
    });
    
    document.getElementById('btn-view-latest-psr')?.addEventListener('click', () => {
      App.navigateTo('psr');
    });
    
    // Open Items buttons
    document.getElementById('btn-dash-add-oil')?.addEventListener('click', () => {
      App.navigateTo('oil');
      setTimeout(() => OilModule.add(), 100);
    });
    
    document.getElementById('btn-dash-view-all-oil')?.addEventListener('click', () => {
      App.navigateTo('oil');
    });
    
    // Vacation buttons
    document.getElementById('btn-dash-add-vacation')?.addEventListener('click', () => {
      App.navigateTo('vacation');
      setTimeout(() => VacationModule.add(), 100);
    });
    
    document.getElementById('btn-dash-view-all-vacation')?.addEventListener('click', () => {
      App.navigateTo('vacation');
    });
    
    // PDF Report button
    document.getElementById('btn-generate-pdf-report')?.addEventListener('click', () => {
      this.generatePDFReport();
    });
  },

  async generatePDFReport() {
    // Collect all project data
    const project = App.currentProject;
    const cover = await DB.get(STORES.COVER, project.id);
    const psrs = await DB.getAll(STORES.PSR, 'projectId', project.id);
    const latestPsr = psrs.sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt))[0];
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', project.id);
    const openOil = oilItems.filter(i => i.status !== 'completed');
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', project.id);
    const vacations = await DB.getAll(STORES.VACATION, 'projectId', project.id);
    const budgetItems = await DB.getAll(STORES.BUDGET, 'projectId', project.id);
    const expenses = await DB.getAll(STORES.EXPENSES, 'projectId', project.id);
    
    // Generate comprehensive HTML report for printing/PDF
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Report - ${project.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { background: linear-gradient(135deg, #0B1F3F 0%, #1a3a6e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; margin: -40px -40px 30px -40px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { color: #00B2E3; font-size: 16px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #0B1F3F; border-bottom: 2px solid #E31837; padding-bottom: 10px; margin-bottom: 15px; font-size: 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .info-item { background: #f8f9fa; padding: 12px; border-radius: 6px; }
    .info-item label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
    .info-item value { font-size: 14px; font-weight: 600; color: #333; }
    .health-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .health-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid; }
    .health-item.green { border-left-color: #10B981; }
    .health-item.amber { border-left-color: #F59E0B; }
    .health-item.red { border-left-color: #EF4444; }
    .health-dot { width: 12px; height: 12px; border-radius: 50%; }
    .health-dot.green { background: #10B981; }
    .health-dot.amber { background: #F59E0B; }
    .health-dot.red { background: #EF4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #0B1F3F; }
    .priority-high { color: #EF4444; font-weight: 600; }
    .priority-medium { color: #F59E0B; font-weight: 600; }
    .priority-low { color: #10B981; font-weight: 600; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-active { background: #d1fae5; color: #059669; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
    @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${project.name}</h1>
      <p>Project Status Report · ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
      <h2>📋 Project Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Project Code</label>
          <value>${project.code || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Status</label>
          <value>${project.status || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Overall Progress</label>
          <value>${latestPsr?.progress || 0}%</value>
        </div>
        <div class="info-item">
          <label>Report Date</label>
          <value>${latestPsr?.reportDate || new Date().toLocaleDateString()}</value>
        </div>
      </div>
    </div>
    
    ${latestPsr ? `
    <div class="section">
      <h2>📊 Project Health</h2>
      <div class="health-grid">
        <div class="health-item ${latestPsr.schedule || 'green'}">
          <div class="health-dot ${latestPsr.schedule || 'green'}"></div>
          <div>
            <div style="font-weight:600;">Schedule</div>
            <div style="font-size:12px;color:#666;">${latestPsr.scheduleComment || 'On track'}</div>
          </div>
        </div>
        <div class="health-item ${latestPsr.budget || 'green'}">
          <div class="health-dot ${latestPsr.budget || 'green'}"></div>
          <div>
            <div style="font-weight:600;">Budget</div>
            <div style="font-size:12px;color:#666;">${latestPsr.budgetComment || 'On track'}</div>
          </div>
        </div>
        <div class="health-item ${latestPsr.resources || 'green'}">
          <div class="health-dot ${latestPsr.resources || 'green'}"></div>
          <div>
            <div style="font-weight:600;">Resources</div>
            <div style="font-size:12px;color:#666;">${latestPsr.resourcesComment || 'On track'}</div>
          </div>
        </div>
        <div class="health-item ${latestPsr.scope || 'green'}">
          <div class="health-dot ${latestPsr.scope || 'green'}"></div>
          <div>
            <div style="font-weight:600;">Scope</div>
            <div style="font-size:12px;color:#666;">${latestPsr.scopeComment || 'On track'}</div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${openOil.length > 0 ? `
    <div class="section">
      <h2>⚠️ Open Items (${openOil.length})</h2>
      <table>
        <thead>
          <tr><th>Description</th><th>Priority</th><th>Assigned To</th><th>Due Date</th></tr>
        </thead>
        <tbody>
          ${openOil.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="priority-${item.priority}">${item.priority.toUpperCase()}</td>
              <td>${item.assignedTo || 'Unassigned'}</td>
              <td>${item.targetDate || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    ${participants.length > 0 ? `
    <div class="section">
      <h2>👥 Team Members (${participants.length})</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th></tr>
        </thead>
        <tbody>
          ${participants.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.role || 'N/A'}</td>
              <td>${p.department || 'N/A'}</td>
              <td>${p.email || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    ${budgetItems.length > 0 ? `
    <div class="section">
      <h2>💰 Budget Overview</h2>
      <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="info-item">
          <label>Total Estimated</label>
          <value>$${budgetItems.reduce((s, i) => s + (i.estimatedCost || 0), 0).toLocaleString()}</value>
        </div>
        <div class="info-item">
          <label>Total Spent</label>
          <value>$${budgetItems.reduce((s, i) => s + (i.actualCost || 0), 0).toLocaleString()}</value>
        </div>
        <div class="info-item">
          <label>Variance</label>
          <value>$${budgetItems.reduce((s, i) => s + ((i.estimatedCost || 0) - (i.actualCost || 0)), 0).toLocaleString()}</value>
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Generated by PSA BDP Project Management System</p>
      <p>© ${new Date().getFullYear()} PSA BDP - Global Ocean Freight</p>
    </div>
    
    <div class="no-print" style="text-align:center;margin-top:30px;">
      <button onclick="window.print()" style="padding:12px 24px;background:#0B1F3F;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
        Print / Save as PDF
      </button>
    </div>
  </div>
</body>
</html>`;
    
    // Open report in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  }
};

// Register module
App.modules.dashboard = DashboardModule;
