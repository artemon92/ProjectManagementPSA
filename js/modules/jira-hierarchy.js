/**
 * JIRA Hierarchy Module
 * Manages Epics, Tasks, and Sub-tasks like JIRA GOF
 */

const JiraHierarchyModule = {
  currentEpicId: null,
  currentTaskId: null,

  async load() {
    if (!App.currentProject) return;
    this.renderEpics();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-add-epic')?.addEventListener('click', () => this.addEpic());
    document.getElementById('btn-add-epic-empty')?.addEventListener('click', () => this.addEpic());
    
    // CSV Import
    const importBtn = document.getElementById('btn-import-jira');
    const fileInput = document.getElementById('jira-csv-input');
    
    importBtn?.addEventListener('click', () => fileInput?.click());
    
    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await this.importCSV(text);
        fileInput.value = ''; // Reset
      } catch (err) {
        console.error('Error importing CSV:', err);
        App.toast('Error importing CSV file', 'error');
      }
    });

    // JIRA API Config
    document.getElementById('btn-config-jira')?.addEventListener('click', () => this.showJiraConfig());
    
    // JIRA API Sync
    document.getElementById('btn-sync-jira')?.addEventListener('click', async () => {
      try {
        await JiraApiModule.syncAll();
        await this.renderEpics();
      } catch (err) {
        console.error('Sync error:', err);
        // Show detailed error to user
        if (err.message && err.message.includes('CORS')) {
          App.toast(err.message, 'error', 10000); // Show for 10 seconds
        } else {
          App.toast('Error de sincronización: ' + (err.message || 'Error desconocido'), 'error');
        }
      }
    });
  },

  showJiraConfig() {
    const config = JiraApiModule.getConfig();
    
    const content = `
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.config_url')}</label>
        <input type="text" class="form-control" id="jira-config-url" value="${App.escapeHtml(config.baseUrl)}" placeholder="https://bdpinternational.atlassian.net">
        <small style="color:var(--text-tertiary);">${I18n.t('jira.config_url_help')}</small>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.config_email')}</label>
        <input type="email" class="form-control" id="jira-config-email" value="${App.escapeHtml(config.email)}" placeholder="your.email@bdp.com">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.config_token')}</label>
        <input type="password" class="form-control" id="jira-config-token" value="${App.escapeHtml(config.apiToken)}" placeholder="${I18n.t('jira.config_token_placeholder')}">
        <small style="color:var(--text-tertiary);">${I18n.t('jira.config_token_help')}</small>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.config_project')}</label>
        <input type="text" class="form-control" id="jira-config-project" value="${App.escapeHtml(config.projectKey)}" placeholder="GOF">
        <small style="color:var(--text-tertiary);">${I18n.t('jira.config_project_help')}</small>
      </div>
      <div style="margin: 1.5rem 0; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius);">
        <h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">
          ⚙️ Servidor Proxy (Opcional - Soluciona CORS)
        </h4>
        <div class="form-group" style="margin-bottom: 0.5rem;">
          <label class="form-label">URL del Proxy</label>
          <input type="text" class="form-control" id="jira-config-proxy" value="${App.escapeHtml(config.proxyUrl || '')}" placeholder="https://tu-proxy.railway.app">
          <small style="color:var(--text-tertiary);">
            Despliega el servidor proxy para evitar errores CORS. Ver: proxy-server/DEPLOY.md
          </small>
        </div>
      </div>
      <div id="jira-config-status" style="margin-top:1rem;padding:0.75rem;border-radius:var(--radius);display:none;"></div>
    `;

    App.openModal(I18n.t('jira.config_title'), content, async () => {
      let baseUrl = document.getElementById('jira-config-url').value.trim();
      // Ensure URL has protocol
      if (baseUrl && !baseUrl.startsWith('http')) {
        baseUrl = 'https://' + baseUrl;
      }
      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/$/, '');
      
      const newConfig = {
        baseUrl: baseUrl,
        email: document.getElementById('jira-config-email').value.trim(),
        apiToken: document.getElementById('jira-config-token').value.trim(),
        projectKey: document.getElementById('jira-config-project').value.trim() || 'GOF',
        proxyUrl: document.getElementById('jira-config-proxy').value.trim() || null
      };

      JiraApiModule.saveConfig(newConfig);
      
      // Test connection
      const statusDiv = document.getElementById('jira-config-status');
      statusDiv.style.display = 'block';
      statusDiv.textContent = I18n.t('jira.testing');
      statusDiv.style.background = 'var(--bg-tertiary)';
      
      const result = await JiraApiModule.testConnection();
      
      if (result.success) {
        statusDiv.textContent = I18n.t('jira.config_success', { user: result.user });
        statusDiv.style.background = '#10B98120';
        statusDiv.style.color = '#10B981';
        setTimeout(() => App.closeModal(), 1500);
      } else {
        // Show detailed error for CORS
        if (result.error === 'CORS_BLOCKED') {
          statusDiv.innerHTML = '<strong>⚠️ Error de CORS (Cross-Origin)</strong><br><br>' + 
            result.details.replace(/\n/g, '<br>').replace(/\n\n/g, '<br><br>');
          statusDiv.style.background = '#FEF3C7';
          statusDiv.style.color = '#92400E';
          statusDiv.style.border = '1px solid #F59E0B';
        } else {
          statusDiv.textContent = I18n.t('jira.config_error') + ': ' + result.error;
          statusDiv.style.background = '#EF444420';
          statusDiv.style.color = '#EF4444';
        }
        return false; // Don't close modal on error
      }
    }, { confirmText: I18n.t('jira.config_save') });
  },

  async renderEpics() {
    const epics = await DB.getAll(STORES.EPICS, 'projectId', App.currentProject.id);
    const container = document.getElementById('epics-list');
    const empty = document.getElementById('epics-empty');
    const table = document.getElementById('epics-table');

    if (epics.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    table.style.display = 'block';
    empty.style.display = 'none';

    const tbody = document.getElementById('epics-tbody');
    tbody.innerHTML = epics.map(epic => {
      const ragColors = { green: '#10B981', amber: '#F59E0B', red: '#EF4444' };
      const statusLabels = {
        'to-do': I18n.t('jira.to_do'),
        approved: I18n.t('jira.approved'),
        'in-progress': I18n.t('jira.in_progress'),
        'in-review': I18n.t('jira.in_review'),
        done: I18n.t('jira.done'),
        cancelled: I18n.t('jira.cancelled')
      };

      return `
        <tr data-id="${epic.id}">
          <td><strong>${App.escapeHtml(epic.summary)}</strong></td>
          <td>${App.escapeHtml(epic.assignee || '-')}</td>
          <td><span class="badge" style="background:${ragColors[epic.ragStatus] || '#6B7280'}">${epic.ragStatus?.toUpperCase() || '-'}</span></td>
          <td><span class="badge badge-neutral">${statusLabels[epic.status] || epic.status}</span></td>
          <td>${epic.progress || 0}%</td>
          <td>${App.formatDate(epic.targetCompletionDate)}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="JiraHierarchyModule.viewEpic(${epic.id})" title="${I18n.t('action.view')}">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="JiraHierarchyModule.editEpic(${epic.id})" title="${I18n.t('action.edit')}">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="JiraHierarchyModule.deleteEpic(${epic.id})" title="${I18n.t('action.delete')}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    lucide.createIcons();
  },

  addEpic() {
    const content = this.getEpicForm();
    App.openModal(I18n.t('jira.new_epic'), content, async () => {
      const epic = this.collectEpicData();
      if (!epic.summary) {
        App.toast(I18n.t('jira.summary_required'), 'error');
        return false;
      }
      await DB.add(STORES.EPICS, epic);
      await this.renderEpics();
      App.toast(I18n.t('jira.epic_created'), 'success');
    });
    this.initEpicForm();
  },

  getEpicForm(epic = {}) {
    return `
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label class="form-label required">${I18n.t('jira.summary')}</label>
          <input type="text" class="form-control" id="epic-summary" value="${App.escapeHtml(epic.summary || '')}" placeholder="${I18n.t('jira.summary_placeholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.assignee')}</label>
          <input type="text" class="form-control" id="epic-assignee" value="${App.escapeHtml(epic.assignee || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.description')}</label>
        <textarea class="form-textarea" id="epic-description" rows="3">${App.escapeHtml(epic.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.priority')}</label>
          <select class="form-select" id="epic-priority">
            <option value="highest" ${epic.priority === 'highest' ? 'selected' : ''}>${I18n.t('priority.highest')}</option>
            <option value="high" ${epic.priority === 'high' ? 'selected' : ''}>${I18n.t('priority.high')}</option>
            <option value="medium" ${epic.priority === 'medium' || !epic.priority ? 'selected' : ''}>${I18n.t('priority.medium')}</option>
            <option value="low" ${epic.priority === 'low' ? 'selected' : ''}>${I18n.t('priority.low')}</option>
            <option value="lowest" ${epic.priority === 'lowest' ? 'selected' : ''}>${I18n.t('priority.lowest')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.team')}</label>
          <input type="text" class="form-control" id="epic-team" value="${App.escapeHtml(epic.team || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.status')}</label>
          <select class="form-select" id="epic-status">
            <option value="to-do" ${epic.status === 'to-do' ? 'selected' : ''}>${I18n.t('jira.to_do')}</option>
            <option value="approved" ${epic.status === 'approved' ? 'selected' : ''}>${I18n.t('jira.approved')}</option>
            <option value="in-progress" ${epic.status === 'in-progress' ? 'selected' : ''}>${I18n.t('jira.in_progress')}</option>
            <option value="in-review" ${epic.status === 'in-review' ? 'selected' : ''}>${I18n.t('jira.in_review')}</option>
            <option value="done" ${epic.status === 'done' ? 'selected' : ''}>${I18n.t('jira.done')}</option>
            <option value="cancelled" ${epic.status === 'cancelled' ? 'selected' : ''}>${I18n.t('jira.cancelled')}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.rag_status')}</label>
          <select class="form-select" id="epic-rag">
            <option value="" ${!epic.ragStatus ? 'selected' : ''}>-</option>
            <option value="green" ${epic.ragStatus === 'green' ? 'selected' : ''}>${I18n.t('rag.green')}</option>
            <option value="amber" ${epic.ragStatus === 'amber' ? 'selected' : ''}>${I18n.t('rag.amber')}</option>
            <option value="red" ${epic.ragStatus === 'red' ? 'selected' : ''}>${I18n.t('rag.red')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.target_completion')}</label>
          <input type="date" class="form-control" id="epic-target-date" value="${epic.targetCompletionDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.progress')}</label>
          <input type="number" class="form-control" id="epic-progress" min="0" max="100" value="${epic.progress || 0}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.region')}</label>
          <select class="form-select" id="epic-region">
            <option value="">${I18n.t('action.select')}</option>
            <option value="global" ${epic.region === 'global' ? 'selected' : ''}>${I18n.t('region.global')}</option>
            <option value="europe" ${epic.region === 'europe' ? 'selected' : ''}>${I18n.t('region.europe')}</option>
            <option value="americas" ${epic.region === 'americas' ? 'selected' : ''}>${I18n.t('region.americas')}</option>
            <option value="asia" ${epic.region === 'asia' ? 'selected' : ''}>${I18n.t('region.asia')}</option>
            <option value="mea" ${epic.region === 'mea' ? 'selected' : ''}>${I18n.t('region.mea')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.investment_amount')}</label>
          <input type="number" class="form-control" id="epic-investment" value="${epic.investmentAmount || ''}" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('jira.investment_recovery')}</label>
          <input type="number" class="form-control" id="epic-recovery" value="${epic.investmentRecovery || ''}" placeholder="${I18n.t('jira.months')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.labels')}</label>
        <input type="text" class="form-control" id="epic-labels" value="${App.escapeHtml((epic.labels || []).join(', '))}" placeholder="${I18n.t('jira.labels_placeholder')}">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.stakeholders')}</label>
        <input type="text" class="form-control" id="epic-stakeholders" value="${App.escapeHtml(epic.stakeholders || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.platforms')}</label>
        <input type="text" class="form-control" id="epic-platforms" value="${App.escapeHtml(epic.platforms || '')}" placeholder="${I18n.t('jira.platforms_placeholder')}">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('jira.success_criteria')}</label>
        <textarea class="form-textarea" id="epic-success-criteria" rows="2">${App.escapeHtml(epic.successCriteria || '')}</textarea>
      </div>
    `;
  },

  collectEpicData() {
    return {
      projectId: App.currentProject.id,
      summary: document.getElementById('epic-summary').value.trim(),
      description: document.getElementById('epic-description').value.trim(),
      assignee: document.getElementById('epic-assignee').value.trim(),
      priority: document.getElementById('epic-priority').value,
      team: document.getElementById('epic-team').value.trim(),
      status: document.getElementById('epic-status').value,
      ragStatus: document.getElementById('epic-rag').value,
      targetCompletionDate: document.getElementById('epic-target-date').value,
      progress: parseInt(document.getElementById('epic-progress').value) || 0,
      region: document.getElementById('epic-region').value,
      investmentAmount: parseFloat(document.getElementById('epic-investment').value) || 0,
      investmentRecovery: parseInt(document.getElementById('epic-recovery').value) || 0,
      labels: document.getElementById('epic-labels').value.split(',').map(l => l.trim()).filter(l => l),
      stakeholders: document.getElementById('epic-stakeholders').value.trim(),
      platforms: document.getElementById('epic-platforms').value.trim(),
      successCriteria: document.getElementById('epic-success-criteria').value.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  initEpicForm() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('epic-target-date').value = today;
  },

  async editEpic(id) {
    const epic = await DB.getById(STORES.EPICS, id);
    if (!epic) return;

    const content = this.getEpicForm(epic);
    App.openModal(I18n.t('jira.edit_epic'), content, async () => {
      const updated = { ...epic, ...this.collectEpicData(), id };
      await DB.put(STORES.EPICS, updated);
      await this.renderEpics();
      App.toast(I18n.t('jira.epic_updated'), 'success');
    });
  },

  async deleteEpic(id) {
    const confirmed = await App.confirm(I18n.t('jira.confirm_delete_epic'));
    if (!confirmed) return;

    // Delete related tasks and subtasks
    const tasks = await DB.getAll(STORES.JIRA_TASKS, 'epicId', id);
    for (const task of tasks) {
      const subtasks = await DB.getAll(STORES.SUBTASKS, 'taskId', task.id);
      for (const subtask of subtasks) {
        await DB.delete(STORES.SUBTASKS, subtask.id);
      }
      await DB.delete(STORES.JIRA_TASKS, task.id);
    }

    await DB.delete(STORES.EPICS, id);
    await this.renderEpics();
    App.toast(I18n.t('jira.epic_deleted'), 'success');
  },

  async viewEpic(id) {
    this.currentEpicId = id;
    const epic = await DB.getById(STORES.EPICS, id);
    if (!epic) return;

    // Render tasks for this epic
    this.renderTasks(id);
  },

  async renderTasks(epicId) {
    const tasks = await DB.getAll(STORES.JIRA_TASKS, 'epicId', epicId);
    const container = document.getElementById('tasks-container');

    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = `<p style="color:var(--text-tertiary);padding:1rem;">${I18n.t('jira.no_tasks')}</p>`;
      return;
    }

    container.innerHTML = tasks.map(task => `
      <div class="task-item" style="border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${App.escapeHtml(task.summary)}</strong>
          <span class="badge badge-neutral">${task.status}</span>
        </div>
        <div style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.25rem;">
          ${I18n.t('jira.assignee')}: ${App.escapeHtml(task.assignee || '-')} | ${I18n.t('jira.due_date')}: ${App.formatDate(task.dueDate)}
        </div>
      </div>
    `).join('');
  },

  // Import JIRA CSV
  async importCSV(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      App.toast('CSV file is empty or invalid', 'error');
      return;
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0]);
    
    // Find column indices
    const colIndex = {
      summary: headers.findIndex(h => h.toLowerCase().includes('summary')),
      issueKey: headers.findIndex(h => h.toLowerCase().includes('issue key')),
      issueType: headers.findIndex(h => h.toLowerCase().includes('issue type')),
      status: headers.findIndex(h => h.toLowerCase().includes('status')),
      assignee: headers.findIndex(h => h.toLowerCase().includes('assignee') && !h.toLowerCase().includes('id')),
      reporter: headers.findIndex(h => h.toLowerCase().includes('reporter') && !h.toLowerCase().includes('id')),
      created: headers.findIndex(h => h.toLowerCase().includes('created')),
      updated: headers.findIndex(h => h.toLowerCase().includes('updated')),
      dueDate: headers.findIndex(h => h.toLowerCase().includes('due date')),
      description: headers.findIndex(h => h.toLowerCase().includes('description')),
      labels: headers.findIndex(h => h.toLowerCase().includes('labels')),
      priority: headers.findIndex(h => h.toLowerCase().includes('priority')),
      parent: headers.findIndex(h => h.toLowerCase().includes('parent key') || h.toLowerCase().includes('parent')),
      epicName: headers.findIndex(h => h.toLowerCase().includes('epic name')),
      ragStatus: headers.findIndex(h => h.toLowerCase().includes('rag status')),
      investmentAmount: headers.findIndex(h => h.toLowerCase().includes('investment amount')),
      region: headers.findIndex(h => h.toLowerCase().includes('region')),
      stakeholders: headers.findIndex(h => h.toLowerCase().includes('stakeholders')),
      platforms: headers.findIndex(h => h.toLowerCase().includes('platforms')),
      successCriteria: headers.findIndex(h => h.toLowerCase().includes('success criteria')),
      team: headers.findIndex(h => h.toLowerCase().includes('team') && !h.toLowerCase().includes('id')),
      progress: headers.findIndex(h => h.toLowerCase().includes('progress') || h.toLowerCase().includes('%'))
    };

    const issues = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this.parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      const issue = {
        summary: values[colIndex.summary] || '',
        issueKey: values[colIndex.issueKey] || '',
        issueType: values[colIndex.issueType] || '',
        status: this.mapJiraStatus(values[colIndex.status] || ''),
        assignee: values[colIndex.assignee] || '',
        reporter: values[colIndex.reporter] || '',
        created: this.parseJiraDate(values[colIndex.created]),
        updated: this.parseJiraDate(values[colIndex.updated]),
        dueDate: this.parseJiraDate(values[colIndex.dueDate]),
        description: values[colIndex.description] || '',
        labels: values[colIndex.labels] ? values[colIndex.labels].split(',').map(l => l.trim()).filter(l => l) : [],
        priority: this.mapJiraPriority(values[colIndex.priority] || ''),
        parentKey: values[colIndex.parent] || '',
        epicName: values[colIndex.epicName] || '',
        ragStatus: this.mapJiraRAG(values[colIndex.ragStatus] || ''),
        investmentAmount: parseFloat(values[colIndex.investmentAmount]) || 0,
        region: this.mapJiraRegion(values[colIndex.region] || ''),
        stakeholders: values[colIndex.stakeholders] || '',
        platforms: values[colIndex.platforms] || '',
        successCriteria: values[colIndex.successCriteria] || '',
        team: values[colIndex.team] || '',
        progress: parseInt(values[colIndex.progress]) || 0,
        projectId: App.currentProject?.id
      };
      issues.push(issue);
    }

    // Sort by type: Epics first, then Tasks, then Sub-tasks
    issues.sort((a, b) => {
      const typeOrder = { 'Epic': 1, 'Task': 2, 'Sub-task': 3 };
      return (typeOrder[a.issueType] || 99) - (typeOrder[b.issueType] || 99);
    });

    // Import to database
    const imported = { epics: 0, tasks: 0, subtasks: 0 };
    const keyToId = {}; // Map JIRA issue key to local ID

    // First pass: Import Epics
    for (const issue of issues.filter(i => i.issueType === 'Epic')) {
      const epic = {
        projectId: App.currentProject.id,
        summary: issue.summary,
        description: issue.description,
        assignee: issue.assignee,
        priority: issue.priority,
        team: issue.team,
        status: issue.status,
        ragStatus: issue.ragStatus,
        targetCompletionDate: issue.dueDate,
        progress: issue.progress,
        region: issue.region,
        investmentAmount: issue.investmentAmount,
        labels: issue.labels,
        stakeholders: issue.stakeholders,
        platforms: issue.platforms,
        successCriteria: issue.successCriteria,
        jiraIssueKey: issue.issueKey,
        createdAt: issue.created || new Date().toISOString(),
        updatedAt: issue.updated || new Date().toISOString()
      };
      const id = await DB.add(STORES.EPICS, epic);
      keyToId[issue.issueKey] = { type: 'epic', id };
      imported.epics++;
    }

    // Second pass: Import Tasks
    for (const issue of issues.filter(i => i.issueType === 'Task')) {
      let epicId = null;
      if (issue.parentKey && keyToId[issue.parentKey]) {
        epicId = keyToId[issue.parentKey].id;
      }

      const task = {
        projectId: App.currentProject.id,
        epicId: epicId,
        summary: issue.summary,
        description: issue.description,
        assignee: issue.assignee,
        priority: issue.priority,
        team: issue.team,
        status: issue.status,
        ragStatus: issue.ragStatus,
        dueDate: issue.dueDate,
        labels: issue.labels,
        region: issue.region,
        jiraIssueKey: issue.issueKey,
        createdAt: issue.created || new Date().toISOString(),
        updatedAt: issue.updated || new Date().toISOString()
      };
      const id = await DB.add(STORES.JIRA_TASKS, task);
      keyToId[issue.issueKey] = { type: 'task', id };
      imported.tasks++;
    }

    // Third pass: Import Sub-tasks
    for (const issue of issues.filter(i => i.issueType === 'Sub-task')) {
      let taskId = null;
      if (issue.parentKey && keyToId[issue.parentKey]) {
        if (keyToId[issue.parentKey].type === 'task') {
          taskId = keyToId[issue.parentKey].id;
        }
      }

      const subtask = {
        projectId: App.currentProject.id,
        taskId: taskId,
        summary: issue.summary,
        description: issue.description,
        assignee: issue.assignee,
        priority: issue.priority,
        team: issue.team,
        status: issue.status,
        dueDate: issue.dueDate,
        labels: issue.labels,
        region: issue.region,
        jiraIssueKey: issue.issueKey,
        createdAt: issue.created || new Date().toISOString(),
        updatedAt: issue.updated || new Date().toISOString()
      };
      await DB.add(STORES.SUBTASKS, subtask);
      imported.subtasks++;
    }

    App.toast(`Import complete: ${imported.epics} Epics, ${imported.tasks} Tasks, ${imported.subtasks} Sub-tasks`, 'success');
    await this.renderEpics();
  },

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  },

  parseJiraDate(dateStr) {
    if (!dateStr) return null;
    try {
      // JIRA format: "04/Feb/26 9:37 AM" or "04/Feb/26"
      const match = dateStr.match(/(\d{2})\/(\w{3})\/(\d{2,4})/);
      if (match) {
        const day = match[1];
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames.indexOf(match[2].toLowerCase());
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        return `${year}-${String(month + 1).padStart(2, '0')}-${day}`;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  mapJiraStatus(status) {
    const statusMap = {
      'to do': 'to-do',
      'in progress': 'in-progress',
      'done': 'done',
      'completed': 'done',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'in review': 'in-review',
      'approved': 'approved',
      'blocked - internal': 'blocked-internal',
      'blocked - external': 'blocked-external'
    };
    return statusMap[status.toLowerCase()] || status.toLowerCase().replace(/\s+/g, '-');
  },

  mapJiraPriority(priority) {
    const priorityMap = {
      'highest': 'highest',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'lowest': 'lowest'
    };
    return priorityMap[priority.toLowerCase()] || 'medium';
  },

  mapJiraRAG(rag) {
    if (!rag) return '';
    const ragLower = rag.toLowerCase();
    if (ragLower.includes('green')) return 'green';
    if (ragLower.includes('amber') || ragLower.includes('yellow')) return 'amber';
    if (ragLower.includes('red')) return 'red';
    return '';
  },

  mapJiraRegion(region) {
    if (!region) return '';
    const regionMap = {
      'global': 'global',
      'europe': 'europe',
      'americas': 'americas',
      'apac': 'asia',
      'asia': 'asia',
      'mea': 'mea',
      'emea': 'europe'
    };
    return regionMap[region.toLowerCase()] || '';
  }
};

// Register module
App.modules.jiraHierarchy = JiraHierarchyModule;
