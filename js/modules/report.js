/**
 * Report Generation Module
 */

const ReportModule = {
  async generate() {
    if (!App.currentProject) return;
    
    App.toast('Generando informe...', 'info');
    
    const project = App.currentProject;
    const cover = CoverModule.data || {};
    const kickoff = KickoffModule.data || {};
    
    // Gather all data
    const scope = await DB.getAll(STORES.SCOPE, 'projectId', project.id);
    const tasks = await DB.getAll(STORES.TASKS, 'projectId', project.id);
    const psrs = await DB.getAll(STORES.PSR, 'projectId', project.id);
    const oil = await DB.getAll(STORES.OIL, 'projectId', project.id);
    const uat = await DB.getAll(STORES.UAT, 'projectId', project.id);
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', project.id);
    
    const latestPsr = psrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    const report = {
      project,
      cover,
      kickoff,
      scope,
      tasks,
      psr: latestPsr,
      oil,
      uat,
      participants,
      generatedAt: new Date().toISOString()
    };
    
    this.exportJSON(report);
  },

  exportJSON(report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `psa-report-${report.project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    App.toast('Informe exportado (JSON)', 'success');
  }
};
