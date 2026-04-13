/**
 * Vacation Coverage Module
 */

const VacationModule = {
  entries: [],
  participants: [],

  async load() {
    if (!App.currentProject) return;
    
    this.entries = await DB.getAll(STORES.VACATION, 'projectId', App.currentProject.id);
    this.entries.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Load project participants for dropdown
    this.participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', App.currentProject.id);
    
    this.render();
    this.bindEvents();
  },

  getParticipantOptions(selectedName = '') {
    if (this.participants.length === 0) {
      return '<option value="">No hay participantes registrados</option>';
    }
    
    return this.participants.map(p => 
      `<option value="${App.escapeHtml(p.name)}" ${p.name === selectedName ? 'selected' : ''}>${App.escapeHtml(p.name)} - ${App.escapeHtml(p.role || 'Sin rol')}</option>`
    ).join('');
  },

  getBackupOptions(selectedName = '') {
    const options = this.participants.map(p => 
      `<option value="${App.escapeHtml(p.name)}" ${p.name === selectedName ? 'selected' : ''}>${App.escapeHtml(p.name)}</option>`
    ).join('');
    return `<option value="">Seleccionar backup...</option>${options}`;
  },

  render() {
    const tbody = document.getElementById('vacation-tbody');
    const empty = document.getElementById('vacation-empty');
    const table = document.querySelector('#vacation-table');
    
    if (this.entries.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    tbody.innerHTML = this.entries.map(entry => {
      const duration = App.daysBetween(entry.startDate, entry.endDate);
      const isCurrent = new Date() >= new Date(entry.startDate) && new Date() <= new Date(entry.endDate);
      const isPast = new Date() > new Date(entry.endDate);
      
      return `
        <tr data-id="${entry.id}" style="${isCurrent ? 'background:rgba(245,158,11,0.05);' : isPast ? 'opacity:0.6;' : ''}">
          <td>
            ${App.escapeHtml(entry.memberName)}
            ${isCurrent ? '<span class="badge badge-warning" style="margin-left:0.5rem;">Actual</span>' : ''}
          </td>
          <td>${App.escapeHtml(entry.role || '-')}</td>
          <td>${App.formatDate(entry.startDate)}</td>
          <td>${App.formatDate(entry.endDate)}</td>
          <td>${duration} días</td>
          <td>${App.escapeHtml(entry.backup || '-')}</td>
          <td>${App.escapeHtml(entry.notes || '-')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="VacationModule.edit(${entry.id})" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="VacationModule.delete(${entry.id})" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-vacation')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-vacation-empty')?.addEventListener('click', () => this.add());
  },

  add() {
    if (this.participants.length === 0) {
      App.toast('Primero debes añadir participantes en la sección de Participantes', 'error');
      return;
    }
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Team Member</label>
          <select class="form-select" id="vac-member">
            <option value="">Seleccionar miembro...</option>
            ${this.getParticipantOptions()}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Rol (auto)</label>
          <input type="text" class="form-control" id="vac-role" placeholder="Se rellena automáticamente" readonly style="background:var(--bg-tertiary);">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fecha Inicio</label>
          <input type="date" class="form-control" id="vac-start">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Fin</label>
          <input type="date" class="form-control" id="vac-end">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Backup Assigned</label>
          <select class="form-select" id="vac-backup">
            ${this.getBackupOptions()}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <input type="text" class="form-control" id="vac-notes" placeholder="Información adicional">
        </div>
      </div>
    `;
    
    App.openModal('Añadir Vacaciones', content, async () => {
      const member = document.getElementById('vac-member').value;
      const startDate = document.getElementById('vac-start').value;
      const endDate = document.getElementById('vac-end').value;
      
      if (!member || !startDate || !endDate) {
        App.toast('Miembro, fecha inicio y fecha fin son obligatorios', 'error');
        return false;
      }
      
      if (new Date(endDate) < new Date(startDate)) {
        App.toast('La fecha fin debe ser posterior a la fecha inicio', 'error');
        return false;
      }
      
      const entry = {
        projectId: App.currentProject.id,
        memberName: member,
        role: document.getElementById('vac-role').value.trim(),
        startDate,
        endDate,
        backup: document.getElementById('vac-backup').value,
        notes: document.getElementById('vac-notes').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.VACATION, entry);
      await this.load();
      App.toast('Vacaciones registradas', 'success');
    });
    
    // Auto-fill role when member selected
    setTimeout(() => {
      document.getElementById('vac-member')?.addEventListener('change', (e) => {
        const selected = this.participants.find(p => p.name === e.target.value);
        if (selected) {
          document.getElementById('vac-role').value = selected.role || '';
        }
      });
    }, 100);
  },

  async edit(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Team Member</label>
          <select class="form-select" id="vac-member">
            <option value="">Seleccionar miembro...</option>
            ${this.getParticipantOptions(entry.memberName)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Rol (auto)</label>
          <input type="text" class="form-control" id="vac-role" value="${App.escapeHtml(entry.role || '')}" readonly style="background:var(--bg-tertiary);">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Fecha Inicio</label>
          <input type="date" class="form-control" id="vac-start" value="${entry.startDate}">
        </div>
        <div class="form-group">
          <label class="form-label required">Fecha Fin</label>
          <input type="date" class="form-control" id="vac-end" value="${entry.endDate}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Backup Assigned</label>
          <select class="form-select" id="vac-backup">
            ${this.getBackupOptions(entry.backup)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <input type="text" class="form-control" id="vac-notes" value="${App.escapeHtml(entry.notes || '')}">
        </div>
      </div>
    `;
    
    App.openModal('Editar Vacaciones', content, async () => {
      const member = document.getElementById('vac-member').value;
      const startDate = document.getElementById('vac-start').value;
      const endDate = document.getElementById('vac-end').value;
      
      if (!member || !startDate || !endDate) {
        App.toast('Miembro, fecha inicio y fecha fin son obligatorios', 'error');
        return false;
      }
      
      const updated = {
        ...entry,
        memberName: member,
        role: document.getElementById('vac-role').value.trim(),
        startDate,
        endDate,
        backup: document.getElementById('vac-backup').value,
        notes: document.getElementById('vac-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.VACATION, updated);
      await this.load();
      App.toast('Vacaciones actualizadas', 'success');
    });
    
    // Auto-fill role when member selected
    setTimeout(() => {
      document.getElementById('vac-member')?.addEventListener('change', (e) => {
        const selected = this.participants.find(p => p.name === e.target.value);
        if (selected) {
          document.getElementById('vac-role').value = selected.role || '';
        }
      });
    }, 100);
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar este registro de vacaciones?');
    if (!confirmed) return;
    
    await DB.delete(STORES.VACATION, id);
    await this.load();
    App.toast('Registro eliminado', 'success');
  }
};
