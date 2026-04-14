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
          <td>
            <strong>${App.escapeHtml(v.name)}</strong>
            ${v.attachments?.length ? `<span class="badge badge-info" style="margin-left:0.5rem;" title="${v.attachments.length} attachment(s)"><i data-lucide="paperclip" style="width:12px;height:12px;vertical-align:middle;"></i> ${v.attachments.length}</span>` : ''}
          </td>
          <td>${App.escapeHtml(v.category)}</td>
          <td>${App.escapeHtml(v.contactPerson || '-')}</td>
          <td>${App.escapeHtml(v.email || '-')}<br><small>${App.escapeHtml(v.phone || '-')}</small></td>
          <td>${App.escapeHtml(v.services || '-')}</td>
          <td><span class="badge ${statusClass}">${v.status}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="VendorsModule.edit(${v.id})" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="VendorsModule.delete(${v.id})" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
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

      <!-- Attachments Section -->
      <div class="form-section" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);">
        <h4 style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
          <i data-lucide="paperclip"></i> Attachments
          ${vendor.attachments?.length ? `<span class="badge badge-info">${vendor.attachments.length}</span>` : ''}
        </h4>

        <!-- Existing Attachments -->
        <div id="vendor-attachments-list" style="margin-bottom:1rem;">
          ${this.renderAttachmentsList(vendor)}
        </div>

        <!-- Add New Attachment -->
        <div class="form-group" style="margin-bottom:0.5rem;">
          <label class="form-label">Add New File</label>
          <input type="file" class="form-control" id="vendor-new-attachment" multiple>
          <small style="color:var(--text-secondary);">Supported: PDF, Images, Docs (max 10MB each)</small>
        </div>
      </div>
    `;

    App.openModal('Edit Vendor', content, async () => {
      const name = document.getElementById('vendor-name').value.trim();
      if (!name) {
        App.toast('Vendor name is required', 'error');
        return false;
      }
      
      // Process new attachments
      const newFiles = document.getElementById('vendor-new-attachment')?.files;
      let attachments = vendor.attachments || [];

      if (newFiles && newFiles.length > 0) {
        for (const file of newFiles) {
          if (file.size > 10 * 1024 * 1024) {
            App.toast(`File ${file.name} too large. Maximum 10MB allowed.`, 'error');
            return false;
          }
          const fileData = await this.fileToBase64(file);
          attachments.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            data: fileData,
            uploadedAt: new Date().toISOString()
          });
        }
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
        attachments: attachments,
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
  },

  // Attachment handling helpers
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  renderAttachmentsList(vendor) {
    if (!vendor.attachments || vendor.attachments.length === 0) {
      return '<p style="color:var(--text-tertiary);font-size:0.875rem;">No attachments yet</p>';
    }

    return vendor.attachments.map(att => `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-tertiary);border-radius:var(--radius);margin-bottom:0.5rem;">
        <i data-lucide="file-text" style="color:var(--primary);width:18px;height:18px;"></i>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.875rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${App.escapeHtml(att.name)}</div>
          <small style="color:var(--text-secondary);">${this.formatFileSize(att.size)} · ${new Date(att.uploadedAt).toLocaleDateString()}</small>
        </div>
        <button type="button" class="btn btn-sm btn-outline" onclick="VendorsModule.downloadAttachment(${vendor.id}, '${att.id}')" title="Download">
          <i data-lucide="download" style="width:14px;height:14px;"></i>
        </button>
        <button type="button" class="btn btn-sm btn-ghost" onclick="VendorsModule.removeAttachment(${vendor.id}, '${att.id}')" title="Remove">
          <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--danger);"></i>
        </button>
      </div>
    `).join('');
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  downloadAttachment(vendorId, attachmentId) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.attachments) return;

    const att = vendor.attachments.find(a => a.id === attachmentId);
    if (!att || !att.data) return;

    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    link.click();
  },

  async removeAttachment(vendorId, attachmentId) {
    const confirmed = await App.confirm('Remove this attachment?');
    if (!confirmed) return;

    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.attachments) return;

    vendor.attachments = vendor.attachments.filter(a => a.id !== attachmentId);
    vendor.updatedAt = new Date().toISOString();

    await DB.put(STORES.VENDORS, vendor);
    await this.load();

    // Refresh modal
    this.edit(vendorId);
    App.toast('Attachment removed', 'success');
  }
};

// Register module
App.modules.vendors = VendorsModule;
