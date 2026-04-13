/**
 * Finance Module - Combines Budget, Expenses, and Vendors with tabs
 */

const FinanceModule = {
  currentTab: 'budget',
  
  async load() {
    if (!App.currentProject) return;
    
    // Load all three modules
    await BudgetModule.load();
    await ExpensesModule.load();
    await VendorsModule.load();
    
    // Bind tab buttons
    this.bindTabButtons();
    
    // Show current tab
    this.switchTab(this.currentTab);
  },

  bindTabButtons() {
    // Tab buttons are handled by onclick in HTML
  },

  switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.sub-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === tab);
    });
    
    // Show/hide tab content
    document.querySelectorAll('.finance-tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`finance-tab-${tab}`);
    if (activeContent) {
      activeContent.style.display = 'block';
      activeContent.classList.add('active');
    }
    
    // Re-render icons
    lucide.createIcons();
  }
};

// Register module
App.modules.finance = FinanceModule;
