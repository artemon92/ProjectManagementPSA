/**
 * Budget Module - Track project budget vs actual costs
 */

const BudgetModule = {
  items: [],
  vendors: [],
  filterCategory: '__all__',

  // Default budget categories for Ocean Freight projects
  BUDGET_CATEGORIES: [
    'Freight & Shipping',
    'Customs & Duties',
    'Warehousing & Storage',
    'Technology & Systems',
    'Consulting Services',
    'Equipment & Infrastructure',
    'Insurance',
    'Legal & Compliance',
    'Training & Change Management',
    'Contingency',
    'Other'
  ],

  async load() {
    if (!App.currentProject) return;
    
    this.items = await DB.getAll(STORES.BUDGET, 'projectId', App.currentProject.id);
    this.vendors = await DB.getAll(STORES.VENDORS, 'projectId', App.currentProject.id);
    this.render();
    this.bindEvents();
  },

  render() {
    const tbody = document.getElementById('budget-tbody');
    const empty = document.getElementById('budget-empty');
    const table = document.getElementById('budget-table');
    
    let filtered = this.items;
    if (this.filterCategory !== '__all__') {
      filtered = filtered.filter(i => i.category === this.filterCategory);
    }
    
    // Calculate totals
    const totalEstimated = this.items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
    const totalActual = this.items.reduce((sum, i) => sum + (i.actualCost || 0), 0);
    const totalVariance = totalEstimated - totalActual;
    const variancePct = totalEstimated > 0 ? ((totalVariance / totalEstimated) * 100).toFixed(1) : 0;
    
    // Update summary cards
    document.getElementById('budget-total-estimated').textContent = this.formatCurrency(totalEstimated);
    document.getElementById('budget-total-actual').textContent = this.formatCurrency(totalActual);
    document.getElementById('budget-total-variance').textContent = 
      (totalVariance >= 0 ? '+' : '') + this.formatCurrency(totalVariance);
    document.getElementById('budget-total-variance').className = 
      `kpi-value ${totalVariance >= 0 ? 'text-success' : 'text-danger'}`;
    
    if (filtered.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    tbody.innerHTML = filtered.map(item => {
      const variance = (item.estimatedCost || 0) - (item.actualCost || 0);
      const variancePct = item.estimatedCost > 0 ? ((variance / item.estimatedCost) * 100).toFixed(1) : 0;
      const varianceClass = variance >= 0 ? 'text-success' : 'text-danger';
      const varianceIcon = variance >= 0 ? 'trending-down' : 'trending-up';
      
      const vendor = this.vendors.find(v => v.id === item.vendorId);
      const vendorName = vendor ? vendor.name : (item.vendorName || '-');
      
      return `
        <tr>
          <td><strong>${App.escapeHtml(item.name)}</strong><br><small class="text-muted">${App.escapeHtml(item.category)}</small></td>
          <td>${App.escapeHtml(vendorName)}</td>
          <td class="text-right">${this.formatCurrency(item.estimatedCost)}</td>
          <td class="text-right">${this.formatCurrency(item.actualCost || 0)}</td>
          <td class="text-right ${varianceClass}">
            <i data-lucide="${varianceIcon}" style="width:14px;height:14px;vertical-align:middle;"></i>
            ${Math.abs(variance).toLocaleString('en-US', {style:'currency',currency:'USD'})}
            <br><small>(${variance >= 0 ? 'Under' : 'Over'} ${Math.abs(variancePct)}%)</small>
          </td>
          <td>
            <div class="progress-bar" style="height:8px;margin-bottom:4px;">
              <div class="progress-bar-fill ${variance >= 0 ? 'bg-success' : 'bg-danger'}" style="width:${Math.min(100, (item.actualCost || 0) / (item.estimatedCost || 1) * 100)}%"></div>
            </div>
            <small>${Math.round(((item.actualCost || 0) / (item.estimatedCost || 1)) * 100)}% spent</small>
          </td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="BudgetModule.edit(${item.id})" title="Edit">
                <i data-lucide="pencil"></i>
              </button>
              <button class="action-btn delete" onclick="BudgetModule.delete(${item.id})" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-budget')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-budget-empty')?.addEventListener('click', () => this.add());
    
    document.getElementById('budget-filter-category')?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.render();
    });
  },

  add() {
    const vendorOptions = this.vendors.length > 0 
      ? this.vendors.map(v => `<option value="${v.id}">${App.escapeHtml(v.name)} (${v.category})</option>`).join('')
      : '<option value="">No vendors available</option>';
    
    const content = `
      <div class="form-group">
        <label class="form-label required">Line Item Name</label>
        <input type="text" class="form-control" id="budget-name" placeholder="e.g., Ocean Freight Q1">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="budget-category">
            ${this.BUDGET_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Vendor</label>
          <select class="form-select" id="budget-vendor">
            <option value="">Select vendor...</option>
            ${vendorOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Estimated Cost (USD)</label>
          <input type="number" class="form-control" id="budget-estimated" min="0" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Actual Cost (USD)</label>
          <input type="number" class="form-control" id="budget-actual" min="0" step="0.01" placeholder="0.00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description / Notes</label>
        <textarea class="form-textarea" id="budget-notes" rows="2" placeholder="Scope, assumptions, payment terms..."></textarea>
      </div>
    `;
    
    App.openModal('Add Budget Line Item', content, async () => {
      const name = document.getElementById('budget-name').value.trim();
      const estimated = parseFloat(document.getElementById('budget-estimated').value) || 0;
      
      if (!name) {
        App.toast('Line item name is required', 'error');
        return false;
      }
      if (estimated <= 0) {
        App.toast('Estimated cost must be greater than 0', 'error');
        return false;
      }
      
      const vendorId = document.getElementById('budget-vendor').value;
      const vendor = this.vendors.find(v => v.id == vendorId);
      
      const item = {
        projectId: App.currentProject.id,
        name: name,
        category: document.getElementById('budget-category').value,
        vendorId: vendorId || null,
        vendorName: vendor ? vendor.name : null,
        estimatedCost: estimated,
        actualCost: parseFloat(document.getElementById('budget-actual').value) || 0,
        notes: document.getElementById('budget-notes').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.BUDGET, item);
      await this.load();
      App.toast('Budget item added', 'success');
    });
  },

  async edit(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    
    const vendorOptions = this.vendors.length > 0 
      ? this.vendors.map(v => `<option value="${v.id}" ${v.id == item.vendorId ? 'selected' : ''}>${App.escapeHtml(v.name)} (${v.category})</option>`).join('')
      : '<option value="">No vendors available</option>';
    
    const content = `
      <div class="form-group">
        <label class="form-label required">Line Item Name</label>
        <input type="text" class="form-control" id="budget-name" value="${App.escapeHtml(item.name)}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="budget-category">
            ${this.BUDGET_CATEGORIES.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Vendor</label>
          <select class="form-select" id="budget-vendor">
            <option value="">Select vendor...</option>
            ${vendorOptions}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Estimated Cost (USD)</label>
          <input type="number" class="form-control" id="budget-estimated" min="0" step="0.01" value="${item.estimatedCost || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Actual Cost (USD)</label>
          <input type="number" class="form-control" id="budget-actual" min="0" step="0.01" value="${item.actualCost || 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description / Notes</label>
        <textarea class="form-textarea" id="budget-notes" rows="2">${App.escapeHtml(item.notes || '')}</textarea>
      </div>
    `;
    
    App.openModal('Edit Budget Line Item', content, async () => {
      const name = document.getElementById('budget-name').value.trim();
      const estimated = parseFloat(document.getElementById('budget-estimated').value) || 0;
      
      if (!name) {
        App.toast('Line item name is required', 'error');
        return false;
      }
      if (estimated <= 0) {
        App.toast('Estimated cost must be greater than 0', 'error');
        return false;
      }
      
      const vendorId = document.getElementById('budget-vendor').value;
      const vendor = this.vendors.find(v => v.id == vendorId);
      
      const updated = {
        ...item,
        name: name,
        category: document.getElementById('budget-category').value,
        vendorId: vendorId || null,
        vendorName: vendor ? vendor.name : null,
        estimatedCost: estimated,
        actualCost: parseFloat(document.getElementById('budget-actual').value) || 0,
        notes: document.getElementById('budget-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.BUDGET, updated);
      await this.load();
      App.toast('Budget item updated', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('Are you sure you want to delete this budget item?');
    if (!confirmed) return;
    
    await DB.delete(STORES.BUDGET, id);
    await this.load();
    App.toast('Budget item deleted', 'success');
  },

  formatCurrency(value) {
    return (value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
};

// Register module
App.modules.budget = BudgetModule;
