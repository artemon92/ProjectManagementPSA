/**
 * Participants Module
 */

const ParticipantsModule = {
  participants: [],

  async load() {
    if (!App.currentProject) return;
    
    this.participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', App.currentProject.id);
    this.render();
    this.bindEvents();
  },

  render() {
    const grid = document.getElementById('participants-grid');
    const empty = document.getElementById('participants-empty');
    
    if (this.participants.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    empty.style.display = 'none';
    
    const typeLabels = {
      internal: 'Interno',
      external: 'Externo',
      customer: 'Cliente',
      partner: 'Partner'
    };
    
    grid.innerHTML = this.participants.map(p => `
      <div class="card" style="position:relative;">
        <div style="position:absolute;top:1rem;right:1rem;display:flex;gap:0.5rem;">
          <button class="btn btn-ghost btn-sm" onclick="ParticipantsModule.edit(${p.id})" title="Editar">
            <i data-lucide="edit-2" style="width:16px;height:16px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="ParticipantsModule.delete(${p.id})" title="Eliminar">
            <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
          </button>
        </div>
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
            <div style="width:56px;height:56px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:600;">
              ${(p.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 style="margin:0;">${App.escapeHtml(p.name)}</h4>
              <span class="badge badge-neutral">${typeLabels[p.type] || p.type}</span>
            </div>
          </div>
          <div style="font-size:0.875rem;color:var(--text-secondary);">
            <div style="margin-bottom:0.5rem;"><i data-lucide="briefcase" style="width:14px;height:14px;vertical-align:middle;margin-right:0.5rem;"></i> ${App.escapeHtml(p.role || '-')}</div>
            <div style="margin-bottom:0.5rem;"><i data-lucide="building-2" style="width:14px;height:14px;vertical-align:middle;margin-right:0.5rem;"></i> ${App.escapeHtml(p.company || '-')}</div>
            <div style="margin-bottom:0.5rem;"><i data-lucide="mail" style="width:14px;height:14px;vertical-align:middle;margin-right:0.5rem;"></i> <a href="mailto:${p.email}">${App.escapeHtml(p.email || '-')}</a></div>
            <div><i data-lucide="phone" style="width:14px;height:14px;vertical-align:middle;margin-right:0.5rem;"></i> <a href="tel:${p.phone}">${App.escapeHtml(p.phone || '-')}</a></div>
          </div>
          ${p.notes ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);font-size:0.875rem;color:var(--text-tertiary);">${App.escapeHtml(p.notes)}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-participant')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-participant-empty')?.addEventListener('click', () => this.add());
  },

  add() {
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nombre</label>
          <input type="text" class="form-control" id="part-name" placeholder="Nombre completo">
        </div>
        <div class="form-group">
          <label class="form-label required">Tipo</label>
          <select class="form-select" id="part-type">
            <option value="internal">Interno</option>
            <option value="external">Externo</option>
            <option value="customer">Cliente</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Rol / Cargo</label>
          <input type="text" class="form-control" id="part-role" placeholder="Ej: Project Manager, Developer...">
        </div>
        <div class="form-group">
          <label class="form-label">Empresa</label>
          <input type="text" class="form-control" id="part-company" placeholder="Nombre de la empresa">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="part-email" placeholder="email@ejemplo.com">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="tel" class="form-control" id="part-phone" placeholder="+34 123 456 789">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="part-notes" rows="2" placeholder="Información adicional..."></textarea>
      </div>
    `;
    
    App.openModal('Añadir Participante', content, async () => {
      const name = document.getElementById('part-name').value.trim();
      if (!name) {
        App.toast('El nombre es obligatorio', 'error');
        return false;
      }
      
      const participant = {
        projectId: App.currentProject.id,
        name,
        type: document.getElementById('part-type').value,
        role: document.getElementById('part-role').value.trim(),
        company: document.getElementById('part-company').value.trim(),
        email: document.getElementById('part-email').value.trim(),
        phone: document.getElementById('part-phone').value.trim(),
        notes: document.getElementById('part-notes').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.PARTICIPANTS, participant);
      await this.load();
      App.toast('Participante añadido', 'success');
    });
  },

  async edit(id) {
    const p = this.participants.find(x => x.id === id);
    if (!p) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nombre</label>
          <input type="text" class="form-control" id="part-name" value="${App.escapeHtml(p.name)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Tipo</label>
          <select class="form-select" id="part-type">
            <option value="internal" ${p.type === 'internal' ? 'selected' : ''}>Interno</option>
            <option value="external" ${p.type === 'external' ? 'selected' : ''}>Externo</option>
            <option value="customer" ${p.type === 'customer' ? 'selected' : ''}>Cliente</option>
            <option value="partner" ${p.type === 'partner' ? 'selected' : ''}>Partner</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Rol / Cargo</label>
          <input type="text" class="form-control" id="part-role" value="${App.escapeHtml(p.role || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Empresa</label>
          <input type="text" class="form-control" id="part-company" value="${App.escapeHtml(p.company || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="part-email" value="${App.escapeHtml(p.email || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="tel" class="form-control" id="part-phone" value="${App.escapeHtml(p.phone || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="part-notes" rows="2">${App.escapeHtml(p.notes || '')}</textarea>
      </div>
    `;
    
    App.openModal('Editar Participante', content, async () => {
      const name = document.getElementById('part-name').value.trim();
      if (!name) {
        App.toast('El nombre es obligatorio', 'error');
        return false;
      }
      
      const updated = {
        ...p,
        name,
        type: document.getElementById('part-type').value,
        role: document.getElementById('part-role').value.trim(),
        company: document.getElementById('part-company').value.trim(),
        email: document.getElementById('part-email').value.trim(),
        phone: document.getElementById('part-phone').value.trim(),
        notes: document.getElementById('part-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.PARTICIPANTS, updated);
      await this.load();
      App.toast('Participante actualizado', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar este participante?');
    if (!confirmed) return;
    
    await DB.delete(STORES.PARTICIPANTS, id);
    await this.load();
    App.toast('Participante eliminado', 'success');
  }
};
