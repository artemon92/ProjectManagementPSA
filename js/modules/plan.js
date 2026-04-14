/**
 * Project Plan Module (Gantt)
 */

const PlanModule = {
  tasks: [],
  hideCompleted: false,
  draggedTask: null,
  dragStartX: 0,
  dragType: null, // 'move' or 'resize'
  dayWidth: 40,
  minDate: null,
  maxDate: null,

  async load() {
    if (!App.currentProject) return;
    
    this.tasks = await DB.getAll(STORES.TASKS, 'projectId', App.currentProject.id);
    this.renderKPIs();
    this.renderInteractiveGantt();
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

  renderInteractiveGantt() {
    const container = document.getElementById('gantt-container');
    
    if (this.tasks.length === 0) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);">' + I18n.t('plan.empty') + '</div>';
      return;
    }
    
    // Get date range
    this.minDate = new Date(this.tasks[0].startDate);
    this.maxDate = new Date(this.tasks[0].endDate);
    
    this.tasks.forEach(t => {
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      if (s < this.minDate) this.minDate = s;
      if (e > this.maxDate) this.maxDate = e;
    });
    
    // Add padding
    this.minDate.setDate(this.minDate.getDate() - 3);
    this.maxDate.setDate(this.maxDate.getDate() + 7);
    
    const totalDays = Math.ceil((this.maxDate - this.minDate) / (1000 * 60 * 60 * 24));
    const timelineWidth = totalDays * this.dayWidth;
    
    // Generate timeline header with months
    let headerHtml = '<div class="gantt-timeline-header" style="width:' + timelineWidth + 'px;">';
    const current = new Date(this.minDate);
    let lastMonth = '';
    
    for (let i = 0; i <= totalDays; i++) {
      const month = current.toLocaleDateString('es-ES', { month: 'short' });
      const day = current.getDate();
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      
      if (month !== lastMonth) {
        headerHtml += `<div class="gantt-month" style="left:${i * this.dayWidth}px">${month}</div>`;
        lastMonth = month;
      }
      
      headerHtml += `<div class="gantt-day-header ${isWeekend ? 'weekend' : ''}" style="left:${i * this.dayWidth}px">
        <span class="day-number">${day}</span>
        <span class="day-name">${['D','L','M','X','J','V','S'][current.getDay()]}</span>
      </div>`;
      
      current.setDate(current.getDate() + 1);
    }
    headerHtml += '</div>';
    
    // Generate task list sidebar
    let sidebarHtml = '<div class="gantt-sidebar">';
    
    // Get unique phases
    const phases = [...new Set(this.tasks.map(t => t.phase || 'Sin Fase'))];
    
    phases.forEach(phase => {
      const phaseTasks = this.tasks.filter(t => (t.phase || 'Sin Fase') === phase);
      if (this.hideCompleted) {
        const filtered = phaseTasks.filter(t => t.status !== 'completed');
        if (filtered.length === 0) return;
      }
      
      sidebarHtml += `<div class="gantt-phase-header">${App.escapeHtml(phase)}</div>`;
      
      phaseTasks.forEach(task => {
        if (this.hideCompleted && task.status === 'completed') return;
        
        const isMilestone = task.progress === 100 || task.name.toLowerCase().includes('milestone') || task.name.toLowerCase().includes('hito');
        
        sidebarHtml += `
          <div class="gantt-task-row ${isMilestone ? 'milestone' : ''}" data-task-id="${task.id}">
            <div class="gantt-task-name" title="${App.escapeHtml(task.name)}">
              ${isMilestone ? '<i data-lucide="diamond" class="milestone-icon"></i>' : ''}
              ${App.escapeHtml(task.name)}
            </div>
            <div class="gantt-task-meta">
              <span class="task-assignee">${App.escapeHtml(task.assignee || task.responsible || '-')}</span>
              <span class="task-dates">${App.formatDate(task.startDate)} - ${App.formatDate(task.endDate)}</span>
            </div>
          </div>
        `;
      });
    });
    sidebarHtml += '</div>';
    
    // Generate timeline bars
    let timelineHtml = '<div class="gantt-timeline-body" style="width:' + timelineWidth + 'px;">';
    
    // Add grid lines
    for (let i = 0; i <= totalDays; i++) {
      const isWeekend = (this.minDate.getDay() + i) % 7 === 0 || (this.minDate.getDay() + i) % 7 === 6;
      timelineHtml += `<div class="gantt-grid-line ${isWeekend ? 'weekend' : ''}" style="left:${i * this.dayWidth}px"></div>`;
    }
    
    // Add today line if in range
    const today = new Date();
    if (today >= this.minDate && today <= this.maxDate) {
      const todayOffset = Math.ceil((today - this.minDate) / (1000 * 60 * 60 * 24));
      timelineHtml += `<div class="gantt-today-line" style="left:${todayOffset * this.dayWidth + 20}px"></div>`;
    }
    
    // Add task bars
    phases.forEach(phase => {
      const phaseTasks = this.tasks.filter(t => (t.phase || 'Sin Fase') === phase);
      if (this.hideCompleted) {
        const filtered = phaseTasks.filter(t => t.status !== 'completed');
        if (filtered.length === 0) return;
      }
      
      timelineHtml += `<div class="gantt-phase-spacer"></div>`;
      
      phaseTasks.forEach(task => {
        if (this.hideCompleted && task.status === 'completed') return;
        
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const offsetDays = Math.ceil((start - this.minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        
        const isMilestone = task.progress === 100 || task.name.toLowerCase().includes('milestone') || task.name.toLowerCase().includes('hito');
        
        const statusColors = {
          'not-started': { bg: '#94A3B8', border: '#64748B' },
          'in-progress': { bg: '#3B82F6', border: '#2563EB' },
          'completed': { bg: '#10B981', border: '#059669' },
          'blocked': { bg: '#EF4444', border: '#DC2626' },
          'to-do': { bg: '#94A3B8', border: '#64748B' }
        };
        
        const colors = statusColors[task.status] || statusColors['not-started'];
        
        if (isMilestone) {
          timelineHtml += `
            <div class="gantt-milestone" 
                 data-task-id="${task.id}"
                 style="left: ${(offsetDays * this.dayWidth) + 20 - 8}px;">
              <div class="milestone-diamond" style="background: ${colors.bg}; border-color: ${colors.border};"></div>
              <div class="milestone-label">${App.escapeHtml(task.name)}</div>
            </div>
          `;
        } else {
          timelineHtml += `
            <div class="gantt-bar-container" 
                 data-task-id="${task.id}"
                 style="left: ${offsetDays * this.dayWidth}px; width: ${duration * this.dayWidth}px;">
              <div class="gantt-bar" 
                   style="background: ${colors.bg}; border-color: ${colors.border};"
                   data-task-id="${task.id}">
                <div class="gantt-bar-progress" style="width: ${task.progress || 0}%"></div>
                <span class="gantt-bar-label">${task.progress || 0}%</span>
              </div>
              <div class="gantt-bar-resize-handle" data-task-id="${task.id}"></div>
            </div>
          `;
        }
      });
    });
    
    timelineHtml += '</div>';
    
    container.innerHTML = `
      <div class="gantt-wrapper">
        ${sidebarHtml}
        <div class="gantt-timeline-wrapper">
          <div class="gantt-timeline-scroll">
            ${headerHtml}
            ${timelineHtml}
          </div>
        </div>
      </div>
    `;
    
    // Bind drag events
    this.bindGanttEvents();
    
    // Create icons
    lucide.createIcons();
  },

  bindGanttEvents() {
    const container = document.getElementById('gantt-container');
    if (!container) return;
    
    // Bar drag for moving
    container.querySelectorAll('.gantt-bar').forEach(bar => {
      bar.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const taskId = parseInt(bar.dataset.taskId);
        this.draggedTask = this.tasks.find(t => t.id === taskId);
        this.dragStartX = e.clientX;
        this.dragType = 'move';
        bar.parentElement.classList.add('dragging');
      });
    });
    
    // Resize handle
    container.querySelectorAll('.gantt-bar-resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(handle.dataset.taskId);
        this.draggedTask = this.tasks.find(t => t.id === taskId);
        this.dragStartX = e.clientX;
        this.dragType = 'resize';
        handle.parentElement.classList.add('resizing');
      });
    });
    
    // Global mouse events
    document.addEventListener('mousemove', (e) => this.handleDragMove(e));
    document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
  },

  handleDragMove(e) {
    if (!this.draggedTask || !this.dragType) return;
    
    const deltaX = e.clientX - this.dragStartX;
    const deltaDays = Math.round(deltaX / this.dayWidth);
    
    if (this.dragType === 'move') {
      // Visual feedback
      const barContainer = document.querySelector(`.gantt-bar-container[data-task-id="${this.draggedTask.id}"]`);
      if (barContainer) {
        const currentLeft = parseInt(barContainer.style.left);
        barContainer.style.transform = `translateX(${deltaX}px)`;
      }
    } else if (this.dragType === 'resize') {
      // Visual feedback for resize
      const barContainer = document.querySelector(`.gantt-bar-container[data-task-id="${this.draggedTask.id}"]`);
      if (barContainer) {
        const bar = barContainer.querySelector('.gantt-bar');
        const currentWidth = parseInt(barContainer.style.width);
        barContainer.style.width = `${currentWidth + deltaX}px`;
      }
    }
  },

  async handleDragEnd(e) {
    if (!this.draggedTask || !this.dragType) return;
    
    const barContainer = document.querySelector(`.gantt-bar-container[data-task-id="${this.draggedTask.id}"]`);
    const deltaX = e.clientX - this.dragStartX;
    const deltaDays = Math.round(deltaX / this.dayWidth);
    
    if (this.dragType === 'move' && deltaDays !== 0) {
      // Calculate new dates
      const oldStart = new Date(this.draggedTask.startDate);
      const oldEnd = new Date(this.draggedTask.endDate);
      const duration = (oldEnd - oldStart) / (1000 * 60 * 60 * 24);
      
      const newStart = new Date(oldStart);
      newStart.setDate(newStart.getDate() + deltaDays);
      
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + duration);
      
      // Update task
      this.draggedTask.startDate = newStart.toISOString().split('T')[0];
      this.draggedTask.endDate = newEnd.toISOString().split('T')[0];
      this.draggedTask.updatedAt = new Date().toISOString();
      
      await DB.put(STORES.TASKS, this.draggedTask);
      App.toast(I18n.t('plan.task_moved'), 'success');
      
    } else if (this.dragType === 'resize' && deltaDays !== 0) {
      // Calculate new end date
      const oldEnd = new Date(this.draggedTask.endDate);
      const newEnd = new Date(oldEnd);
      newEnd.setDate(newEnd.getDate() + deltaDays);
      
      // Ensure end is after start
      const start = new Date(this.draggedTask.startDate);
      if (newEnd > start) {
        this.draggedTask.endDate = newEnd.toISOString().split('T')[0];
        this.draggedTask.updatedAt = new Date().toISOString();
        
        await DB.put(STORES.TASKS, this.draggedTask);
        App.toast(I18n.t('plan.task_resized'), 'success');
      }
    }
    
    // Reset
    if (barContainer) {
      barContainer.classList.remove('dragging', 'resizing');
      barContainer.style.transform = '';
    }
    
    this.draggedTask = null;
    this.dragType = null;
    
    // Re-render
    await this.load();
  },

  renderGantt() {
    // Fallback to interactive version
    this.renderInteractiveGantt();
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
      const nameInput = document.getElementById('task-name');
      const startInput = document.getElementById('task-start');
      const endInput = document.getElementById('task-end');
      
      const name = nameInput.value.trim();
      const startDate = startInput.value;
      const endDate = endInput.value;
      
      // Reset previous error styles
      nameInput.style.borderColor = '';
      startInput.style.borderColor = '';
      endInput.style.borderColor = '';
      
      let hasError = false;
      
      if (!name) {
        nameInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      if (!startDate) {
        startInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      if (!endDate) {
        endInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      
      if (hasError) {
        App.toast('Completa los campos marcados en rojo', 'error');
        return false;
      }
      
      if (new Date(endDate) < new Date(startDate)) {
        endInput.style.borderColor = '#EF4444';
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
      const nameInput = document.getElementById('task-name');
      const startInput = document.getElementById('task-start');
      const endInput = document.getElementById('task-end');
      
      const name = nameInput.value.trim();
      const startDate = startInput.value;
      const endDate = endInput.value;
      
      // Reset previous error styles
      nameInput.style.borderColor = '';
      startInput.style.borderColor = '';
      endInput.style.borderColor = '';
      
      let hasError = false;
      
      if (!name) {
        nameInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      if (!startDate) {
        startInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      if (!endDate) {
        endInput.style.borderColor = '#EF4444';
        hasError = true;
      }
      
      if (hasError) {
        App.toast('Completa los campos marcados en rojo', 'error');
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
