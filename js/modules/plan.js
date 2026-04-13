/**
 * Project Plan Module (Gantt)
 */

const PlanModule = {
  tasks: [],
  hideCompleted: false,

  async load() {
    if (!App.currentProject) return;
    
    this.tasks = await DB.getAll(STORES.TASKS, 'projectId', App.currentProject.id);
    this.renderKPIs();
    this.renderGantt();
    this.renderTaskList();
    this.bindEvents();
  },

  renderKPIs() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
    const delayed = this.tasks.filter(t => {
      if (t.status === 'completed') return false;
      const end = new Date(t.endDate);
      return end < new Date() && t.progress < 100;
    }).length;
    
    document.getElementById('plan-kpi-total').textContent = total;
    document.getElementById('plan-kpi-completed').textContent = completed;
    document.getElementById('plan-kpi-progress').textContent = inProgress;
    document.getElementById('plan-kpi-delayed').textContent = delayed;
    
    // Update project progress
    const progress = total > 0 ? Math.round(this.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total) : 0;
    App.updateProject({ progress });
  },

  renderGantt() {
    const container = document.getElementById('gantt-container');
    
    if (this.tasks.length === 0) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);">No hay tareas para mostrar</div>';
      return;
    }
    
    // Get date range
    let minDate = new Date(this.tasks[0].startDate);
    let maxDate = new Date(this.tasks[0].endDate);
    
    this.tasks.forEach(t => {
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    });
    
    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const days = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    // Generate header
    let headerHtml = '<div class="gantt-task-column">Tarea</div><div class="gantt-timeline">';
    const current = new Date(minDate);
    for (let i = 0; i <= days; i++) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const dateStr = current.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      headerHtml += `<div class="gantt-day ${isWeekend ? 'weekend' : ''}">${dateStr}</div>`;
      current.setDate(current.getDate() + 1);
    }
    headerHtml += '</div>';
    
    // Generate rows
    let bodyHtml = '';
    const phases = [...new Set(this.tasks.map(t => t.phase))];
    
    phases.forEach(phase => {
      const phaseTasks = this.tasks.filter(t => t.phase === phase);
      if (this.hideCompleted) {
        const filtered = phaseTasks.filter(t => t.status !== 'completed');
        if (filtered.length === 0) return;
      }
      
      bodyHtml += `<div class="gantt-row" style="background:var(--bg-tertiary);font-weight:600;">
        <div class="gantt-task-info">${App.escapeHtml(phase)}</div>
        <div class="gantt-task-bar-area"></div>
      </div>`;
      
      phaseTasks.forEach(task => {
        if (this.hideCompleted && task.status === 'completed') return;
        
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const offsetDays = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        
        const statusColors = {
          'not-started': '#94A3B8',
          'in-progress': '#3B82F6',
          'completed': '#10B981',
          'blocked': '#EF4444'
        };
        
        bodyHtml += `
          <div class="gantt-row">
            <div class="gantt-task-info">${App.escapeHtml(task.name)}</div>
            <div class="gantt-task-bar-area">
              <div class="gantt-task-bar" style="
                left: ${offsetDays * 40}px;
                width: ${duration * 40}px;
                background: ${statusColors[task.status] || '#3B82F6'};
              " title="${task.name}: ${task.progress || 0}%">
                ${task.progress || 0}%
              </div>
            </div>
          </div>
        `;
      });
    });
    
    container.innerHTML = `
      <div class="gantt-header">${headerHtml}</div>
      <div class="gantt-body">${bodyHtml}</div>
    `;
  },

  renderTaskList() {
    const tbody = document.getElementById('tasks-tbody');
    const empty = document.getElementById('tasks-empty');
    const table = document.querySelector('#tasks-table');
    
    let tasks = this.tasks;
    if (this.hideCompleted) {
      tasks = tasks.filter(t => t.status !== 'completed');
    }
    
    if (tasks.length === 0) {
      table.parentElement.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    const statusLabels = {
      'not-started': { text: 'No iniciada', class: 'badge-neutral' },
      'in-progress': { text: 'En progreso', class: 'badge-warning' },
      'completed': { text: 'Completada', class: 'badge-success' },
      'blocked': { text: 'Bloqueada', class: 'badge-danger' }
    };
    
    tbody.innerHTML = tasks.map(task => {
      const status = statusLabels[task.status] || statusLabels['not-started'];
      return `
        <tr data-id="${task.id}">
          <td>${App.escapeHtml(task.phase || '-')}</td>
          <td>${App.escapeHtml(task.name)}</td>
          <td>${App.escapeHtml(task.responsible || '-')}</td>
          <td>${App.formatDate(task.startDate)}</td>
          <td>${App.formatDate(task.endDate)}</td>
          <td>
            <div class="progress-bar" style="width:80px;">
              <div class="progress-bar-fill ${(task.progress || 0) >= 100 ? 'success' : (task.progress || 0) > 50 ? '' : 'warning'}" style="width:${task.progress || 0}%"></div>
            </div>
            <span style="font-size:0.75rem;color:var(--text-tertiary);">${task.progress || 0}%</span>
          </td>
          <td><span class="badge ${status.class}">${status.text}</span></td>
          <td>${App.escapeHtml(task.dependencies || '-')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="PlanModule.edit(${task.id})" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="PlanModule.delete(${task.id})" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-task')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-task-empty')?.addEventListener('click', () => this.add());
    document.getElementById('btn-export-plan')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-save-baseline')?.addEventListener('click', () => this.saveBaseline());
    
    document.getElementById('plan-hide-completed')?.addEventListener('change', (e) => {
      this.hideCompleted = e.target.checked;
      this.renderGantt();
      this.renderTaskList();
    });
  },

  add() {
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nombre de la Tarea</label>
          <input type="text" class="form-control" id="task-name" placeholder="Ej: Análisis de requisitos">
        </div>
        <div class="form-group">
          <label class="form-label required">Fase</label>
          <select class="form-select" id="task-phase">
            <option value="Initiation">Initiation</option>
            <option value="Planning">Planning</option>
            <option value="Development">Development</option>
            <option value="Testing">Testing</option>
            <option value="UAT">UAT</option>
            <option value="Go-Live">Go-Live</option>
            <option value="Post-Go-Live">Post-Go-Live</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fecha Inicio</label>
          <input type="date" class="form-control" id="task-start">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Fin</label>
          <input type="date" class="form-control" id="task-end">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Responsable</label>
          <input type="text" class="form-control" id="task-responsible" placeholder="Nombre del responsable">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="task-status">
            <option value="not-started">No iniciada</option>
            <option value="in-progress">En progreso</option>
            <option value="completed">Completada</option>
            <option value="blocked">Bloqueada</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Progreso (%)</label>
          <input type="number" class="form-control" id="task-progress" min="0" max="100" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">Dependencias</label>
          <input type="text" class="form-control" id="task-dependencies" placeholder="Ej: Tarea 1, Tarea 2">
        </div>
      </div>
    `;
    
    App.openModal('Nueva Tarea', content, async () => {
      const name = document.getElementById('task-name').value.trim();
      const startDate = document.getElementById('task-start').value;
      const endDate = document.getElementById('task-end').value;
      
      if (!name || !startDate || !endDate) {
        App.toast('Nombre, fecha inicio y fecha fin son obligatorios', 'error');
        return false;
      }
      
      if (new Date(endDate) < new Date(startDate)) {
        App.toast('La fecha fin debe ser posterior a la fecha inicio', 'error');
        return false;
      }
      
      const task = {
        projectId: App.currentProject.id,
        name,
        phase: document.getElementById('task-phase').value,
        startDate,
        endDate,
        responsible: document.getElementById('task-responsible').value.trim(),
        status: document.getElementById('task-status').value,
        progress: parseInt(document.getElementById('task-progress').value) || 0,
        dependencies: document.getElementById('task-dependencies').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.TASKS, task);
      await this.load();
      App.toast('Tarea creada', 'success');
    });
  },

  async edit(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nombre de la Tarea</label>
          <input type="text" class="form-control" id="task-name" value="${App.escapeHtml(task.name)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Fase</label>
          <select class="form-select" id="task-phase">
            <option value="Initiation" ${task.phase === 'Initiation' ? 'selected' : ''}>Initiation</option>
            <option value="Planning" ${task.phase === 'Planning' ? 'selected' : ''}>Planning</option>
            <option value="Development" ${task.phase === 'Development' ? 'selected' : ''}>Development</option>
            <option value="Testing" ${task.phase === 'Testing' ? 'selected' : ''}>Testing</option>
            <option value="UAT" ${task.phase === 'UAT' ? 'selected' : ''}>UAT</option>
            <option value="Go-Live" ${task.phase === 'Go-Live' ? 'selected' : ''}>Go-Live</option>
            <option value="Post-Go-Live" ${task.phase === 'Post-Go-Live' ? 'selected' : ''}>Post-Go-Live</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fecha Inicio</label>
          <input type="date" class="form-control" id="task-start" value="${task.startDate}">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Fin</label>
          <input type="date" class="form-control" id="task-end" value="${task.endDate}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Responsable</label>
          <input type="text" class="form-control" id="task-responsible" value="${App.escapeHtml(task.responsible || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="task-status">
            <option value="not-started" ${task.status === 'not-started' ? 'selected' : ''}>No iniciada</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>En progreso</option>
            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completada</option>
            <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Bloqueada</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Progreso (%)</label>
          <input type="number" class="form-control" id="task-progress" min="0" max="100" value="${task.progress || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Dependencias</label>
          <input type="text" class="form-control" id="task-dependencies" value="${App.escapeHtml(task.dependencies || '')}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Tarea', content, async () => {
      const name = document.getElementById('task-name').value.trim();
      const startDate = document.getElementById('task-start').value;
      const endDate = document.getElementById('task-end').value;
      
      if (!name || !startDate || !endDate) {
        App.toast('Nombre, fecha inicio y fecha fin son obligatorios', 'error');
        return false;
      }
      
      const updated = {
        ...task,
        name,
        phase: document.getElementById('task-phase').value,
        startDate,
        endDate,
        responsible: document.getElementById('task-responsible').value.trim(),
        status: document.getElementById('task-status').value,
        progress: parseInt(document.getElementById('task-progress').value) || 0,
        dependencies: document.getElementById('task-dependencies').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.TASKS, updated);
      await this.load();
      App.toast('Tarea actualizada', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar esta tarea?');
    if (!confirmed) return;
    
    await DB.delete(STORES.TASKS, id);
    await this.load();
    App.toast('Tarea eliminada', 'success');
  },

  exportCSV() {
    const data = this.tasks.map(t => ({
      Fase: t.phase,
      Tarea: t.name,
      Responsable: t.responsible,
      Inicio: t.startDate,
      Fin: t.endDate,
      Progreso: t.progress + '%',
      Estado: t.status,
      Dependencias: t.dependencies
    }));
    
    ScopeModule.downloadCSV(data, 'project-plan.csv');
  },

  saveBaseline() {
    // Store current dates as baseline
    this.tasks.forEach(task => {
      task.baselineStart = task.startDate;
      task.baselineEnd = task.endDate;
    });
    
    Promise.all(this.tasks.map(t => DB.put(STORES.TASKS, t))).then(() => {
      App.toast('Plan inicial guardado', 'success');
    });
  }
};
