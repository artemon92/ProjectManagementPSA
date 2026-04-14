/**
 * Scope Module
 * Manages project requirements and scope items
 */

const ScopeModule = {
  items: [],
  filters: { phase: 'all', priority: 'all', status: 'all' },

  async load() {
    if (!App.currentProject) return;
    
    this.items = await DB.getAll(STORES.SCOPE, 'projectId', App.currentProject.id);
    this.render();
    this.bindEvents();
  },

  render() {
    const filtered = this.getFilteredItems();
    const tbody = document.getElementById('scope-tbody');
    const empty = document.getElementById('scope-empty');
    const table = document.querySelector('#section-scope .table-container');
    
    if (filtered.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.style.display = 'block';
    empty.style.display = 'none';
    
    const phaseLabels = {
      pre: I18n.t('phase.pre').split(' ')[0], // 'Pre-Implementation' -> 'Pre'
      during: I18n.t('phase.during').split(' ')[0], // 'During Implementation' -> 'During'
      post: I18n.t('phase.post').split(' ')[0] // 'Post-Implementation' -> 'Post'
    };
    
    const priorityLabels = {
      high: { text: I18n.t('priority.high'), class: 'priority-high' },
      medium: { text: I18n.t('priority.medium'), class: 'priority-medium' },
      low: { text: I18n.t('priority.low'), class: 'priority-low' }
    };
    
    const statusLabels = {
      pending: { text: I18n.t('status.pending') || 'Pendiente', class: 'badge-neutral' },
      'in-progress': { text: I18n.t('status.in_progress') || 'En progreso', class: 'badge-warning' },
      completed: { text: I18n.t('status.completed'), class: 'badge-success' },
      cancelled: { text: I18n.t('status.cancelled'), class: 'badge-danger' }
    };
    
    tbody.innerHTML = filtered.map((item, index) => {
      const priority = priorityLabels[item.priority] || priorityLabels.medium;
      const status = statusLabels[item.status] || statusLabels.pending;
      
      return `
        <tr data-id="${item.id}">
          <td>${index + 1}</td>
          <td>${App.escapeHtml(item.requirement)}</td>
          <td>${phaseLabels[item.phase] || item.phase}</td>
          <td>
            <span class="priority ${priority.class}">
              <span class="priority-dot"></span> ${priority.text}
            </span>
          </td>
          <td><span class="badge ${status.class}">${status.text}</span></td>
          <td>${App.escapeHtml(item.comments || '-')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="ScopeModule.edit(${item.id})" title="${I18n.t('action.edit')}">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="ScopeModule.delete(${item.id})" title="${I18n.t('action.delete')}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    // Add buttons
    document.getElementById('btn-add-scope-item')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-scope-empty')?.addEventListener('click', () => this.add());
    
    // Filters
    document.getElementById('scope-filter-phase')?.addEventListener('change', (e) => {
      this.filters.phase = e.target.value;
      this.render();
    });
    
    document.getElementById('scope-filter-priority')?.addEventListener('change', (e) => {
      this.filters.priority = e.target.value;
      this.render();
    });
    
    document.getElementById('scope-filter-status')?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.render();
    });
    
    // Export
    document.getElementById('btn-export-scope')?.addEventListener('click', () => this.export());
  },

  getFilteredItems() {
    return this.items.filter(item => {
      if (this.filters.phase !== 'all' && item.phase !== this.filters.phase) return false;
      if (this.filters.priority !== 'all' && item.priority !== this.filters.priority) return false;
      if (this.filters.status !== 'all' && item.status !== this.filters.status) return false;
      return true;
    });
  },

  add() {
    const content = `
      <div class="form-group">
        <label class="form-label required">Requisito / Scope Item</label>
        <textarea class="form-textarea" id="scope-req" rows="3" placeholder="Describe el requisito..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fase</label>
          <select class="form-select" id="scope-phase">
            <option value="pre">Pre-Implementación</option>
            <option value="during">During Implementation</option>
            <option value="post">Post-Implementation</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Prioridad</label>
          <select class="form-select" id="scope-priority">
            <option value="high">Alta</option>
            <option value="medium" selected>Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="scope-status">
            <option value="pending" selected>Pendiente</option>
            <option value="in-progress">En progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comments</label>
          <input type="text" class="form-control" id="scope-comments" placeholder="Notas adicionales...">
        </div>
      </div>
    `;
    
    App.openModal('Añadir Item de Scope', content, async () => {
      const requirement = document.getElementById('scope-req').value.trim();
      if (!requirement) {
        App.toast('El requisito es obligatorio', 'error');
        return false;
      }
      
      const item = {
        projectId: App.currentProject.id,
        requirement,
        phase: document.getElementById('scope-phase').value,
        priority: document.getElementById('scope-priority').value,
        status: document.getElementById('scope-status').value,
        comments: document.getElementById('scope-comments').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.SCOPE, item);
      await this.load();
      App.toast('Item añadido', 'success');
    });
  },

  async edit(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    
    const content = `
      <div class="form-group">
        <label class="form-label required">Requisito / Scope Item</label>
        <textarea class="form-textarea" id="scope-req" rows="3">${App.escapeHtml(item.requirement)}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fase</label>
          <select class="form-select" id="scope-phase">
            <option value="pre" ${item.phase === 'pre' ? 'selected' : ''}>Pre-Implementación</option>
            <option value="during" ${item.phase === 'during' ? 'selected' : ''}>During Implementation</option>
            <option value="post" ${item.phase === 'post' ? 'selected' : ''}>Post-Implementation</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Prioridad</label>
          <select class="form-select" id="scope-priority">
            <option value="high" ${item.priority === 'high' ? 'selected' : ''}>Alta</option>
            <option value="medium" ${item.priority === 'medium' ? 'selected' : ''}>Media</option>
            <option value="low" ${item.priority === 'low' ? 'selected' : ''}>Baja</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="scope-status">
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pendiente</option>
            <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>En progreso</option>
            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completado</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comments</label>
          <input type="text" class="form-control" id="scope-comments" value="${App.escapeHtml(item.comments || '')}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Item de Scope', content, async () => {
      const requirement = document.getElementById('scope-req').value.trim();
      if (!requirement) {
        App.toast('El requisito es obligatorio', 'error');
        return false;
      }
      
      const updated = {
        ...item,
        requirement,
        phase: document.getElementById('scope-phase').value,
        priority: document.getElementById('scope-priority').value,
        status: document.getElementById('scope-status').value,
        comments: document.getElementById('scope-comments').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.SCOPE, updated);
      await this.load();
      App.toast('Item actualizado', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar este item de scope?');
    if (!confirmed) return;
    
    await DB.delete(STORES.SCOPE, id);
    await this.load();
    App.toast('Item eliminado', 'success');
  },

  export() {
    const data = this.items.map(item => ({
      Requisito: item.requirement,
      Fase: item.phase,
      Prioridad: item.priority,
      Estado: item.status,
      Comments: item.comments
    }));
    
    this.downloadCSV(data, 'scope-items.csv');
  },

  downloadCSV(data, filename) {
    if (data.length === 0) {
      App.toast('No hay datos para exportar', 'warning');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    App.toast('CSV exportado', 'success');
  }
};
