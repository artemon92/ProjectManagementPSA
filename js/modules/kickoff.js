/**
 * Kick-off Template Module
 */

const KickoffModule = {
  data: null,

  async load() {
    if (!App.currentProject) return;
    
    this.data = await DB.getById(STORES.KICKOFF, App.currentProject.id);
    if (!this.data) {
      this.data = { projectId: App.currentProject.id };
    }
    
    this.render();
    this.bindEvents();
  },

  render() {
    const d = this.data || {};
    
    document.getElementById('kickoff-metrics').value = d.metrics || '';
    document.getElementById('kickoff-data-sources').value = d.dataSources || '';
    document.getElementById('kickoff-logic').value = d.businessLogic || '';
    document.getElementById('kickoff-integration').value = d.integrationPoints || '';
    document.getElementById('kickoff-update-freq').value = d.updateFrequency || '';
    document.getElementById('kickoff-meetings').value = d.meetings || '';
    document.getElementById('kickoff-escalation').value = d.escalationPath || '';
    document.getElementById('kickoff-decisions').value = d.decisions || '';
    document.getElementById('kickoff-ui').value = d.uiRequirements || '';
    document.getElementById('kickoff-users').value = d.endUsers || '';
  },

  bindEvents() {
    document.getElementById('btn-save-kickoff')?.addEventListener('click', () => this.save());
    document.getElementById('btn-copy-kickoff-email')?.addEventListener('click', () => this.copyForEmail());
  },

  async save() {
    const data = {
      projectId: App.currentProject.id,
      metrics: document.getElementById('kickoff-metrics').value.trim(),
      dataSources: document.getElementById('kickoff-data-sources').value.trim(),
      businessLogic: document.getElementById('kickoff-logic').value.trim(),
      integrationPoints: document.getElementById('kickoff-integration').value.trim(),
      updateFrequency: document.getElementById('kickoff-update-freq').value,
      meetings: document.getElementById('kickoff-meetings').value.trim(),
      escalationPath: document.getElementById('kickoff-escalation').value.trim(),
      decisions: document.getElementById('kickoff-decisions').value.trim(),
      uiRequirements: document.getElementById('kickoff-ui').value.trim(),
      endUsers: document.getElementById('kickoff-users').value.trim(),
      updatedAt: new Date().toISOString()
    };
    
    await DB.put(STORES.KICKOFF, data);
    this.data = data;
    App.toast('Kick-off template guardado', 'success');
  },

  copyForEmail() {
    const cover = CoverModule.data || {};
    const d = this.data || {};
    
    const email = `KICK-OFF TEMPLATE
================

PROYECTO: ${cover.projectName || App.currentProject.name}
CUSTOMER: ${cover.customer || 'N/A'}
PM: ${cover.projectManager || 'N/A'}
FECHAS: ${cover.startDate || 'N/A'} - ${cover.endDate || 'N/A'}

---

SCOPE & ALCANCE

Métricas Clave:
${d.metrics || 'Por definir'}

Fuentes de Datos:
${d.dataSources || 'Por definir'}

Lógica de Negocio:
${d.businessLogic || 'Por definir'}

Puntos de Integración:
${d.integrationPoints || 'Por definir'}

---

GOVERNANCE

Frecuencia Reporting: ${d.updateFrequency || 'Por definir'}
Reuniones: ${d.meetings || 'Por definir'}

Escalation Path:
${d.escalationPath || 'Por definir'}

---

UI/UX REQUIREMENTS
${d.uiRequirements || 'Por definir'}

Stakeholders:
${d.endUsers || 'Por definir'}

---
`;
    
    navigator.clipboard.writeText(email).then(() => {
      App.toast('Copiado al portapapeles', 'success');
    });
  }
};
