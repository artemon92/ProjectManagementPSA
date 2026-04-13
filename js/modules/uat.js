/**
 * UAT Test Tracker Module
 */

const UatModule = {
  tests: [],
  filters: { status: 'all' },

  async load() {
    if (!App.currentProject) return;
    
    this.tests = await DB.getAll(STORES.UAT, 'projectId', App.currentProject.id);
    this.tests.sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0));
    
    this.renderKPIs();
    this.render();
    this.bindEvents();
  },

  renderKPIs() {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'passed').length;
    const failed = this.tests.filter(t => t.status === 'failed').length;
    const inProgress = this.tests.filter(t => t.status === 'in-progress').length;
    
    document.getElementById('uat-kpi-total').textContent = total;
    document.getElementById('uat-kpi-passed').textContent = passed;
    document.getElementById('uat-kpi-failed').textContent = failed;
    document.getElementById('uat-kpi-progress').textContent = inProgress;
  },

  render() {
    const filtered = this.getFilteredTests();
    const tbody = document.getElementById('uat-tbody');
    const empty = document.getElementById('uat-empty');
    const table = document.querySelector('#uat-table');
    
    if (filtered.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    const statusConfig = {
      open: { class: 'badge-neutral', label: 'Open' },
      'in-progress': { class: 'badge-warning', label: 'In Progress' },
      'on-hold': { class: 'badge-info', label: 'On Hold' },
      passed: { class: 'badge-success', label: 'Passed' },
      failed: { class: 'badge-danger', label: 'Failed' }
    };
    
    tbody.innerHTML = filtered.map(test => {
      const status = statusConfig[test.status] || statusConfig.open;
      
      return `
        <tr data-id="${test.id}">
          <td>${test.testNumber || '-'}</td>
          <td>${App.escapeHtml(test.description)}</td>
          <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${App.escapeHtml(test.steps || '')}">${App.escapeHtml(test.steps || '-')}</td>
          <td style="max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${App.escapeHtml(test.expectedResult || '')}">${App.escapeHtml(test.expectedResult || '-')}</td>
          <td>${App.escapeHtml(test.dependencies || '-')}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${App.escapeHtml(test.tester || '-')}</td>
          <td style="max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${App.escapeHtml(test.comments || '')}">${App.escapeHtml(test.comments || '-')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="UatModule.edit(${test.id})" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="UatModule.delete(${test.id})" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  getFilteredTests() {
    const search = document.getElementById('uat-search')?.value.toLowerCase() || '';
    
    return this.tests.filter(test => {
      if (this.filters.status !== 'all' && test.status !== this.filters.status) return false;
      if (search && !test.description?.toLowerCase().includes(search) && 
          !test.steps?.toLowerCase().includes(search)) return false;
      return true;
    });
  },

  bindEvents() {
    document.getElementById('btn-add-test')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-test-empty')?.addEventListener('click', () => this.add());
    document.getElementById('btn-export-uat')?.addEventListener('click', () => this.export());
    
    document.getElementById('uat-filter-status')?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.render();
    });
    
    document.getElementById('uat-search')?.addEventListener('input', () => this.render());
  },

  add() {
    const nextNumber = this.tests.length > 0 ? Math.max(...this.tests.map(t => t.testNumber || 0)) + 1 : 1;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Test Number</label>
          <input type="number" class="form-control" id="uat-number" value="${nextNumber}">
        </div>
        <div class="form-group">
          <label class="form-label">Tester</label>
          <input type="text" class="form-control" id="uat-tester" placeholder="Nombre del tester">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Descripción</label>
        <input type="text" class="form-control" id="uat-desc" placeholder="Qué se está probando">
      </div>
      <div class="form-group">
        <label class="form-label">Test Steps</label>
        <textarea class="form-textarea" id="uat-steps" rows="3" placeholder="Pasos para ejecutar el test..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Expected Result</label>
        <input type="text" class="form-control" id="uat-expected" placeholder="Resultado esperado">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Dependencies</label>
          <input type="text" class="form-control" id="uat-deps" placeholder="Dependencias del test">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="uat-status">
            <option value="open" selected>Open</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Comments / Actual Result</label>
        <textarea class="form-textarea" id="uat-comments" rows="2" placeholder="Resultado actual o comentarios..."></textarea>
      </div>
    `;
    
    App.openModal('Nuevo Test Case', content, async () => {
      const description = document.getElementById('uat-desc').value.trim();
      if (!description) {
        App.toast('La descripción es obligatoria', 'error');
        return false;
      }
      
      const test = {
        projectId: App.currentProject.id,
        testNumber: parseInt(document.getElementById('uat-number').value) || nextNumber,
        description,
        steps: document.getElementById('uat-steps').value.trim(),
        expectedResult: document.getElementById('uat-expected').value.trim(),
        dependencies: document.getElementById('uat-deps').value.trim(),
        status: document.getElementById('uat-status').value,
        tester: document.getElementById('uat-tester').value.trim(),
        comments: document.getElementById('uat-comments').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.UAT, test);
      await this.load();
      App.toast('Test case creado', 'success');
    });
  },

  async edit(id) {
    const test = this.tests.find(t => t.id === id);
    if (!test) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Test Number</label>
          <input type="number" class="form-control" id="uat-number" value="${test.testNumber || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Tester</label>
          <input type="text" class="form-control" id="uat-tester" value="${App.escapeHtml(test.tester || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Descripción</label>
        <input type="text" class="form-control" id="uat-desc" value="${App.escapeHtml(test.description)}">
      </div>
      <div class="form-group">
        <label class="form-label">Test Steps</label>
        <textarea class="form-textarea" id="uat-steps" rows="3">${App.escapeHtml(test.steps || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Expected Result</label>
        <input type="text" class="form-control" id="uat-expected" value="${App.escapeHtml(test.expectedResult || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Dependencies</label>
          <input type="text" class="form-control" id="uat-deps" value="${App.escapeHtml(test.dependencies || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="uat-status">
            <option value="open" ${test.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in-progress" ${test.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="on-hold" ${test.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
            <option value="passed" ${test.status === 'passed' ? 'selected' : ''}>Passed</option>
            <option value="failed" ${test.status === 'failed' ? 'selected' : ''}>Failed</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Comments / Actual Result</label>
        <textarea class="form-textarea" id="uat-comments" rows="2">${App.escapeHtml(test.comments || '')}</textarea>
      </div>
    `;
    
    App.openModal('Editar Test Case', content, async () => {
      const description = document.getElementById('uat-desc').value.trim();
      if (!description) {
        App.toast('La descripción es obligatoria', 'error');
        return false;
      }
      
      const updated = {
        ...test,
        testNumber: parseInt(document.getElementById('uat-number').value) || test.testNumber,
        description,
        steps: document.getElementById('uat-steps').value.trim(),
        expectedResult: document.getElementById('uat-expected').value.trim(),
        dependencies: document.getElementById('uat-deps').value.trim(),
        status: document.getElementById('uat-status').value,
        tester: document.getElementById('uat-tester').value.trim(),
        comments: document.getElementById('uat-comments').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.UAT, updated);
      await this.load();
      App.toast('Test case actualizado', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('¿Eliminar este test case?');
    if (!confirmed) return;
    
    await DB.delete(STORES.UAT, id);
    await this.load();
    App.toast('Test case eliminado', 'success');
  },

  export() {
    const data = this.tests.map(t => ({
      'Test #': t.testNumber,
      Description: t.description,
      Steps: t.steps,
      'Expected Result': t.expectedResult,
      Dependencies: t.dependencies,
      Status: t.status,
      Tester: t.tester,
      Comments: t.comments
    }));
    
    ScopeModule.downloadCSV(data, 'uat-tests.csv');
  }
};
