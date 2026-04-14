/**
 * JIRA API Integration Module
 * Syncs Epics, Tasks, and Sub-tasks from JIRA Cloud
 */

const JiraApiModule = {
  config: {
    baseUrl: localStorage.getItem('jira_baseUrl') || '',
    email: localStorage.getItem('jira_email') || '',
    apiToken: localStorage.getItem('jira_apiToken') || '',
    projectKey: localStorage.getItem('jira_projectKey') || 'GOF'
  },

  // Save configuration
  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('jira_baseUrl', this.config.baseUrl);
    localStorage.setItem('jira_email', this.config.email);
    localStorage.setItem('jira_apiToken', this.config.apiToken);
    localStorage.setItem('jira_projectKey', this.config.projectKey);
  },

  // Get stored config
  getConfig() {
    return this.config;
  },

  // Test connection to JIRA
  async testConnection() {
    try {
      const response = await this.fetchJira('/rest/api/3/myself');
      return { success: true, user: response.displayName };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Generic fetch with auth
  async fetchJira(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const auth = btoa(`${this.config.email}:${this.config.apiToken}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`JIRA API Error: ${response.status} - ${error}`);
    }

    return response.json();
  },

  // Get all Epics from JIRA project
  async getEpics() {
    const jql = `project = ${this.config.projectKey} AND issuetype = Epic ORDER BY created DESC`;
    return this.searchIssues(jql, ['summary', 'description', 'status', 'assignee', 'reporter', 
      'created', 'updated', 'duedate', 'priority', 'labels', 'customfield_10014', // Epic Name
      'customfield_10015', // Epic Status
      'customfield_10019', // RAG Status
      'customfield_10020', // Investment Amount
      'customfield_10021', // Investment Recovery
      'customfield_10022', // Region
      'customfield_10023', // Stakeholders
      'customfield_10024', // Platforms
      'customfield_10025'  // Success Criteria
    ]);
  },

  // Get all Tasks from JIRA project
  async getTasks() {
    const jql = `project = ${this.config.projectKey} AND issuetype = Task ORDER BY created DESC`;
    return this.searchIssues(jql, ['summary', 'description', 'status', 'assignee', 'reporter',
      'created', 'updated', 'duedate', 'priority', 'labels', 'parent',
      'customfield_10026', // Effort Estimate
      'customfield_10027', // Acceptance Criteria
      'customfield_10022'  // Region
    ]);
  },

  // Get all Sub-tasks from JIRA project
  async getSubtasks() {
    const jql = `project = ${this.config.projectKey} AND issuetype = Sub-task ORDER BY created DESC`;
    return this.searchIssues(jql, ['summary', 'description', 'status', 'assignee', 'reporter',
      'created', 'updated', 'duedate', 'priority', 'parent'
    ]);
  },

  // Search issues with JQL
  async searchIssues(jql, fields = null) {
    const body = {
      jql: jql,
      maxResults: 100,
      fields: fields || ['summary', 'status', 'assignee', 'created', 'updated']
    };

    const response = await this.fetchJira('/rest/api/3/search', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response.issues || [];
  },

  // Get issue by key
  async getIssue(issueKey) {
    return this.fetchJira(`/rest/api/3/issue/${issueKey}`);
  },

  // Sync all data from JIRA to local database
  async syncAll() {
    if (!this.config.baseUrl || !this.config.email || !this.config.apiToken) {
      throw new Error('JIRA configuration is incomplete. Please configure connection first.');
    }

    App.toast(I18n.t('jira.sync_start'), 'info');

    try {
      // Fetch all data in parallel
      const [epics, tasks, subtasks] = await Promise.all([
        this.getEpics(),
        this.getTasks(),
        this.getSubtasks()
      ]);

      // Sync Epics first
      const keyToId = {};
      for (const epic of epics) {
        const localEpic = await this.syncEpic(epic);
        keyToId[epic.key] = { type: 'epic', id: localEpic.id };
      }

      // Sync Tasks (with parent Epic reference)
      for (const task of tasks) {
        let epicId = null;
        if (task.fields.parent && keyToId[task.fields.parent.key]) {
          epicId = keyToId[task.fields.parent.key].id;
        }
        const localTask = await this.syncTask(task, epicId);
        keyToId[task.key] = { type: 'task', id: localTask.id };
      }

      // Sync Sub-tasks (with parent Task reference)
      for (const subtask of subtasks) {
        let taskId = null;
        if (subtask.fields.parent && keyToId[subtask.fields.parent.key]) {
          if (keyToId[subtask.fields.parent.key].type === 'task') {
            taskId = keyToId[subtask.fields.parent.key].id;
          }
        }
        await this.syncSubtask(subtask, taskId);
      }

      App.toast(I18n.t('jira.sync_complete', { 
        epics: epics.length, 
        tasks: tasks.length, 
        subtasks: subtasks.length 
      }), 'success');

      // Sync to Project Plan (Gantt)
      await this.syncToProjectPlan(epics, tasks, subtasks, keyToId);

      return { epics: epics.length, tasks: tasks.length, subtasks: subtasks.length };
    } catch (error) {
      console.error('JIRA Sync Error:', error);
      App.toast(I18n.t('jira.sync_error') + ': ' + error.message, 'error');
      throw error;
    }
  },

  // Sync JIRA issues to Project Plan (Gantt)
  async syncToProjectPlan(epics, tasks, subtasks, keyToId) {
    if (!App.currentProject) return;

    // Get existing tasks to avoid duplicates
    const existingTasks = await DB.getAll(STORES.TASKS, 'projectId', App.currentProject.id);
    const jiraKeys = new Set(existingTasks.filter(t => t.jiraIssueKey).map(t => t.jiraIssueKey));

    let addedCount = 0;

    // Convert Epics to Project Plan phases/milestones
    for (const epic of epics) {
      if (jiraKeys.has(epic.key)) continue; // Skip if already exists

      const epicTask = {
        projectId: App.currentProject.id,
        name: `[EPIC] ${epic.fields.summary}`,
        phase: 'pre',
        assignee: epic.fields.assignee?.displayName || '',
        startDate: this.formatDateForInput(epic.fields.created),
        endDate: this.formatDateForInput(epic.fields.duedate) || this.addDays(epic.fields.created, 30),
        progress: this.calculateProgress(epic.fields.status?.name),
        status: this.mapJiraStatus(epic.fields.status?.name),
        priority: this.mapJiraPriority(epic.fields.priority?.name),
        description: this.extractTextFromADF(epic.fields.description),
        jiraIssueKey: epic.key,
        jiraIssueType: 'Epic',
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DB.add(STORES.TASKS, epicTask);
      jiraKeys.add(epic.key);
      addedCount++;
    }

    // Convert Tasks to Project Plan tasks
    for (const task of tasks) {
      if (jiraKeys.has(task.key)) continue; // Skip if already exists

      // Find parent Epic info
      let parentName = '';
      if (task.fields.parent && keyToId[task.fields.parent.key]) {
        const parentEpic = epics.find(e => e.key === task.fields.parent.key);
        if (parentEpic) {
          parentName = parentEpic.fields.summary;
        }
      }

      const planTask = {
        projectId: App.currentProject.id,
        name: task.fields.summary,
        phase: 'during',
        assignee: task.fields.assignee?.displayName || '',
        startDate: this.formatDateForInput(task.fields.created),
        endDate: this.formatDateForInput(task.fields.duedate) || this.addDays(task.fields.created, 14),
        progress: this.calculateProgress(task.fields.status?.name),
        status: this.mapJiraStatus(task.fields.status?.name),
        priority: this.mapJiraPriority(task.fields.priority?.name),
        description: this.extractTextFromADF(task.fields.description),
        jiraIssueKey: task.key,
        jiraIssueType: 'Task',
        jiraParentKey: task.fields.parent?.key || '',
        jiraParentName: parentName,
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DB.add(STORES.TASKS, planTask);
      jiraKeys.add(task.key);
      addedCount++;
    }

    // Convert Sub-tasks to Project Plan sub-tasks (if supported by your plan module)
    for (const subtask of subtasks) {
      if (jiraKeys.has(subtask.key)) continue; // Skip if already exists

      const planSubtask = {
        projectId: App.currentProject.id,
        name: `[SUB] ${subtask.fields.summary}`,
        phase: 'during',
        assignee: subtask.fields.assignee?.displayName || '',
        startDate: this.formatDateForInput(subtask.fields.created),
        endDate: this.formatDateForInput(subtask.fields.duedate) || this.addDays(subtask.fields.created, 7),
        progress: this.calculateProgress(subtask.fields.status?.name),
        status: this.mapJiraStatus(subtask.fields.status?.name),
        priority: this.mapJiraPriority(subtask.fields.priority?.name),
        description: this.extractTextFromADF(subtask.fields.description),
        jiraIssueKey: subtask.key,
        jiraIssueType: 'Sub-task',
        jiraParentKey: subtask.fields.parent?.key || '',
        isSubtask: true,
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DB.add(STORES.TASKS, planSubtask);
      jiraKeys.add(subtask.key);
      addedCount++;
    }

    if (addedCount > 0) {
      App.toast(I18n.t('jira.plan_synced', { count: addedCount }), 'success');
      
      // Refresh Project Plan if it's the current module
      if (App.modules.plan && App.currentModule === 'plan') {
        App.modules.plan.load();
      }
    }
  },

  // Helper: Format JIRA date for input fields (YYYY-MM-DD)
  formatDateForInput(dateStr) {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  },

  // Helper: Add days to a date
  addDays(dateStr, days) {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  },

  // Helper: Calculate progress based on status
  calculateProgress(status) {
    const statusMap = {
      'To Do': 0,
      'In Progress': 50,
      'In Review': 80,
      'Done': 100,
      'Completed': 100,
      'Cancelled': 0
    };
    return statusMap[status] || 0;
  },

  // Sync single Epic
  async syncEpic(jiraEpic) {
    const fields = jiraEpic.fields;
    
    // Check if already exists
    const existing = await this.findByJiraKey(STORES.EPICS, jiraEpic.key);
    
    const epic = {
      projectId: App.currentProject.id,
      summary: fields.summary,
      description: this.extractTextFromADF(fields.description),
      assignee: fields.assignee?.displayName || '',
      reporter: fields.reporter?.displayName || '',
      status: this.mapJiraStatus(fields.status?.name || 'To Do'),
      priority: this.mapJiraPriority(fields.priority?.name || 'Medium'),
      labels: fields.labels || [],
      targetCompletionDate: fields.duedate,
      createdAt: fields.created,
      updatedAt: fields.updated,
      jiraIssueKey: jiraEpic.key,
      // Custom fields
      epicName: fields.customfield_10014 || fields.summary,
      epicStatus: fields.customfield_10015 || '',
      ragStatus: this.mapRAGStatus(fields.customfield_10019),
      investmentAmount: parseFloat(fields.customfield_10020) || 0,
      investmentRecovery: parseInt(fields.customfield_10021) || 0,
      region: fields.customfield_10022 || '',
      stakeholders: fields.customfield_10023 || '',
      platforms: fields.customfield_10024 || '',
      successCriteria: fields.customfield_10025 || ''
    };

    if (existing) {
      epic.id = existing.id;
      await DB.put(STORES.EPICS, epic);
      return epic;
    } else {
      const id = await DB.add(STORES.EPICS, epic);
      return { ...epic, id };
    }
  },

  // Sync single Task
  async syncTask(jiraTask, epicId) {
    const fields = jiraTask.fields;
    
    const existing = await this.findByJiraKey(STORES.JIRA_TASKS, jiraTask.key);
    
    const task = {
      projectId: App.currentProject.id,
      epicId: epicId,
      summary: fields.summary,
      description: this.extractTextFromADF(fields.description),
      assignee: fields.assignee?.displayName || '',
      reporter: fields.reporter?.displayName || '',
      status: this.mapJiraStatus(fields.status?.name || 'To Do'),
      priority: this.mapJiraPriority(fields.priority?.name || 'Medium'),
      labels: fields.labels || [],
      dueDate: fields.duedate,
      createdAt: fields.created,
      updatedAt: fields.updated,
      jiraIssueKey: jiraTask.key,
      // Custom fields
      effortEstimate: fields.customfield_10026 || '',
      acceptanceCriteria: fields.customfield_10027 || '',
      region: fields.customfield_10022 || ''
    };

    if (existing) {
      task.id = existing.id;
      await DB.put(STORES.JIRA_TASKS, task);
      return task;
    } else {
      const id = await DB.add(STORES.JIRA_TASKS, task);
      return { ...task, id };
    }
  },

  // Sync single Sub-task
  async syncSubtask(jiraSubtask, taskId) {
    const fields = jiraSubtask.fields;
    
    const existing = await this.findByJiraKey(STORES.SUBTASKS, jiraSubtask.key);
    
    const subtask = {
      projectId: App.currentProject.id,
      taskId: taskId,
      summary: fields.summary,
      description: this.extractTextFromADF(fields.description),
      assignee: fields.assignee?.displayName || '',
      reporter: fields.reporter?.displayName || '',
      status: this.mapJiraStatus(fields.status?.name || 'To Do'),
      priority: this.mapJiraPriority(fields.priority?.name || 'Medium'),
      dueDate: fields.duedate,
      createdAt: fields.created,
      updatedAt: fields.updated,
      jiraIssueKey: jiraSubtask.key
    };

    if (existing) {
      subtask.id = existing.id;
      await DB.put(STORES.SUBTASKS, subtask);
      return subtask;
    } else {
      const id = await DB.add(STORES.SUBTASKS, subtask);
      return { ...subtask, id };
    }
  },

  // Find local record by JIRA issue key
  async findByJiraKey(storeName, jiraKey) {
    const items = await DB.getAll(storeName, 'projectId', App.currentProject.id);
    return items.find(item => item.jiraIssueKey === jiraKey);
  },

  // Extract plain text from Atlassian Document Format (ADF)
  extractTextFromADF(adf) {
    if (!adf) return '';
    if (typeof adf === 'string') return adf;
    
    let text = '';
    
    const traverse = (node) => {
      if (node.text) {
        text += node.text + ' ';
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    };
    
    traverse(adf);
    return text.trim();
  },

  // Map JIRA status to local status
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
      'blocked': 'blocked-internal'
    };
    return statusMap[status?.toLowerCase()] || 'to-do';
  },

  // Map JIRA priority to local priority
  mapJiraPriority(priority) {
    const priorityMap = {
      'highest': 'highest',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'lowest': 'lowest'
    };
    return priorityMap[priority?.toLowerCase()] || 'medium';
  },

  // Map RAG status
  mapRAGStatus(rag) {
    if (!rag) return '';
    const ragLower = rag.toLowerCase();
    if (ragLower.includes('green')) return 'green';
    if (ragLower.includes('amber') || ragLower.includes('yellow')) return 'amber';
    if (ragLower.includes('red')) return 'red';
    return '';
  }
};

// Make it global
window.JiraApiModule = JiraApiModule;
