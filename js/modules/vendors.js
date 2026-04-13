/**
 * Vendors Module - Manage suppliers and service providers
 * For Ocean Freight projects: carriers, customs brokers, 3PL, etc.
 */

const VendorsModule = {
  vendors: [],
  filterCategory: '__all__',
  filterStatus: '__all__',
  searchQuery: '',

  // Default vendor categories for Ocean Freight
  VENDOR_CATEGORIES: [
    'Ocean Carrier',
    'Air Freight Carrier',
    'Customs Broker',
    '3PL / Warehouse',
    'Trucking / Drayage',
    'Technology Vendor',
    'Consulting Services',
    'Equipment Supplier',
    'Insurance Provider',
    'Legal Services',
    'Other'
  ],

  VENDOR_STATUSES: ['Active', 'Pending', 'Inactive', 'Under Review'],

  async load() {
    if (!App.currentProject) return;
    
    this.vendors = await DB.getAll(STORES.VENDORS, 'projectId', App.currentProject.id);
    this.render();
    this.bindEvents();
  },

  render() {
    const tbody = document.getElementById('vendors-tbody');
    const empty = document.getElementById('vendors-empty');
    const table = document.getElementById('vendors-table');
    
    let filtered = this.vendors;
    
    // Apply filters
    if (this.filterCategory !== '__all__') {
      filtered = filtered.filter(v => v.category === this.filterCategory);
    }
    if (this.filterStatus !== '__all__') {
      filtered = filtered.filter(v => v.status === this.filterStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        (v.name || '').toLowerCase().includes(q) ||
        (v.contactPerson || '').toLowerCase().includes(q) ||
        (v.services || '').toLowerCase().includes(q)
      );
    }
    
    if (filtered.length === 0) {
      table.parentElement.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    table.parentElement.style.display = 'block';
    empty.style.display = 'none';
    
    tbody.innerHTML = filtered.map(v => {
      const statusClass = {
        'Active': 'badge-success',
        'Pending': 'badge-warning',
        'Inactive': 'badge-neutral',
        'Under Review': 'badge-info'
      }[v.status] || 'badge-neutral';
      
      return `
        <tr>
          <td><strong>${App.escapeHtml(v.name)}</strong></td>
          <td>${App.escapeHtml(v.category)}</td>
          <td>${App.escapeHtml(v.contactPerson || '-')}</td>
          <td>${App.escapeHtml(v.email || '-')}<br><small>${App.escapeHtml(v.phone || '-')}</small></td>
          <td>${App.escapeHtml(v.services || '-')}</td>
          <td><span class="badge ${statusClass}">${v.status}</span></td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="VendorsModule.edit(${v.id})" title="Edit">
                <i data-lucide="pencil"></i>
              </button>
              <button class="action-btn delete" onclick="VendorsModule.delete(${v.id})" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    // Update stats
    document.getElementById('vendors-total-count').textContent = this.vendors.length;
    document.getElementById('vendors-active-count').textContent = this.vendors.filter(v => v.status === 'Active').length;
    document.getElementById('vendors-pending-count').textContent = this.vendors.filter(v => v.status === 'Pending').length;
    
    lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('btn-add-vendor')?.addEventListener('click', () => this.add());
    document.getElementById('btn-add-vendor-empty')?.addEventListener('click', () => this.add());
    
    document.getElementById('vendor-filter-category')?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.render();
    });
    
    document.getElementById('vendor-filter-status')?.addEventListener('change', (e) => {
      this.filterStatus = e.target.value;
      this.render();
    });
    
    document.getElementById('vendor-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });
  },

  add() {
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Vendor Name</label>
          <input type="text" class="form-control" id="vendor-name" placeholder="e.g., Maersk Line">
        </div>
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="vendor-category">
            ${this.VENDOR_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contact Person</label>
          <input type="text" class="form-control" id="vendor-contact" placeholder="Name of main contact">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="vendor-status">
            ${this.VENDOR_STATUSES.map(s => `<option value="${s}" ${s === 'Pending' ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="vendor-email" placeholder="contact@vendor.com">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="text" class="form-control" id="vendor-phone" placeholder="+1 234 567 890">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Services Provided</label>
        <input type="text" class="form-control" id="vendor-services" placeholder="e.g., FCL shipping, customs clearance">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="vendor-notes" rows="3" placeholder="Contract details, rates, special agreements..."></textarea>
      </div>
    `;
    
    App.openModal('Add Vendor', content, async () => {
      const name = document.getElementById('vendor-name').value.trim();
      if (!name) {
        App.toast('Vendor name is required', 'error');
        return false;
      }
      
      const vendor = {
        projectId: App.currentProject.id,
        name: name,
        category: document.getElementById('vendor-category').value,
        contactPerson: document.getElementById('vendor-contact').value.trim(),
        email: document.getElementById('vendor-email').value.trim(),
        phone: document.getElementById('vendor-phone').value.trim(),
        services: document.getElementById('vendor-services').value.trim(),
        status: document.getElementById('vendor-status').value,
        notes: document.getElementById('vendor-notes').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      await DB.add(STORES.VENDORS, vendor);
      await this.load();
      App.toast('Vendor added successfully', 'success');
    });
  },

  async edit(id) {
    const vendor = this.vendors.find(v => v.id === id);
    if (!vendor) return;
    
    const content = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Vendor Name</label>
          <input type="text" class="form-control" id="vendor-name" value="${App.escapeHtml(vendor.name)}">
        </div>
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-select" id="vendor-category">
            ${this.VENDOR_CATEGORIES.map(c => `<option value="${c}" ${c === vendor.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contact Person</label>
          <input type="text" class="form-control" id="vendor-contact" value="${App.escapeHtml(vendor.contactPerson || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="vendor-status">
            ${this.VENDOR_STATUSES.map(s => `<option value="${s}" ${s === vendor.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="vendor-email" value="${App.escapeHtml(vendor.email || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="text" class="form-control" id="vendor-phone" value="${App.escapeHtml(vendor.phone || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Services Provided</label>
        <input type="text" class="form-control" id="vendor-services" value="${App.escapeHtml(vendor.services || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="vendor-notes" rows="3">${App.escapeHtml(vendor.notes || '')}</textarea>
      </div>
    `;
    
    App.openModal('Edit Vendor', content, async () => {
      const name = document.getElementById('vendor-name').value.trim();
      if (!name) {
        App.toast('Vendor name is required', 'error');
        return false;
      }
      
      const updated = {
        ...vendor,
        name: name,
        category: document.getElementById('vendor-category').value,
        contactPerson: document.getElementById('vendor-contact').value.trim(),
        email: document.getElementById('vendor-email').value.trim(),
        phone: document.getElementById('vendor-phone').value.trim(),
        services: document.getElementById('vendor-services').value.trim(),
        status: document.getElementById('vendor-status').value,
        notes: document.getElementById('vendor-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await DB.put(STORES.VENDORS, updated);
      await this.load();
      App.toast('Vendor updated successfully', 'success');
    });
  },

  async delete(id) {
    const confirmed = await App.confirm('Are you sure you want to delete this vendor?');
    if (!confirmed) return;
    
    await DB.delete(STORES.VENDORS, id);
    await this.load();
    App.toast('Vendor deleted', 'success');
  }
};

// Register module
App.modules.vendors = VendorsModule;
