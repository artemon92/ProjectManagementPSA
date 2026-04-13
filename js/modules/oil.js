/**
 * OIL (Open Item List) Module
 */

const OilModule = {
  items: [],
  filters: { status: 'all', priority: 'all', assignee: 'all' },

  async load() {
    if (!App.currentProject) return;
    
    this.items = await DB.getAll(STORES.OIL, 'projectId', App.currentProject.id);
    this.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    this.updateAssigneeFilter();
    this.render();
    this.bindEvents();
  },

  updateAssigneeFilter() {
    const assignees = [...new Set(this.items.map(i => i.assignedTo).filter(Boolean))];
    const select = document.getElementById('oil-filter-assignee');
    
    // Keep "All" option
    select.innerHTML = '<option value="all">Todos</option>';
    assignees.forEach(a => {
      select.innerHTML += `<option value="${App.escapeHtml(a)}">${App.escapeHtml(a)}</option>`;
    });
  },

  render() {
    const filtered = this.getFilteredItems();
    const tbody = document.getElementById('oil-tbody');
    const empty = document.getElementById('oil-empty');
    const table = document.querySelector('#oil-table');
    
    if (filtered.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    const priorityConfig = {
      critical: { class: 'badge-danger', label: 'Crítica' },
      high: { class: 'badge-warning', label: 'Alta' },
      medium: { class: 'badge-info', label: 'Media' },
      low: { class: 'badge-neutral', label: 'Baja' }
    };
    
    const statusConfig = {
      open: { class: 'badge-neutral', label: 'Open' },
      'in-progress': { class: 'badge-warning', label: 'In Progress' },
      'on-hold': { class: 'badge-info', label: 'On Hold' },
      completed: { class: 'badge-success', label: 'Completed' }
    };
    
    tbody.innerHTML = filtered.map((item, index) => {
      const priority = priorityConfig[item.priority] || priorityConfig.medium;
      const status = statusConfig[item.status] || statusConfig.open;
      
      return `
        <tr data-id="${item.id}">
          <td>${index + 1}</td>
          <td>${App.escapeHtml(item.description)}</td>
          <td>${App.escapeHtml(item.raisedBy || '-')}</td>
          <td>${App.escapeHtml(item.assignedTo || '-')}</td>
          <td><span class="badge ${priority.class}">${priority.label}</span></td>
          <td>${App.formatDate(item.targetDate)}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${App.escapeHtml(item.comments || '-')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="OilModule.edit(${item.id})" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="OilModule.delete(${item.id})" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  getFilteredItems() {
    const search = document.getElementById('oil-search')?.value.toLowerCase() || '';
    
    return this.items.filter(item => {
      if (this.filters.status !== 'all' && item.status !== this.filters.status) return false;
      if (this.filters.priority !== 'all' && item.priority !== this.filters.priority) return false;
      if (this.filters.assignee !== 'all' && item.assignedTo !== this.filters.assignee) return false;
      if (search && !item.description?.toLowerCase().includes(search) && 
          !item.comments?.toLowerCase().includes(search)) return false;
      return true;
    });
  },

  bindEvents() {
    document.getElementById('btn-add-oil-item')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-oil-empty')?.addEventListener('click', () => this.add());
    document.getElementById('btn-export-oil')?.addEventListener('click', () => this.export());
    
    document.getElementById('oil-filter-status')?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.render();
    });
    
    document.getElementById('oil-filter-priority')?.addEventListener('change', (e) => {
      this.filters.priority = e.target.value;
      this.render();
    });
    
    document.getElementById('oil-filter-assignee')?.addEventListener('change', (e) => {
      this.filters.assignee = e.target.value;
      this.render();
    });
    
    document.getElementById('oil-search')?.addEventListener('input', () => this.render());
  },

  add() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Issue Description</label>
        <textarea class="form-textarea" id="oil-description" rows="3" placeholder="Describe el issue..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Raised By</label>
          <input type="text" class="form-control" id="oil-raised" placeholder="Quién reportó el issue">
        </div>
        <div class="form-group">
          <label class="form-label">Assigned To</label>
          <input type="text" class="form-control" id="oil-assigned" placeholder="Responsable de resolver">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Prioridad</label>
          <select class="form-select" id="oil-priority">
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium" selected>Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Deadline</label>
          <input type="date" class="form-control" id="oil-target">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="oil-status">
            <option value="open" selected>Open</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comments</label>
          <input type="text" class="form-control" id="oil-comments" placeholder="Notas adicionales...">
        </div>
      </div>
    `;
    
    App.openModal('Nuevo Open Item', content, async () => {
      const description = document.getElementById('oil-description').value.trim();
      if (!description) {
        App.toast('La descripción es obligatoria', 'error');
        return false;
      }
      
      const item = {
        projectId: App.currentProject.id,
        description,
        raisedBy: document.getElementById('oil-raised').value.trim(),
        assignedTo: document.getElementById('oil-assigned').value.trim(),
        priority: document.getElementById('oil-priority').value,
        targetDate: document.getElementById('oil-target').value,
        status: document.getElementById('oil-status').value,
        comments: document.getElementById('oil-comments').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.OIL, item);
      await this.load();
      App.toast('Item añadido', 'success');
    });
  },

  async edit(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    
    const content = `
      <div class="form-group">
        <label class="form-label required">Issue Description</label>
        <textarea class="form-textarea" id="oil-description" rows="3">${App.escapeHtml(item.description)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Raised By</label>
          <input type="text" class="form-control" id="oil-raised" value="${App.escapeHtml(item.raisedBy || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Assigned To</label>
          <input type="text" class="form-control" id="oil-assigned" value="${App.escapeHtml(item.assignedTo || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Prioridad</label>
          <select class="form-select" id="oil-priority">
            <option value="critical" ${item.priority === 'critical' ? 'selected' : ''}>Crítica</option>
            <option value="high" ${item.priority === 'high' ? 'selected' : ''}>Alta</option>
            <option value="medium" ${item.priority === 'medium' ? 'selected' : ''}>Media</option>
            <option value="low" ${item.priority === 'low' ? 'selected' : ''}>Baja</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Deadline</label>
          <input type="date" class="form-control" id="oil-target" value="${item.targetDate || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="oil-status">
            <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="on-hold" ${item.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comments</label>
          <input type="text" class="form-control" id="oil-comments" value="${App.escapeHtml(item.comments || '')}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Open Item', content, async () => {
      const description = document.getElementById('oil-description').value.trim();
      if (!description) {
        App.toast('La descripción es obligatoria', 'error');
        return false;
      }
      
      const status = document.getElementById('oil-status').value;
      const updated = {
        ...item,
        description,
        raisedBy: document.getElementById('oil-raised').value.trim(),
        assignedTo: document.getElementById('oil-assigned').value.trim(),
        priority: document.getElementById('oil-priority').value,
        targetDate: document.getElementById('oil-target').value,
        status,
        comments: document.getElementById('oil-comments').value.trim(),
        completedAt: status === 'completed' ? new Date().toISOString() : item.completedAt,
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.OIL, updated);
      await this.load();
      App.toast('Item actualizado', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar este open item?');
    if (!confirmed) return;
    
    await DB.delete(STORES.OIL, id);
    await this.load();
    App.toast('Item eliminado', 'success');
  },

  export() {
    const data = this.items.map(item => ({
      ID: item.id,
      Description: item.description,
      'Raised By': item.raisedBy,
      'Assigned To': item.assignedTo,
      Priority: item.priority,
      'Target Date': item.targetDate,
      Status: item.status,
      Comments: item.comments
    }));
    
    ScopeModule.downloadCSV(data, 'oil-items.csv');
  }
};
