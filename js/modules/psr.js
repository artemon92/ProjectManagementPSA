/**
 * PSR (Project Status Report) Module - Enhanced for PSA BDP
 * Features: Weekly history, Critical Path, Risk Management, Detailed Tables
 */

const PsrModule = {
  psrHistory: [],
  currentPsr: null,
  phases: [],
  accomplishments: [],
  issues: [],
  nextSteps: [],
  risks: [],

  async load() {
    if (!App.currentProject) return;
    
    // Load all PSR history for this project
    this.psrHistory = await DB.getAll(STORES.PSR, 'projectId', App.currentProject.id);
    this.psrHistory.sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt));
    
    // Initialize with empty current PSR or load latest
    this.currentPsr = {
      projectId: App.currentProject.id,
      reportDate: new Date().toISOString().split('T')[0],
      progress: 0,
      schedule: 'green',
      budget: 'green',
      resources: 'green',
      scope: 'green',
      risks: 'green',
      links: '',
      comments: '',
      phases: [],
      accomplishments: [],
      issues: [],
      nextSteps: [],
      riskItems: []
    };
    
    this.phases = [];
    this.accomplishments = [];
    this.issues = [];
    this.nextSteps = [];
    this.risks = [];
    
    this.renderWeekSelector();
    this.render();
    this.bindEvents();
    this.updateOILSummary();
  },

  renderWeekSelector() {
    const selector = document.getElementById('psr-week-selector');
    if (!selector) return;
    
    selector.innerHTML = '<option value="new">+ Nueva Semana</option>';
    
    this.psrHistory.forEach((psr, index) => {
      const date = new Date(psr.reportDate || psr.createdAt);
      const weekLabel = `Semana ${psr.week || this.getWeekNumber(date)} - ${date.toLocaleDateString('es-ES')}`;
      selector.innerHTML += `<option value="${index}">${weekLabel}</option>`;
    });
  },

  render() {
    const d = this.currentPsr || {};
    
    // Report date
    document.getElementById('psr-report-date').value = d.reportDate || new Date().toISOString().split('T')[0];
    document.getElementById('psr-links').value = d.links || '';
    
    // Progress
    document.getElementById('psr-progress').value = d.progress || 0;
    document.getElementById('psr-progress-bar').style.width = (d.progress || 0) + '%';
    
    // Health indicators - set values
    const metrics = ['schedule', 'budget', 'resources', 'scope', 'risks'];
    metrics.forEach(metric => {
      const value = d[metric] || 'green';
      document.getElementById(`psr-${metric}`).value = value;
      document.getElementById(`psr-${metric}-comment`).value = d[`${metric}Comment`] || '';
      this.updateHealthButtons(metric, value);
    });
    
    document.getElementById('psr-comments').value = d.comments || '';
    
    // Tables
    this.renderPhases();
    this.renderAccomplishments();
    this.renderIssues();
    this.renderNextSteps();
    this.renderRisks();
  },

  updateHealthButtons(metric, value) {
    const colors = {
      green: { border: '#10B981', bg: '#10B98122' },
      amber: { border: '#F59E0B', bg: '#F59E0B22' },
      red: { border: '#EF4444', bg: '#EF444422' }
    };
    
    document.querySelectorAll(`.health-btn[data-metric="${metric}"]`).forEach(btn => {
      const btnValue = btn.dataset.value;
      if (btnValue === value) {
        btn.style.border = `2px solid ${colors[btnValue].border}`;
        btn.style.background = colors[btnValue].bg;
      } else {
        btn.style.border = '2px solid transparent';
        btn.style.background = 'transparent';
      }
    });
  },

  bindHealthButtons() {
    document.querySelectorAll('.health-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const metric = e.target.dataset.metric;
        const value = e.target.dataset.value;
        document.getElementById(`psr-${metric}`).value = value;
        this.updateHealthButtons(metric, value);
      });
    });
  },

  loadPsrFromHistory(index) {
    if (index === 'new') {
      this.currentPsr = {
        projectId: App.currentProject.id,
        reportDate: new Date().toISOString().split('T')[0],
        progress: 0,
        schedule: 'green',
        budget: 'green',
        resources: 'green',
        scope: 'green',
        risks: 'green',
        links: '',
        comments: '',
        phases: [],
        accomplishments: [],
        issues: [],
        nextSteps: [],
        riskItems: []
      };
      this.phases = [];
      this.accomplishments = [];
      this.issues = [];
      this.nextSteps = [];
      this.risks = [];
    } else {
      const psr = this.psrHistory[index];
      this.currentPsr = { ...psr };
      this.phases = psr.phases || [];
      this.accomplishments = psr.accomplishments || [];
      this.issues = psr.issues || [];
      this.nextSteps = psr.nextSteps || [];
      this.risks = psr.riskItems || [];
    }
    this.render();
  },

  // === PHASES / CRITICAL PATH ===
  renderPhases() {
    const tbody = document.getElementById('psr-phases-tbody');
    const empty = document.getElementById('psr-phases-empty');
    const table = document.getElementById('psr-phases-table');
    
    if (!tbody) return;
    
    if (this.phases.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    empty.style.display = 'none';
    
    tbody.innerHTML = this.phases.map((p, i) => {
      const statusClass = p.status === 'green' ? 'badge-success' : 
                         p.status === 'amber' ? 'badge-warning' : 
                         p.status === 'red' ? 'badge-danger' : 'badge-neutral';
      const statusLabel = p.status === 'green' ? '🟢 Green' : 
                         p.status === 'amber' ? '🟡 Amber' : 
                         p.status === 'red' ? '🔴 Red' : '⚪ Neutral';
      
      return `
        <tr>
          <td>${App.escapeHtml(p.phase)}</td>
          <td>${App.escapeHtml(p.milestone)}</td>
          <td>${App.formatDate(p.plannedDate)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div class="progress-bar" style="flex:1;height:8px;">
                <div class="progress-bar-fill" style="width:${p.readiness || 0}%;"></div>
              </div>
              <span style="font-size:0.75rem;">${p.readiness || 0}%</span>
            </div>
          </td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="PsrModule.editPhase(${i})" title="Editar">
              <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="PsrModule.deletePhase(${i})" title="Eliminar">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  addPhase() {
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Phase / Fase</label>
          <input type="text" class="form-control" id="phase-name" placeholder="Ej: 1. PROJECT INITIATION">
        </div>
        <div class="form-group">
          <label class="form-label required">Milestone / Hito</label>
          <input type="text" class="form-control" id="phase-milestone" placeholder="Ej: Scope Definition">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Planned Date</label>
          <input type="date" class="form-control" id="phase-date">
        </div>
        <div class="form-group">
          <label class="form-label">Readiness %</label>
          <input type="number" class="form-control" id="phase-readiness" min="0" max="100" value="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="phase-status">
          <option value="green">🟢 Green</option>
          <option value="amber">🟡 Amber</option>
          <option value="red">🔴 Red</option>
          <option value="neutral">⚪ Neutral</option>
        </select>
      </div>
    `;
    
    App.openModal('Añadir Fase / Milestone', content, () => {
      const phase = document.getElementById('phase-name').value.trim();
      const milestone = document.getElementById('phase-milestone').value.trim();
      const plannedDate = document.getElementById('phase-date').value;
      
      if (!phase || !milestone || !plannedDate) {
        App.toast('Phase, milestone y planned date son obligatorios', 'error');
        return false;
      }
      
      this.phases.push({
        phase,
        milestone,
        plannedDate,
        readiness: parseInt(document.getElementById('phase-readiness').value) || 0,
        status: document.getElementById('phase-status').value
      });
      
      this.renderPhases();
    });
  },

  editPhase(index) {
    const p = this.phases[index];
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Phase / Fase</label>
          <input type="text" class="form-control" id="phase-name" value="${App.escapeHtml(p.phase)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Milestone / Hito</label>
          <input type="text" class="form-control" id="phase-milestone" value="${App.escapeHtml(p.milestone)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Planned Date</label>
          <input type="date" class="form-control" id="phase-date" value="${p.plannedDate}">
        </div>
        <div class="form-group">
          <label class="form-label">Readiness %</label>
          <input type="number" class="form-control" id="phase-readiness" min="0" max="100" value="${p.readiness || 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="phase-status">
          <option value="green" ${p.status === 'green' ? 'selected' : ''}>🟢 Green</option>
          <option value="amber" ${p.status === 'amber' ? 'selected' : ''}>🟡 Amber</option>
          <option value="red" ${p.status === 'red' ? 'selected' : ''}>🔴 Red</option>
          <option value="neutral" ${p.status === 'neutral' ? 'selected' : ''}>⚪ Neutral</option>
        </select>
      </div>
    `;
    
    App.openModal('Editar Fase', content, () => {
      const phase = document.getElementById('phase-name').value.trim();
      const milestone = document.getElementById('phase-milestone').value.trim();
      const plannedDate = document.getElementById('phase-date').value;
      
      if (!phase || !milestone || !plannedDate) {
        App.toast('Phase, milestone y planned date son obligatorios', 'error');
        return false;
      }
      
      this.phases[index] = {
        phase,
        milestone,
        plannedDate,
        readiness: parseInt(document.getElementById('phase-readiness').value) || 0,
        status: document.getElementById('phase-status').value
      };
      
      this.renderPhases();
    });
  },

  deletePhase(index) {
    this.phases.splice(index, 1);
    this.renderPhases();
  },

  // === ACCOMPLISHMENTS ===
  renderAccomplishments() {
    const tbody = document.getElementById('psr-accomplishments-tbody');
    const empty = document.getElementById('psr-accomplishments-empty');
    const table = document.getElementById('psr-accomplishments-table');
    
    if (!tbody) return;
    
    if (this.accomplishments.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    empty.style.display = 'none';
    
    tbody.innerHTML = this.accomplishments.map((a, i) => `
      <tr>
        <td>${App.escapeHtml(a.description)}</td>
        <td>${App.formatDate(a.date)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.editAccomplishment(${i})" title="Editar">
            <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.deleteAccomplishment(${i})" title="Eliminar">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    lucide.createIcons();
  },

  addAccomplishment() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Accomplishment / Logro</label>
        <textarea class="form-textarea" id="acc-desc" rows="3" placeholder="Describe el logro..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label required">Fecha</label>
        <input type="date" class="form-control" id="acc-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
    `;
    
    App.openModal('Añadir Logro', content, () => {
      const desc = document.getElementById('acc-desc').value.trim();
      const date = document.getElementById('acc-date').value;
      
      if (!desc || !date) {
        App.toast('Descripción y fecha son obligatorios', 'error');
        return false;
      }
      
      this.accomplishments.push({ description: desc, date });
      this.renderAccomplishments();
    });
  },

  editAccomplishment(index) {
    const a = this.accomplishments[index];
    const content = `
      <div class="form-group">
        <label class="form-label required">Accomplishment / Logro</label>
        <textarea class="form-textarea" id="acc-desc" rows="3">${App.escapeHtml(a.description)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label required">Fecha</label>
        <input type="date" class="form-control" id="acc-date" value="${a.date}">
      </div>
    `;
    
    App.openModal('Editar Logro', content, () => {
      const desc = document.getElementById('acc-desc').value.trim();
      const date = document.getElementById('acc-date').value;
      
      if (!desc || !date) {
        App.toast('Descripción y fecha son obligatorios', 'error');
        return false;
      }
      
      this.accomplishments[index] = { description: desc, date };
      this.renderAccomplishments();
    });
  },

  deleteAccomplishment(index) {
    this.accomplishments.splice(index, 1);
    this.renderAccomplishments();
  },

  // === ISSUES ===
  renderIssues() {
    const tbody = document.getElementById('psr-issues-tbody');
    const empty = document.getElementById('psr-issues-empty');
    const table = document.getElementById('psr-issues-table');
    
    if (!tbody) return;
    
    if (this.issues.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    empty.style.display = 'none';
    
    tbody.innerHTML = this.issues.map((issue, i) => `
      <tr>
        <td>${App.escapeHtml(issue.description)}</td>
        <td>${App.escapeHtml(issue.owner)}</td>
        <td>${App.formatDate(issue.date)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.editIssue(${i})" title="Editar">
            <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.deleteIssue(${i})" title="Eliminar">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    lucide.createIcons();
  },

  addIssue() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Issue / Bloqueo</label>
        <textarea class="form-textarea" id="issue-desc" rows="3" placeholder="Describe el issue..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Responsable</label>
          <input type="text" class="form-control" id="issue-owner" placeholder="Nombre del responsable">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Identificado</label>
          <input type="date" class="form-control" id="issue-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
    `;
    
    App.openModal('Añadir Issue', content, () => {
      const desc = document.getElementById('issue-desc').value.trim();
      const owner = document.getElementById('issue-owner').value.trim();
      const date = document.getElementById('issue-date').value;
      
      if (!desc || !owner || !date) {
        App.toast('Todos los campos son obligatorios', 'error');
        return false;
      }
      
      this.issues.push({ description: desc, owner, date });
      this.renderIssues();
    });
  },

  editIssue(index) {
    const issue = this.issues[index];
    const content = `
      <div class="form-group">
        <label class="form-label required">Issue / Bloqueo</label>
        <textarea class="form-textarea" id="issue-desc" rows="3">${App.escapeHtml(issue.description)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Responsable</label>
          <input type="text" class="form-control" id="issue-owner" value="${App.escapeHtml(issue.owner)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Identificado</label>
          <input type="date" class="form-control" id="issue-date" value="${issue.date}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Issue', content, () => {
      const desc = document.getElementById('issue-desc').value.trim();
      const owner = document.getElementById('issue-owner').value.trim();
      const date = document.getElementById('issue-date').value;
      
      if (!desc || !owner || !date) {
        App.toast('Todos los campos son obligatorios', 'error');
        return false;
      }
      
      this.issues[index] = { description: desc, owner, date };
      this.renderIssues();
    });
  },

  deleteIssue(index) {
    this.issues.splice(index, 1);
    this.renderIssues();
  },

  // === NEXT STEPS ===
  renderNextSteps() {
    const tbody = document.getElementById('psr-nextsteps-tbody');
    const empty = document.getElementById('psr-nextsteps-empty');
    const table = document.getElementById('psr-nextsteps-table');
    
    if (!tbody) return;
    
    if (this.nextSteps.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    empty.style.display = 'none';
    
    tbody.innerHTML = this.nextSteps.map((step, i) => `
      <tr>
        <td>${App.escapeHtml(step.activity)}</td>
        <td>${App.escapeHtml(step.owner)}</td>
        <td>${App.formatDate(step.targetDate)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.editNextStep(${i})" title="Editar">
            <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.deleteNextStep(${i})" title="Eliminar">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    lucide.createIcons();
  },

  addNextStep() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Activity / Actividad</label>
        <textarea class="form-textarea" id="step-activity" rows="3" placeholder="Describe la actividad..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Responsable</label>
          <input type="text" class="form-control" id="step-owner" placeholder="Nombre del responsable">
        </div>
        <div class="form-group">
          <label class="form-label required">Target Date</label>
          <input type="date" class="form-control" id="step-date">
        </div>
      </div>
    `;
    
    App.openModal('Añadir Próximo Paso', content, () => {
      const activity = document.getElementById('step-activity').value.trim();
      const owner = document.getElementById('step-owner').value.trim();
      const targetDate = document.getElementById('step-date').value;
      
      if (!activity || !owner || !targetDate) {
        App.toast('Todos los campos son obligatorios', 'error');
        return false;
      }
      
      this.nextSteps.push({ activity, owner, targetDate });
      this.renderNextSteps();
    });
  },

  editNextStep(index) {
    const step = this.nextSteps[index];
    const content = `
      <div class="form-group">
        <label class="form-label required">Activity / Actividad</label>
        <textarea class="form-textarea" id="step-activity" rows="3">${App.escapeHtml(step.activity)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Responsable</label>
          <input type="text" class="form-control" id="step-owner" value="${App.escapeHtml(step.owner)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Target Date</label>
          <input type="date" class="form-control" id="step-date" value="${step.targetDate}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Próximo Paso', content, () => {
      const activity = document.getElementById('step-activity').value.trim();
      const owner = document.getElementById('step-owner').value.trim();
      const targetDate = document.getElementById('step-date').value;
      
      if (!activity || !owner || !targetDate) {
        App.toast('Todos los campos son obligatorios', 'error');
        return false;
      }
      
      this.nextSteps[index] = { activity, owner, targetDate };
      this.renderNextSteps();
    });
  },

  deleteNextStep(index) {
    this.nextSteps.splice(index, 1);
    this.renderNextSteps();
  },

  // === RISK MANAGEMENT ===
  renderRisks() {
    const tbody = document.getElementById('psr-risks-tbody');
    const empty = document.getElementById('psr-risks-empty');
    const table = document.getElementById('psr-risks-table');
    
    if (!tbody) return;
    
    if (this.risks.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    empty.style.display = 'none';
    
    const severityClass = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' };
    
    tbody.innerHTML = this.risks.map((risk, i) => `
      <tr>
        <td>${App.escapeHtml(risk.risk)}</td>
        <td><span class="badge ${severityClass[risk.severity] || 'badge-neutral'}">${risk.severity?.toUpperCase()}</span></td>
        <td>${App.escapeHtml(risk.raisedBy)}</td>
        <td>${App.escapeHtml(risk.action)}</td>
        <td>${App.formatDate(risk.dueDate)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.editRisk(${i})" title="Editar">
            <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="PsrModule.deleteRisk(${i})" title="Eliminar">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    lucide.createIcons();
  },

  addRisk() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Risk / Riesgo</label>
        <textarea class="form-textarea" id="risk-desc" rows="3" placeholder="Describe el riesgo..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Severity</label>
          <select class="form-select" id="risk-severity">
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Raised By</label>
          <input type="text" class="form-control" id="risk-raised" placeholder="Quien identificó el riesgo">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Action On / Mitigación</label>
        <input type="text" class="form-control" id="risk-action" placeholder="Acción para mitigar">
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-control" id="risk-due">
      </div>
    `;
    
    App.openModal('Añadir Riesgo', content, () => {
      const risk = document.getElementById('risk-desc').value.trim();
      const severity = document.getElementById('risk-severity').value;
      const raisedBy = document.getElementById('risk-raised').value.trim();
      
      if (!risk || !severity || !raisedBy) {
        App.toast('Risk, severity y raised by son obligatorios', 'error');
        return false;
      }
      
      this.risks.push({
        risk,
        severity,
        raisedBy,
        action: document.getElementById('risk-action').value.trim(),
        dueDate: document.getElementById('risk-due').value
      });
      
      this.renderRisks();
    });
  },

  editRisk(index) {
    const r = this.risks[index];
    const content = `
      <div class="form-group">
        <label class="form-label required">Risk / Riesgo</label>
        <textarea class="form-textarea" id="risk-desc" rows="3">${App.escapeHtml(r.risk)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Severity</label>
          <select class="form-select" id="risk-severity">
            <option value="high" ${r.severity === 'high' ? 'selected' : ''}>🔴 High</option>
            <option value="medium" ${r.severity === 'medium' ? 'selected' : ''}>🟡 Medium</option>
            <option value="low" ${r.severity === 'low' ? 'selected' : ''}>🟢 Low</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Raised By</label>
          <input type="text" class="form-control" id="risk-raised" value="${App.escapeHtml(r.raisedBy)}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Action On / Mitigación</label>
        <input type="text" class="form-control" id="risk-action" value="${App.escapeHtml(r.action || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-control" id="risk-due" value="${r.dueDate || ''}">
      </div>
    `;
    
    App.openModal('Editar Riesgo', content, () => {
      const risk = document.getElementById('risk-desc').value.trim();
      const severity = document.getElementById('risk-severity').value;
      const raisedBy = document.getElementById('risk-raised').value.trim();
      
      if (!risk || !severity || !raisedBy) {
        App.toast('Risk, severity y raised by son obligatorios', 'error');
        return false;
      }
      
      this.risks[index] = {
        risk,
        severity,
        raisedBy,
        action: document.getElementById('risk-action').value.trim(),
        dueDate: document.getElementById('risk-due').value
      };
      
      this.renderRisks();
    });
  },

  deleteRisk(index) {
    this.risks.splice(index, 1);
    this.renderRisks();
  },

  // === OIL SUMMARY ===
  async updateOILSummary() {
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', App.currentProject.id);
    
    // By priority
    document.getElementById('psr-oil-high').textContent = oilItems.filter(i => i.priority === 'high' && i.status !== 'completed').length;
    document.getElementById('psr-oil-medium').textContent = oilItems.filter(i => i.priority === 'medium' && i.status !== 'completed').length;
    document.getElementById('psr-oil-low').textContent = oilItems.filter(i => i.priority === 'low' && i.status !== 'completed').length;
    document.getElementById('psr-oil-completed').textContent = oilItems.filter(i => i.status === 'completed').length;
    
    // By status
    document.getElementById('psr-oil-open').textContent = oilItems.filter(i => i.status === 'open').length;
    document.getElementById('psr-oil-progress').textContent = oilItems.filter(i => i.status === 'in-progress').length;
    document.getElementById('psr-oil-hold').textContent = oilItems.filter(i => i.status === 'on-hold').length;
  },

  // === EVENTS & SAVE ===
  bindEvents() {
    document.getElementById('btn-update-psr')?.addEventListener('click', () => this.save());
    document.getElementById('btn-export-psr')?.addEventListener('click', () => this.export());
    document.getElementById('btn-view-psr-history')?.addEventListener('click', () => this.viewHistory());
    document.getElementById('btn-generate-psr-email')?.addEventListener('click', () => this.generateEmailFromCurrentPSR());
    document.getElementById('psr-week-selector')?.addEventListener('change', (e) => this.loadPsrFromHistory(e.target.value));
    
    document.getElementById('psr-progress')?.addEventListener('input', (e) => {
      document.getElementById('psr-progress-bar').style.width = e.target.value + '%';
    });
    
    // Health indicator buttons
    this.bindHealthButtons();
    
    // Table buttons
    document.getElementById('btn-add-phase')?.addEventListener('click', () => this.addPhase());
    document.getElementById('btn-add-accomplishment')?.addEventListener('click', () => this.addAccomplishment());
    document.getElementById('btn-add-issue')?.addEventListener('click', () => this.addIssue());
    document.getElementById('btn-add-nextstep')?.addEventListener('click', () => this.addNextStep());
    document.getElementById('btn-add-risk')?.addEventListener('click', () => this.addRisk());
  },

  async save() {
    const data = {
      projectId: App.currentProject.id,
      week: this.getWeekNumber(new Date(document.getElementById('psr-report-date').value)),
      reportDate: document.getElementById('psr-report-date').value,
      progress: parseInt(document.getElementById('psr-progress').value) || 0,
      // Health indicators
      schedule: document.getElementById('psr-schedule').value,
      budget: document.getElementById('psr-budget').value,
      resources: document.getElementById('psr-resources').value,
      scope: document.getElementById('psr-scope').value,
      risks: document.getElementById('psr-risks').value,
      // Health comments
      scheduleComment: document.getElementById('psr-schedule-comment').value.trim(),
      budgetComment: document.getElementById('psr-budget-comment').value.trim(),
      resourcesComment: document.getElementById('psr-resources-comment').value.trim(),
      scopeComment: document.getElementById('psr-scope-comment').value.trim(),
      risksComment: document.getElementById('psr-risks-comment').value.trim(),
      // Other fields
      links: document.getElementById('psr-links').value.trim(),
      comments: document.getElementById('psr-comments').value.trim(),
      phases: this.phases,
      accomplishments: this.accomplishments,
      issues: this.issues,
      nextSteps: this.nextSteps,
      riskItems: this.risks,
      createdAt: new Date().toISOString()
    };
    
    await DB.add(STORES.PSR, data);
    
    // Update project progress
    await App.updateProject({ progress: data.progress });
    
    // Reload history
    await this.load();
    
    App.toast('PSR guardado exitosamente', 'success');
  },

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },

  viewHistory() {
    if (this.psrHistory.length === 0) {
      App.toast('No hay PSRs históricos', 'info');
      return;
    }
    
    const rows = this.psrHistory.map(psr => {
      const date = new Date(psr.reportDate || psr.createdAt);
      const health = [psr.schedule, psr.budget, psr.resources, psr.scope, psr.risks];
      const redCount = health.filter(h => h === 'red').length;
      const status = redCount > 0 ? '🔴' : health.includes('amber') ? '🟡' : '🟢';
      
      return `
        <tr>
          <td>Semana ${psr.week || '-'}</td>
          <td>${date.toLocaleDateString('es-ES')}</td>
          <td>${psr.progress || 0}%</td>
          <td>${status}</td>
        </tr>
      `;
    }).join('');
    
    const content = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Semana</th>
              <th>Fecha</th>
              <th>Progreso</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    
    App.openModal('Historial de PSRs', content, null, true);
  },

  export() {
    const d = this.currentPsr || {};
    const cover = CoverModule.data || {};
    
    const report = `================================================================================
PROJECT STATUS REPORT - PSA BDP
================================================================================

Project: ${App.currentProject.name}
Week: ${this.getWeekNumber(new Date(document.getElementById('psr-report-date').value))}
Report Date: ${document.getElementById('psr-report-date').value}
Project Manager: ${cover.projectManager || '-'}

================================================================================
OVERALL PROJECT HEALTH
================================================================================

Progress: ${d.progress || 0}%

Schedule:  ${d.schedule?.toUpperCase() || 'GREEN'}
Budget:    ${d.budget?.toUpperCase() || 'GREEN'}
Resources: ${d.resources?.toUpperCase() || 'GREEN'}
Scope:     ${d.scope?.toUpperCase() || 'GREEN'}
Risks:     ${d.risks?.toUpperCase() || 'GREEN'}

Links: ${d.links || 'N/A'}

================================================================================
CRITICAL PATH - PHASES
================================================================================

${this.phases.map(p => `
[${p.status?.toUpperCase()}] ${p.phase}
  Milestone: ${p.milestone}
  Planned Date: ${p.plannedDate}
  Readiness: ${p.readiness || 0}%
`).join('\n') || 'No phases defined'}

================================================================================
KEY ACCOMPLISHMENTS
================================================================================

${this.accomplishments.map(a => `- [${a.date}] ${a.description}`).join('\n') || 'None'}

================================================================================
KEY ISSUES
================================================================================

${this.issues.map(i => `- [${i.date}] ${i.description}\n  Owner: ${i.owner}`).join('\n') || 'None'}

================================================================================
NEXT STEPS / PLANNED ACTIVITIES
================================================================================

${this.nextSteps.map(s => `- [${s.targetDate}] ${s.activity}\n  Owner: ${s.owner}`).join('\n') || 'None'}

================================================================================
RISK MANAGEMENT
================================================================================

${this.risks.map(r => `- [${r.severity?.toUpperCase()}] ${r.risk}\n  Raised By: ${r.raisedBy}\n  Action: ${r.action || 'N/A'}\n  Due: ${r.dueDate || 'N/A'}`).join('\n\n') || 'No risks identified'}

================================================================================
COMMENTS
================================================================================

${d.comments || 'None'}

================================================================================
Generated by PSA BDP Project Management System
================================================================================
`;
    
    navigator.clipboard.writeText(report).then(() => {
      App.toast('PSR copiado al portapapeles', 'success');
    });
  },

  async generateEmailFromCurrentPSR() {
    if (!this.currentPsr) {
      App.toast('No hay PSR cargado para generar email', 'error');
      return;
    }
    
    const project = App.currentProject;
    const d = this.currentPsr;
    const reportDate = d.reportDate ? new Date(d.reportDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Get OIL items
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', project.id);
    const openOil = oilItems.filter(i => i.status !== 'completed');
    
    // Status colors
    const statusColors = {
      green: '#10B981',
      amber: '#F59E0B',
      red: '#EF4444'
    };
    
    // Generate HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1F3F 0%, #1a3a6e 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Project Status Report</h1>
              <p style="color: #00B2E3; margin: 10px 0 0 0; font-size: 16px;">${project.name}</p>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Week of ${reportDate}</p>
            </td>
          </tr>
          
          <!-- Project Health -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #E31837; padding-bottom: 10px;">
                📊 Overall Project Health
              </h2>
              
              <!-- Progress Bar -->
              <div style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 500;">Overall Progress</span>
                  <span style="color: #0B1F3F; font-weight: 700; font-size: 18px;">${d.progress || 0}%</span>
                </div>
                <div style="background-color: #e0e0e0; border-radius: 10px; height: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #00B2E3 0%, #0B1F3F 100%); height: 100%; width: ${d.progress || 0}%; border-radius: 10px;"></div>
                </div>
              </div>
              
              <!-- Health Indicators -->
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 15px;">
                <tr>
                  <td style="width: 50%; padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.schedule] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Schedule</div>
                      <div style="font-weight: 600; color: ${statusColors[d.schedule] || '#10B981'}; text-transform: uppercase;">${d.schedule || 'green'}</div>
                      ${d.scheduleComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.scheduleComment}</div>` : ''}
                    </div>
                  </td>
                  <td style="width: 50%; padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.budget] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Budget</div>
                      <div style="font-weight: 600; color: ${statusColors[d.budget] || '#10B981'}; text-transform: uppercase;">${d.budget || 'green'}</div>
                      ${d.budgetComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.budgetComment}</div>` : ''}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.resources] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Resources</div>
                      <div style="font-weight: 600; color: ${statusColors[d.resources] || '#10B981'}; text-transform: uppercase;">${d.resources || 'green'}</div>
                      ${d.resourcesComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.resourcesComment}</div>` : ''}
                    </div>
                  </td>
                  <td style="padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.scope] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Scope</div>
                      <div style="font-weight: 600; color: ${statusColors[d.scope] || '#10B981'}; text-transform: uppercase;">${d.scope || 'green'}</div>
                      ${d.scopeComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.scopeComment}</div>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Accomplishments -->
          ${this.accomplishments && this.accomplishments.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
                ✅ Key Accomplishments
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.6;">
                ${this.accomplishments.map(a => `<li style="margin-bottom: 8px;">${a.description} <span style="color: #666; font-size: 12px;">(${a.date || 'N/A'})</span></li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Next Steps -->
          ${this.nextSteps && this.nextSteps.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
                📋 Next Steps
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${this.nextSteps.map(step => `
                <tr>
                  <td style="padding: 10px; background-color: #eff6ff; border-left: 3px solid #3B82F6; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${step.activity}</div>
                    <div style="font-size: 12px; color: #666;">
                      Owner: ${step.owner || 'Unassigned'} | Target: ${step.targetDate || 'N/A'}
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Risks -->
          ${this.risks && this.risks.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #EF4444; padding-bottom: 10px;">
                ⚠️ Risk Management
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${this.risks.map(risk => `
                <tr>
                  <td style="padding: 10px; background-color: #fef2f2; border-left: 3px solid ${statusColors[risk.severity] || '#EF4444'}; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${risk.description}</div>
                    <div style="font-size: 12px; color: #666;">
                      Severity: <span style="color: ${statusColors[risk.severity] || '#EF4444'}; font-weight: 600; text-transform: uppercase;">${risk.severity}</span> | 
                      Action: ${risk.action || 'None'} | Due: ${risk.dueDate || 'N/A'}
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Open Items -->
          ${openOil.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
                🔴 Open Items Requiring Attention
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${openOil.slice(0, 5).map(item => `
                <tr>
                  <td style="padding: 10px; background-color: #fff8e6; border-left: 3px solid #F59E0B; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.description}</div>
                    <div style="font-size: 12px; color: #666;">
                      Priority: <span style="color: ${item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#F59E0B' : '#10B981'}; font-weight: 600; text-transform: uppercase;">${item.priority}</span> | 
                      Assigned: ${item.assignedTo || 'Unassigned'} |
                      Due: ${item.targetDate || 'No date'}
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
              ${openOil.length > 5 ? `<p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">...and ${openOil.length - 5} more open items</p>` : ''}
            </td>
          </tr>
          ` : ''}
          
          <!-- Project Links -->
          ${d.links ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #00B2E3; padding-bottom: 10px;">
                🔗 Project Links
              </h2>
              <div style="background-color: #f0f9ff; border-radius: 6px; padding: 15px;">
                <a href="${d.links}" style="color: #00B2E3; text-decoration: none; font-weight: 500;">${d.links}</a>
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Comments -->
          ${d.comments ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #6B7280; padding-bottom: 10px;">
                📝 Additional Comments
              </h2>
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; color: #374151; line-height: 1.6;">
                ${d.comments.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Generated by PSA BDP Project Management System<br>
                &copy; ${new Date().getFullYear()} PSA BDP - Global Ocean Freight
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    // Generate plain text version for mailto
    const subject = `[PSA BDP] Weekly Project Status - ${project.name} - Week ${d.week || 'Current'}`;
    
    // Show modal with email preview and options
    const modalContent = `
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 1rem;">
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius);">
          <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: var(--text-secondary);"><strong>Asunto:</strong></p>
          <p style="margin: 0; font-size: 0.875rem;">${subject}</p>
        </div>
        
        <p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: var(--text-secondary);">Vista previa del email:</p>
        <div style="border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;">
          <iframe id="email-preview-frame" style="width: 100%; height: 300px; border: none;"></iframe>
        </div>
        
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-copy-html-email" style="flex: 1; min-width: 200px;">
            <i data-lucide="copy"></i> Copiar HTML para Outlook
          </button>
          <button class="btn btn-outline" id="btn-open-mailto" style="flex: 1; min-width: 200px;">
            <i data-lucide="mail"></i> Abrir cliente email
          </button>
        </div>
        
        <div id="copy-success-msg" style="margin-top: 1rem; padding: 0.75rem; background: #d1fae5; color: #065f46; border-radius: var(--radius); display: none; text-align: center;">
          <i data-lucide="check-circle" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>
          HTML copiado al portapapeles. Pégalo en Outlook/Gmail.
        </div>
      </div>
    `;
    
    App.openModal('Generar Email desde PSR', modalContent, null, { hideCancel: true, confirmText: 'Cerrar' });
    
    // Set iframe content after modal opens
    setTimeout(() => {
      const iframe = document.getElementById('email-preview-frame');
      if (iframe) {
        iframe.srcdoc = htmlEmail;
      }
      
      // Copy HTML button
      document.getElementById('btn-copy-html-email')?.addEventListener('click', () => {
        navigator.clipboard.writeText(htmlEmail).then(() => {
          const successMsg = document.getElementById('copy-success-msg');
          if (successMsg) {
            successMsg.style.display = 'block';
            setTimeout(() => successMsg.style.display = 'none', 3000);
          }
          App.toast('HTML copiado al portapapeles', 'success');
        }).catch(err => {
          console.error('Error copying:', err);
          App.toast('Error al copiar. Intenta seleccionar y copiar manualmente.', 'error');
        });
      });
      
      // Open mailto button
      document.getElementById('btn-open-mailto')?.addEventListener('click', () => {
        // Create a text-only version for mailto
        const plainTextBody = `Project Status Report: ${project.name}
Week of: ${reportDate}

OVERALL PROGRESS: ${d.progress || 0}%

HEALTH INDICATORS:
- Schedule: ${d.schedule || 'green'}${d.scheduleComment ? ' - ' + d.scheduleComment : ''}
- Budget: ${d.budget || 'green'}${d.budgetComment ? ' - ' + d.budgetComment : ''}
- Resources: ${d.resources || 'green'}${d.resourcesComment ? ' - ' + d.resourcesComment : ''}
- Scope: ${d.scope || 'green'}${d.scopeComment ? ' - ' + d.scopeComment : ''}

${this.accomplishments?.length > 0 ? `
KEY ACCOMPLISHMENTS:
${this.accomplishments.map(a => `- ${a.description} (${a.date || 'N/A'})`).join('\n')}
` : ''}

${this.nextSteps?.length > 0 ? `
NEXT STEPS:
${this.nextSteps.map(step => `- ${step.activity} (Owner: ${step.owner || 'Unassigned'}, Target: ${step.targetDate || 'N/A'})`).join('\n')}
` : ''}

${openOil.length > 0 ? `
OPEN ITEMS REQUIRING ATTENTION:
${openOil.slice(0, 5).map(item => `- ${item.description} [Priority: ${item.priority}, Assigned: ${item.assignedTo || 'Unassigned'}]`).join('\n')}
${openOil.length > 5 ? `\n...and ${openOil.length - 5} more open items` : ''}
` : ''}

${d.comments ? `
ADDITIONAL COMMENTS:
${d.comments}
` : ''}

---
Generated by PSA BDP Project Management System`;
        
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody.substring(0, 1500))}`;
        window.open(mailtoLink, '_blank');
      });
      
      lucide.createIcons();
    }, 100);
  }
};
