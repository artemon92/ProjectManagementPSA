/**
 * Expenses Module - Track project expenses
 */

const ExpensesModule = {
  expenses: [],
  filterCategory: '__all__',
  filterMonth: '__all__',

  EXPENSE_CATEGORIES: [
    'Travel & Accommodation',
    'Software & Licenses',
    'Hardware & Equipment',
    'Professional Services',
    'Training & Events',
    'Office Supplies',
    'Communications',
    'Meals & Entertainment',
    'Shipping & Logistics',
    'Other'
  ],

  async load() {
    if (!App.currentProject) return;
    
    this.expenses = await DB.getAll(STORES.EXPENSES, 'projectId', App.currentProject.id);
    this.expenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    this.populateFilters();
    this.render();
    this.bindEvents();
  },

  populateFilters() {
    const catSelect = document.getElementById('expense-filter-category');
    const monthSelect = document.getElementById('expense-filter-month');
    if (!catSelect || !monthSelect) return;
    
    // Get unique categories from expenses
    const categories = ['__all__', ...new Set(this.expenses.map(e => e.category).filter(Boolean).sort())];
    catSelect.innerHTML = categories.map(c => 
      `<option value="${c}">${c === '__all__' ? I18n.t('expenses.all_categories') : c}</option>`
    ).join('');
    catSelect.value = this.filterCategory;
    
    // Get unique months
    const months = ['__all__', ...new Set(this.expenses.map(e => (e.date || '').slice(0, 7)).filter(Boolean).sort().reverse())];
    monthSelect.innerHTML = months.map(m => 
      `<option value="${m}">${m === '__all__' ? I18n.t('expenses.all_months') : this.formatMonth(m)}</option>`
    ).join('');
    monthSelect.value = this.filterMonth;
  },

  render() {
    const tbody = document.getElementById('expenses-tbody');
    const empty = document.getElementById('expenses-empty');
    const table = document.getElementById('expenses-table');
    
    let filtered = this.expenses;
    if (this.filterCategory !== '__all__') {
      filtered = filtered.filter(e => e.category === this.filterCategory);
    }
    if (this.filterMonth !== '__all__') {
      filtered = filtered.filter(e => (e.date || '').startsWith(this.filterMonth));
    }
    
    // Calculate totals
    const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
    document.getElementById('expenses-total').textContent = this.formatCurrency(totalAmount);
    document.getElementById('expenses-count').textContent = I18n.t('expenses.items', {count: filtered.length});
    
    if (filtered.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    tbody.innerHTML = filtered.map(e => `
      <tr>
        <td>${e.date ? new Date(e.date).toLocaleDateString() : '-'}</td>
        <td><strong>${App.escapeHtml(e.description)}</strong><br><small class="text-muted">${App.escapeHtml(e.category)}</small></td>
        <td>${App.escapeHtml(e.vendor || '-')}</td>
        <td class="text-right font-medium">${this.formatCurrency(e.amount)}</td>
        <td>
          ${e.receiptData ? `
            <button class="btn btn-sm btn-outline" onclick="ExpensesModule.downloadReceipt(${e.id})" title="${I18n.t('expenses.download_receipt')}">
              <i data-lucide="file-text" style="width:14px;height:14px;"></i> ${I18n.t('expenses.receipt')}
            </button>
          ` : `
            <span class="badge ${e.receipt ? 'badge-success' : 'badge-neutral'}">
              ${e.receipt ? I18n.t('expenses.receipt_yes') : I18n.t('expenses.receipt_no')}
            </span>
          `}
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="ExpensesModule.edit(${e.id})" title="${I18n.t('action.edit')}">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="ExpensesModule.delete(${e.id})" title="${I18n.t('action.delete')}">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-expense')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-expense-empty')?.addEventListener('click', () => this.add());
    
    document.getElementById('expense-filter-category')?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.render();
    });
    
    document.getElementById('expense-filter-month')?.addEventListener('change', (e) => {
      this.filterMonth = e.target.value;
      this.render();
    });
  },

  formatMonth(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${names[parseInt(m, 10) - 1]} ${y}`;
  },

  add() {
    const today = new Date().toISOString().split('T')[0];
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-control" id="expense-date" value="${today}">
        </div>
        <div class="form-group">
          <label class="form-label required">Amount (USD)</label>
          <input type="number" class="form-control" id="expense-amount" min="0" step="0.01" placeholder="0.00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Description</label>
        <input type="text" class="form-control" id="expense-description" placeholder="What was this expense for?">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="expense-category">
            ${this.EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Vendor / Merchant</label>
          <input type="text" class="form-control" id="expense-vendor" placeholder="e.g., Hilton, Amazon">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" id="expense-receipt" style="margin-right:8px;" onchange="ExpensesModule.toggleReceiptUpload('add')">
          Receipt available
        </label>
      </div>
      <div class="form-group" id="receipt-upload-container" style="display:none;">
        <label class="form-label">Attach Receipt</label>
        <input type="file" class="form-control" id="expense-receipt-file" accept="image/*,.pdf">
        <small style="color:var(--text-secondary);">Supported: Images, PDF (max 5MB)</small>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="expense-notes" rows="2" placeholder="Additional details..."></textarea>
      </div>
    `;

    App.openModal('Add Expense', content, async () => {
      const date = document.getElementById('expense-date').value;
      const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
      const description = document.getElementById('expense-description').value.trim();
      
      if (!date || amount <= 0 || !description) {
        App.toast('Date, amount (greater than 0), and description are required', 'error');
        return false;
      }
      
      const receiptChecked = document.getElementById('expense-receipt').checked;
      const receiptFile = document.getElementById('expense-receipt-file').files[0];

      let receiptData = null;
      if (receiptChecked && receiptFile) {
        if (receiptFile.size > 5 * 1024 * 1024) {
          App.toast('File too large. Maximum 5MB allowed.', 'error');
          return false;
        }
        receiptData = await this.fileToBase64(receiptFile);
      }

      const expense = {
        projectId: App.currentProject.id,
        date: date,
        amount: amount,
        description: description,
        category: document.getElementById('expense-category').value,
        vendor: document.getElementById('expense-vendor').value.trim(),
        receipt: receiptChecked,
        receiptFileName: receiptFile?.name || null,
        receiptData: receiptData,
        notes: document.getElementById('expense-notes').value.trim(),
        createdAt: new Date().toISOString()
      };

      await DB.add(STORES.EXPENSES, expense);
      await this.load();
      App.toast(I18n.t('expenses.added'), 'success');
    });
  },

  async edit(id) {
    const expense = this.expenses.find(e => e.id === id);
    if (!expense) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-control" id="expense-date" value="${expense.date || ''}">
        </div>
        <div class="form-group">
          <label class="form-label required">Amount (USD)</label>
          <input type="number" class="form-control" id="expense-amount" min="0" step="0.01" value="${expense.amount || 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Description</label>
        <input type="text" class="form-control" id="expense-description" value="${App.escapeHtml(expense.description)}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="expense-category">
            ${this.EXPENSE_CATEGORIES.map(c => `<option value="${c}" ${c === expense.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Vendor / Merchant</label>
          <input type="text" class="form-control" id="expense-vendor" value="${App.escapeHtml(expense.vendor || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <input type="checkbox" id="expense-receipt" ${expense.receipt ? 'checked' : ''} style="margin-right:8px;" onchange="ExpensesModule.toggleReceiptUpload('edit')">
          Receipt available
        </label>
      </div>
      ${expense.receiptData ? `
      <div class="form-group" id="current-receipt-container">
        <label class="form-label">Current Receipt</label>
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);">
          <i data-lucide="file-text" style="color:var(--primary);"></i>
          <span style="flex:1;">${App.escapeHtml(expense.receiptFileName || 'receipt')}</span>
          <button type="button" class="btn btn-sm btn-outline" onclick="ExpensesModule.downloadReceipt(${expense.id})">
            <i data-lucide="download"></i> Download
          </button>
          <button type="button" class="btn btn-sm btn-ghost" onclick="ExpensesModule.removeReceipt(${expense.id})" title="Remove">
            <i data-lucide="trash-2" style="color:var(--danger);"></i>
          </button>
        </div>
      </div>
      ` : ''}
      <div class="form-group" id="receipt-upload-container-edit" style="display:${expense.receipt && !expense.receiptData ? 'block' : 'none'};">
        <label class="form-label">${expense.receiptData ? 'Replace Receipt' : 'Attach Receipt'}</label>
        <input type="file" class="form-control" id="expense-receipt-file" accept="image/*,.pdf">
        <small style="color:var(--text-secondary);">Supported: Images, PDF (max 5MB)</small>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="expense-notes" rows="2">${App.escapeHtml(expense.notes || '')}</textarea>
      </div>
    `;

    App.openModal('Edit Expense', content, async () => {
      const date = document.getElementById('expense-date').value;
      const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
      const description = document.getElementById('expense-description').value.trim();
      
      if (!date || amount <= 0 || !description) {
        App.toast('Date, amount (greater than 0), and description are required', 'error');
        return false;
      }
      
      const receiptChecked = document.getElementById('expense-receipt').checked;
      const receiptFile = document.getElementById('expense-receipt-file')?.files[0];

      let receiptData = expense.receiptData;
      let receiptFileName = expense.receiptFileName;

      if (receiptFile) {
        if (receiptFile.size > 5 * 1024 * 1024) {
          App.toast('File too large. Maximum 5MB allowed.', 'error');
          return false;
        }
        receiptData = await this.fileToBase64(receiptFile);
        receiptFileName = receiptFile.name;
      }

      const updated = {
        ...expense,
        date: date,
        amount: amount,
        description: description,
        category: document.getElementById('expense-category').value,
        vendor: document.getElementById('expense-vendor').value.trim(),
        receipt: receiptChecked,
        receiptFileName: receiptFileName,
        receiptData: receiptData,
        notes: document.getElementById('expense-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };

      await DB.put(STORES.EXPENSES, updated);
      await this.load();
      App.toast(I18n.t('expenses.updated'), 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm(I18n.t('expenses.confirm_delete'));
    if (!confirmed) return;
    
    await DB.delete(STORES.EXPENSES, id);
    await this.load();
    App.toast(I18n.t('expenses.deleted'), 'success');
  },

  formatCurrency(value) {
    return (value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  },

  // File handling helpers
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  toggleReceiptUpload(mode) {
    const checkbox = document.getElementById('expense-receipt');
    const containerId = mode === 'add' ? 'receipt-upload-container' : 'receipt-upload-container-edit';
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = checkbox.checked ? 'block' : 'none';
    }
  },

  downloadReceipt(id) {
    const expense = this.expenses.find(e => e.id === id);
    if (!expense || !expense.receiptData) return;

    const link = document.createElement('a');
    link.href = expense.receiptData;
    link.download = expense.receiptFileName || 'receipt';
    link.click();
  },

  async removeReceipt(id) {
    const confirmed = await App.confirm(I18n.t('expenses.confirm_remove_receipt'));
    if (!confirmed) return;

    const expense = this.expenses.find(e => e.id === id);
    if (!expense) return;

    expense.receiptData = null;
    expense.receiptFileName = null;
    expense.updatedAt = new Date().toISOString();

    await DB.put(STORES.EXPENSES, expense);
    await this.load();

    // Refresh modal
    this.edit(id);
    App.toast(I18n.t('expenses.receipt_removed'), 'success');
  }
};

// Register module
App.modules.expenses = ExpensesModule;
