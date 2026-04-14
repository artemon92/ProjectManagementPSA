/**
 * PSA BDP Project Management - Database Layer
 * IndexedDB wrapper for offline-first data storage
 */

const DB_NAME = 'PSAProjectsDB';
const DB_VERSION = 2;

const STORES = {
  PROJECTS: 'projects',
  COVER: 'cover',
  SCOPE: 'scope',
  KICKOFF: 'kickoff',
  TASKS: 'tasks',
  PSR: 'psr',
  OIL: 'oil',
  UAT: 'uat',
  VACATION: 'vacation',
  PARTICIPANTS: 'participants',
  VENDORS: 'vendors',
  BUDGET: 'budget',
  EXPENSES: 'expenses'
};

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Projects store
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id', autoIncrement: true });
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('status', 'status', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Cover page data
        if (!db.objectStoreNames.contains(STORES.COVER)) {
          db.createObjectStore(STORES.COVER, { keyPath: 'projectId' });
        }

        // Scope items
        if (!db.objectStoreNames.contains(STORES.SCOPE)) {
          const scopeStore = db.createObjectStore(STORES.SCOPE, { keyPath: 'id', autoIncrement: true });
          scopeStore.createIndex('projectId', 'projectId', { unique: false });
          scopeStore.createIndex('phase', 'phase', { unique: false });
          scopeStore.createIndex('priority', 'priority', { unique: false });
          scopeStore.createIndex('status', 'status', { unique: false });
        }

        // Kickoff template
        if (!db.objectStoreNames.contains(STORES.KICKOFF)) {
          db.createObjectStore(STORES.KICKOFF, { keyPath: 'projectId' });
        }

        // Tasks/Project Plan
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('projectId', 'projectId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('phase', 'phase', { unique: false });
        }

        // PSR data
        if (!db.objectStoreNames.contains(STORES.PSR)) {
          const psrStore = db.createObjectStore(STORES.PSR, { keyPath: 'id', autoIncrement: true });
          psrStore.createIndex('projectId', 'projectId', { unique: false });
          psrStore.createIndex('week', 'week', { unique: false });
        }

        // OIL items
        if (!db.objectStoreNames.contains(STORES.OIL)) {
          const oilStore = db.createObjectStore(STORES.OIL, { keyPath: 'id', autoIncrement: true });
          oilStore.createIndex('projectId', 'projectId', { unique: false });
          oilStore.createIndex('status', 'status', { unique: false });
          oilStore.createIndex('priority', 'priority', { unique: false });
          oilStore.createIndex('assignedTo', 'assignedTo', { unique: false });
        }

        // UAT tests
        if (!db.objectStoreNames.contains(STORES.UAT)) {
          const uatStore = db.createObjectStore(STORES.UAT, { keyPath: 'id', autoIncrement: true });
          uatStore.createIndex('projectId', 'projectId', { unique: false });
          uatStore.createIndex('status', 'status', { unique: false });
        }

        // Vacation coverage
        if (!db.objectStoreNames.contains(STORES.VACATION)) {
          const vacStore = db.createObjectStore(STORES.VACATION, { keyPath: 'id', autoIncrement: true });
          vacStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // Participants
        if (!db.objectStoreNames.contains(STORES.PARTICIPANTS)) {
          const partStore = db.createObjectStore(STORES.PARTICIPANTS, { keyPath: 'id', autoIncrement: true });
          partStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // Vendors
        if (!db.objectStoreNames.contains(STORES.VENDORS)) {
          const vendorStore = db.createObjectStore(STORES.VENDORS, { keyPath: 'id', autoIncrement: true });
          vendorStore.createIndex('projectId', 'projectId', { unique: false });
          vendorStore.createIndex('category', 'category', { unique: false });
          vendorStore.createIndex('status', 'status', { unique: false });
        }

        // Budget
        if (!db.objectStoreNames.contains(STORES.BUDGET)) {
          const budgetStore = db.createObjectStore(STORES.BUDGET, { keyPath: 'id', autoIncrement: true });
          budgetStore.createIndex('projectId', 'projectId', { unique: false });
          budgetStore.createIndex('category', 'category', { unique: false });
        }

        // Expenses
        if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
          const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id', autoIncrement: true });
          expStore.createIndex('projectId', 'projectId', { unique: false });
          expStore.createIndex('category', 'category', { unique: false });
          expStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  // Generic CRUD operations
  async getAll(storeName, indexName = null, indexValue = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (indexName && indexValue !== null) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Project-specific helpers
  async getProjectData(projectId) {
    const data = {};
    
    data.cover = await this.getById(STORES.COVER, projectId);
    data.scope = await this.getAll(STORES.SCOPE, 'projectId', projectId);
    data.kickoff = await this.getById(STORES.KICKOFF, projectId);
    data.tasks = await this.getAll(STORES.TASKS, 'projectId', projectId);
    data.psr = await this.getAll(STORES.PSR, 'projectId', projectId);
    data.oil = await this.getAll(STORES.OIL, 'projectId', projectId);
    data.uat = await this.getAll(STORES.UAT, 'projectId', projectId);
    data.vacation = await this.getAll(STORES.VACATION, 'projectId', projectId);
    data.participants = await this.getAll(STORES.PARTICIPANTS, 'projectId', projectId);
    data.budget = await this.getAll(STORES.BUDGET, 'projectId', projectId);
    data.expenses = await this.getAll(STORES.EXPENSES, 'projectId', projectId);
    data.vendors = await this.getAll(STORES.VENDORS, 'projectId', projectId);
    
    return data;
  }

  async exportProject(projectId) {
    const project = await this.getById(STORES.PROJECTS, projectId);
    const data = await this.getProjectData(projectId);
    
    return {
      project,
      data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  async importProject(exportData) {
    const { project, data } = exportData;
    
    // Create new project
    const newProjectId = await this.add(STORES.PROJECTS, {
      ...project,
      id: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Import all related data
    if (data.cover) {
      await this.put(STORES.COVER, { ...data.cover, projectId: newProjectId });
    }
    
    if (data.kickoff) {
      await this.put(STORES.KICKOFF, { ...data.kickoff, projectId: newProjectId });
    }

    for (const item of data.scope || []) {
      await this.add(STORES.SCOPE, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.tasks || []) {
      await this.add(STORES.TASKS, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.psr || []) {
      await this.add(STORES.PSR, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.oil || []) {
      await this.add(STORES.OIL, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.uat || []) {
      await this.add(STORES.UAT, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.vacation || []) {
      await this.add(STORES.VACATION, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.participants || []) {
      await this.add(STORES.PARTICIPANTS, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.budget || []) {
      await this.add(STORES.BUDGET, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.expenses || []) {
      await this.add(STORES.EXPENSES, { ...item, projectId: newProjectId, id: undefined });
    }

    for (const item of data.vendors || []) {
      await this.add(STORES.VENDORS, { ...item, projectId: newProjectId, id: undefined });
    }

    return newProjectId;
  }

  // Count items for a project
  async countByProject(storeName, projectId) {
    const items = await this.getAll(storeName, 'projectId', projectId);
    return items.length;
  }

  // Count by status
  async countByStatus(storeName, projectId, status) {
    const items = await this.getAll(storeName, 'projectId', projectId);
    return items.filter(i => i.status === status).length;
  }
}

// Create global instance
const DB = new Database();
