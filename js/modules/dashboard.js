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
    
    // Update progress bar and text
    const progress = latest.progress || 0;
    document.getElementById('dash-progress-bar').style.width = progress + '%';
    const progressText = document.getElementById('dash-progress-text');
    if (progressText) progressText.textContent = progress + '%';
    
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
    
    // Open Items button
    document.getElementById('btn-dash-view-all-oil')?.addEventListener('click', () => {
      App.navigateTo('oil');
    });
    
    // Vacation button
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
    const psrs = await DB.getAll(STORES.PSR, 'projectId', project.id);
    const latestPsr = psrs.sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt))[0];
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', project.id);
    const openOil = oilItems.filter(i => i.status !== 'completed');
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', project.id);
    const budgetItems = await DB.getAll(STORES.BUDGET, 'projectId', project.id);
    
    // Create a temporary div for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Arial,sans-serif;';
    document.body.appendChild(tempDiv);
    
    const statusColors = {
      green: '#10B981',
      amber: '#F59E0B',
      red: '#EF4444'
    };
    
    // Generate report content
    tempDiv.innerHTML = `
      <div style="max-width:800px;margin:0 auto;">
        <div style="background:linear-gradient(135deg, #0B1F3F 0%, #1a3a6e 100%);color:white;padding:30px;border-radius:8px 8px 0 0;margin:-40px -40px 30px -40px;">
          <h1 style="font-size:28px;margin:0 0 10px 0;">${project.name}</h1>
          <p style="color:#00B2E3;font-size:16px;margin:0;">Project Status Report · ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="margin-bottom:30px;">
          <h2 style="color:#0B1F3F;border-bottom:2px solid #E31837;padding-bottom:10px;margin:0 0 15px 0;font-size:20px;">📋 Project Information</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;">
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Project Code</div>
              <div style="font-size:14px;font-weight:600;color:#333;">${project.code || 'N/A'}</div>
            </div>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Status</div>
              <div style="font-size:14px;font-weight:600;color:#333;">${project.status || 'N/A'}</div>
            </div>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Overall Progress</div>
              <div style="font-size:14px;font-weight:600;color:#333;">${latestPsr?.progress || 0}%</div>
            </div>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Report Date</div>
              <div style="font-size:14px;font-weight:600;color:#333;">${latestPsr?.reportDate || new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        ${latestPsr ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#0B1F3F;border-bottom:2px solid #E31837;padding-bottom:10px;margin:0 0 15px 0;font-size:20px;">📊 Project Health</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${['schedule', 'budget', 'resources', 'scope'].map(m => `
              <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#f8f9fa;border-radius:6px;border-left:4px solid ${statusColors[latestPsr[m]] || '#10B981'};">
                <div style="width:12px;height:12px;border-radius:50%;background:${statusColors[latestPsr[m]] || '#10B981'};"></div>
                <div>
                  <div style="font-weight:600;text-transform:capitalize;">${m}</div>
                  <div style="font-size:12px;color:#666;">${latestPsr[m + 'Comment'] || 'On track'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${openOil.length > 0 ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#0B1F3F;border-bottom:2px solid #E31837;padding-bottom:10px;margin:0 0 15px 0;font-size:20px;">⚠️ Open Items (${openOil.length})</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Description</th>
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Priority</th>
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Assigned To</th>
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${openOil.map(item => `
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${item.description}</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;color:${statusColors[item.priority] || '#333'};font-weight:600;">${item.priority.toUpperCase()}</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${item.assignedTo || 'Unassigned'}</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${item.targetDate || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${participants.length > 0 ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#0B1F3F;border-bottom:2px solid #E31837;padding-bottom:10px;margin:0 0 15px 0;font-size:20px;">👥 Team Members (${participants.length})</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Name</th>
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Role</th>
                <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;font-weight:600;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${participants.map(p => `
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${p.name}</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${p.role || 'N/A'}</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;">${p.email || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${budgetItems.length > 0 ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#0B1F3F;border-bottom:2px solid #E31837;padding-bottom:10px;margin:0 0 15px 0;font-size:20px;">💰 Budget Overview</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;">
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Total Estimated</div>
              <div style="font-size:14px;font-weight:600;color:#333;">$${budgetItems.reduce((s, i) => s + (i.estimatedCost || 0), 0).toLocaleString()}</div>
            </div>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Total Spent</div>
              <div style="font-size:14px;font-weight:600;color:#333;">$${budgetItems.reduce((s, i) => s + (i.actualCost || 0), 0).toLocaleString()}</div>
            </div>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;">
              <div style="font-size:12px;color:#666;margin-bottom:4px;">Variance</div>
              <div style="font-size:14px;font-weight:600;color:#333;">$${budgetItems.reduce((s, i) => s + ((i.estimatedCost || 0) - (i.actualCost || 0)), 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#666;font-size:12px;">
          <p>Generated by PSA BDP Project Management System</p>
          <p>© ${new Date().getFullYear()} PSA BDP - Global Ocean Freight</p>
        </div>
      </div>
    `;
    
    // Use browser print to PDF
    setTimeout(() => {
      try {
        // Try html2pdf first if available
        if (typeof html2pdf !== 'undefined' && html2pdf().set) {
          const opt = {
            margin: 10,
            filename: `Project_Report_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          html2pdf().set(opt).from(tempDiv).save()
            .then(() => {
              document.body.removeChild(tempDiv);
              App.toast('PDF descargado correctamente', 'success');
            })
            .catch((err) => {
              console.error('html2pdf error:', err);
              this.fallbackPrintPDF(tempDiv, project);
            });
        } else {
          // Fallback: use print dialog
          this.fallbackPrintPDF(tempDiv, project);
        }
      } catch (err) {
        console.error('PDF generation error:', err);
        this.fallbackPrintPDF(tempDiv, project);
      }
    }, 200);
  },

  fallbackPrintPDF(tempDiv, project) {
    // Remove hidden temp div
    if (tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
    
    // Create a new window with the content for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      App.toast('El navegador bloqueó la ventana emergente. Permite popups para imprimir.', 'error');
      return;
    }
    
    printWindow.document.write(`
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
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #0B1F3F; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
          @media print { 
            .no-print { display: none !important; } 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-btn { display: none !important; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">📄 Imprimir / Guardar como PDF</button>
        ${tempDiv.innerHTML}
        <script>
          // Auto-print on desktop, but wait for user on mobile
          if (window.innerWidth > 768) {
            setTimeout(() => window.print(), 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    App.toast('Abriendo ventana de impresión. Guarda como PDF.', 'success');
  }
};

// Register module
App.modules.dashboard = DashboardModule;
