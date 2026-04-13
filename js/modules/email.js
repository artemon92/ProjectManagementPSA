/**
 * Email Reporting Module - Visual HTML Email Generator
 */

const EmailModule = {
  async load() {
    if (!App.currentProject) return;
    
    this.bindEvents();
    
    // Set default subject
    document.getElementById('email-subject').value = `[PSA BDP] Weekly Project Status - ${App.currentProject.name}`;
    
    // Try to load participants for default To field
    await this.loadParticipants();
    
    // Auto-generate email on load
    await this.generateVisualEmail();
  },

  async loadParticipants() {
    const participants = await DB.getAll(STORES.PARTICIPANTS, 'projectId', App.currentProject.id);
    const emails = participants.filter(p => p.email).map(p => p.email).join(', ');
    if (emails) {
      document.getElementById('email-to').value = emails;
    }
  },

  bindEvents() {
    document.getElementById('btn-generate-email')?.addEventListener('click', () => this.generateVisualEmail());
    document.getElementById('btn-copy-email')?.addEventListener('click', () => this.copyToClipboard());
    document.getElementById('btn-send-email')?.addEventListener('click', () => this.openEmailClient());
  },

  async generateVisualEmail() {
    const psrs = await DB.getAll(STORES.PSR, 'projectId', App.currentProject.id);
    const latestPsr = psrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    const cover = CoverModule.data || {};
    const project = App.currentProject;
    
    // Get OIL items
    const oilItems = await DB.getAll(STORES.OIL, 'projectId', project.id);
    const openOil = oilItems.filter(i => i.status !== 'completed');
    
    const d = latestPsr || {};
    const reportDate = d.reportDate ? new Date(d.reportDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Status colors
    const statusColors = {
      green: '#10B981',
      amber: '#F59E0B',
      red: '#EF4444'
    };
    
    // Generate HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1F3F 0%, #1a3a6e 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Project Status Report</h1>
              <p style="color: #00B2E3; margin: 10px 0 0 0; font-size: 16px;">${project.name}</p>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Week of ${reportDate}</p>
            </td>
          </tr>
          
          <!-- Project Health -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #E31837; padding-bottom: 10px;">
                📊 Overall Project Health
              </h2>
              
              <!-- Progress Bar -->
              <div style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 500;">Overall Progress</span>
                  <span style="color: #0B1F3F; font-weight: 700; font-size: 18px;">${d.progress || 0}%</span>
                </div>
                <div style="background-color: #e0e0e0; border-radius: 10px; height: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #00B2E3 0%, #0B1F3F 100%); height: 100%; width: ${d.progress || 0}%; border-radius: 10px;"></div>
                </div>
              </div>
              
              <!-- Health Indicators -->
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 15px;">
                <tr>
                  <td style="width: 50%; padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.schedule] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Schedule</div>
                      <div style="font-weight: 600; color: ${statusColors[d.schedule] || '#10B981'}; text-transform: uppercase;">${d.schedule || 'green'}</div>
                      ${d.scheduleComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.scheduleComment}</div>` : ''}
                    </div>
                  </td>
                  <td style="width: 50%; padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.budget] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Budget</div>
                      <div style="font-weight: 600; color: ${statusColors[d.budget] || '#10B981'}; text-transform: uppercase;">${d.budget || 'green'}</div>
                      ${d.budgetComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.budgetComment}</div>` : ''}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.resources] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Resources</div>
                      <div style="font-weight: 600; color: ${statusColors[d.resources] || '#10B981'}; text-transform: uppercase;">${d.resources || 'green'}</div>
                      ${d.resourcesComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.resourcesComment}</div>` : ''}
                    </div>
                  </td>
                  <td style="padding: 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 12px; border-left: 4px solid ${statusColors[d.scope] || '#10B981'};">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Scope</div>
                      <div style="font-weight: 600; color: ${statusColors[d.scope] || '#10B981'}; text-transform: uppercase;">${d.scope || 'green'}</div>
                      ${d.scopeComment ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${d.scopeComment}</div>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Accomplishments -->
          ${d.accomplishments && d.accomplishments.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
                ✅ Key Accomplishments
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.6;">
                ${d.accomplishments.map(a => `<li style="margin-bottom: 8px;">${a.description} <span style="color: #666; font-size: 12px;">(${a.date || 'N/A'})</span></li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}
          
          <!-- Open Items -->
          ${openOil.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
                ⚠️ Open Items Requiring Attention
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${openOil.slice(0, 5).map(item => `
                <tr>
                  <td style="padding: 10px; background-color: #fff8e6; border-left: 3px solid #F59E0B; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.description}</div>
                    <div style="font-size: 12px; color: #666;">
                      Priority: <span style="color: ${item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#F59E0B' : '#10B981'}; font-weight: 600; text-transform: uppercase;">${item.priority}</span> | 
                      Assigned: ${item.assignedTo || 'Unassigned'} |
                      Due: ${item.targetDate || 'No date'}
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
              ${openOil.length > 5 ? `<p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">...and ${openOil.length - 5} more open items</p>` : ''}
            </td>
          </tr>
          ` : ''}
          
          <!-- Project Links -->
          ${d.links ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #0B1F3F; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #00B2E3; padding-bottom: 10px;">
                🔗 Project Links
              </h2>
              <div style="background-color: #f0f9ff; border-radius: 6px; padding: 15px;">
                <a href="${d.links}" style="color: #00B2E3; text-decoration: none; font-weight: 500;">${d.links}</a>
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Generated by PSA BDP Project Management System<br>
                &copy; ${new Date().getFullYear()} PSA BDP - Global Ocean Freight
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Set the HTML content
    document.getElementById('email-body').value = htmlEmail;
    
    // Also update preview if exists
    const previewDiv = document.getElementById('email-preview');
    if (previewDiv) {
      previewDiv.innerHTML = htmlEmail;
    }
  },

  copyToClipboard() {
    const body = document.getElementById('email-body');
    body.select();
    document.execCommand('copy');
    App.toast('Email HTML copiado al portapapeles', 'success');
  },

  openEmailClient() {
    const to = document.getElementById('email-to').value;
    const subject = document.getElementById('email-subject').value;
    const htmlBody = document.getElementById('email-body').value;
    
    // Create plain text version for mailto
    const plainText = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText.substring(0, 1500))}`;
    window.open(mailto, '_blank');
  }
};

// Register module
App.modules.email = EmailModule;
