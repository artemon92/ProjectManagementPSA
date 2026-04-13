/**
 * Email Reporting Module
 */

const EmailModule = {
  async load() {
    this.render();
    this.bindEvents();
  },

  render() {
    const project = App.currentProject;
    if (!project) return;
    
    document.getElementById('email-subject').value = `[PSA BDP] Weekly Project Status - ${project.name}`;
    
    // Try to load participants for default To field
    this.loadParticipants();
  },

  async loadParticipants() {
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', App.currentProject.id);
    const emails = participants.filter(p => p.email).map(p => p.email).join(', ');
    if (emails) {
      document.getElementById('email-to').value = emails;
    }
  },

  bindEvents() {
    document.getElementById('btn-generate-email')?.addEventListener('click', () => this.generateFromPSR());
    document.getElementById('btn-copy-email')?.addEventListener('click', () => this.copyToClipboard());
    document.getElementById('btn-send-email')?.addEventListener('click', () => this.openEmailClient());
  },

  async generateFromPSR() {
    const psrs = await DB.getAll(STORES.PSR, 'projectId', App.currentProject.id);
    const latestPsr = psrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    const cover = CoverModule.data || {};
    const tasks = await DB.getAll(STORES.TASKS, 'projectId', App.currentProject.id);
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', App.currentProject.id);
    
    // Calculate phase status
    const phases = [...new Set(tasks.map(t => t.phase))];
    const phaseStatus = phases.map(phase => {
      const phaseTasks = tasks.filter(t => t.phase === phase);
      const completed = phaseTasks.filter(t => t.status === 'completed').length;
      const total = phaseTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return `${phase}: ${progress}% (${completed}/${total} tareas)`;
    }).join('\n');
    
    // OIL summary
    const openOil = oilItems.filter(i => i.status !== 'completed');
    const oilSummary = openOil.length > 0 
      ? openOil.map(i => `- ${i.description} [${i.priority.toUpperCase()}] - ${i.assignedTo || 'Sin asignar'}`).join('\n')
      : 'No hay items abiertos';
    
    const d = latestPsr || {};
    const statusEmoji = {
      green: '🟢',
      amber: '🟡',
      red: '🔴'
    };
    
    const body = `Estimados stakeholders,

Adjunto el status report semanal del proyecto **${App.currentProject.name}**.

═══════════════════════════════════════

📊 OVERALL PROJECT HEALTH

Progreso General: ${d.progress || 0}%

Schedule: ${statusEmoji[d.schedule] || '🟢'} ${d.schedule?.toUpperCase() || 'GREEN'}
Budget: ${statusEmoji[d.budget] || '🟢'} ${d.budget?.toUpperCase() || 'GREEN'}
Resources: ${statusEmoji[d.resources] || '🟢'} ${d.resources?.toUpperCase() || 'GREEN'}
Scope: ${statusEmoji[d.scope] || '🟢'} ${d.scope?.toUpperCase() || 'GREEN'}
Risks: ${statusEmoji[d.risks] || '🟢'} ${d.risks?.toUpperCase() || 'GREEN'}

═══════════════════════════════════════

📋 PHASE STATUS

${phaseStatus || 'Sin tareas definidas'}

═══════════════════════════════════════

✅ ACCOMPLISHMENTS / LOGROS

${d.accomplishments || 'Sin logros registrados'}

═══════════════════════════════════════

⚠️ OPEN ITEMS (OIL)

${oilSummary}

═══════════════════════════════════════

🔴 KEY ISSUES / BLOQUEOS

${d.issues || 'Sin issues reportados'}

═══════════════════════════════════════

📅 NEXT STEPS / PRÓXIMOS PASOS

${d.nextSteps || 'Sin próximos pasos definidos'}

═══════════════════════════════════════

Comentarios adicionales:
${d.comments || 'N/A'}

Saludos cordiales,
${cover.projectManager || 'Project Manager'}
PSA BDP - Ocean Freight

---
Este email fue generado desde PSA BDP Project Management System
`;
    
    document.getElementById('email-body').value = body;
    App.toast('Email generado desde último PSR', 'success');
  },

  copyToClipboard() {
    const body = document.getElementById('email-body').value;
    navigator.clipboard.writeText(body).then(() => {
      App.toast('Email copiado al portapapeles', 'success');
    });
  },

  openEmailClient() {
    const to = document.getElementById('email-to').value;
    const subject = document.getElementById('email-subject').value;
    const body = document.getElementById('email-body').value;
    
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }
};
