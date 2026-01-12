
import React, { useState, useEffect } from 'react';

interface InvoiceProps {
  onBack: () => void;
  currencySymbol?: string;
}

type InvoiceTemplate = 'Simple' | 'Detailed' | 'Service Summary';

// Fix: Defined the missing templates array for the picker modal
const templates: { name: InvoiceTemplate; icon: string; desc: string }[] = [
  { name: 'Detailed', icon: 'description', desc: 'Full breakdown with line items and descriptions' },
  { name: 'Simple', icon: 'view_agenda', desc: 'Compact view showing totals and basic info' },
  { name: 'Service Summary', icon: 'summarize', desc: 'Brief list of services and final price' },
];

const Invoice: React.FC<InvoiceProps> = ({ onBack, currencySymbol = '$' }) => {
  const [depositPaid, setDepositPaid] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate>('Detailed');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    setCurrentTemplate(template);
    setIsTemplatePickerOpen(false);
    setIsMenuOpen(false);
  };

  const handleExportPDF = () => {
    setIsMenuOpen(false);
    setIsExportingPDF(true);
    
    // Simulate PDF generation delay
    setTimeout(() => {
      setIsExportingPDF(false);
      
      // Create a mock PDF file (actually a text file for this demo)
      const mockContent = `
        INVOICE #INV-2023
        Date: October 24, 2023
        Client: John Doe
        
        SERVICES:
        - Exterior Window Cleaning: ${currencySymbol}150.00
        - Screen Deep Clean: ${currencySymbol}45.00
        - Track Vacuuming: ${currencySymbol}30.00
        
        TOTAL: ${currencySymbol}243.00
        Status: DRAFT
      `;
      
      const blob = new Blob([mockContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ClearView_Invoice_INV-2023.pdf');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToast('Invoice exported as PDF successfully');
    }, 1500);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen relative overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900/95 dark:bg-white/95 backdrop-blur text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 dark:border-slate-200">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <span className="text-xs font-bold truncate">{toast}</span>
          </div>
        </div>
      )}

      {/* Global Export Loader */}
      {isExportingPDF && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
            <p className="text-sm font-black uppercase tracking-widest text-primary">Generating PDF...</p>
          </div>
        </div>
      )}

      <div className="max-w-[480px] mx-auto min-h-screen flex flex-col shadow-xl bg-white dark:bg-[#1a242f] relative">
        {/* TopAppBar */}
        <div className="flex items-center bg-white dark:bg-[#1a242f] p-4 pb-2 justify-between border-b dark:border-slate-800 sticky top-0 z-50">
          <div onClick={onBack} className="text-[#0d141b] dark:text-slate-200 flex size-12 shrink-0 items-center justify-start cursor-pointer">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </div>
          <h2 className="text-[#0d141b] dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Invoice #INV-2023</h2>
          <div className="flex w-12 items-center justify-end relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors ${isMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent'} text-[#0d141b] dark:text-slate-200`}
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <button 
                    onClick={() => setIsTemplatePickerOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">Dashboard_Customize</span>
                    <span className="text-sm font-semibold">Templates</span>
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors border-t border-slate-50 dark:border-slate-700"
                  >
                    <span className="material-symbols-outlined text-slate-400 text-xl">picture_as_pdf</span>
                    <span className="text-sm font-semibold">Export PDF</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors border-t border-slate-50 dark:border-slate-700 text-slate-400">
                    <span className="material-symbols-outlined text-xl">content_copy</span>
                    <span className="text-sm font-semibold">Duplicate</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* HeadlineText */}
          <div className="px-4 py-6 flex justify-between items-start">
            <div>
              <h3 className="text-[#0d141b] dark:text-white tracking-light text-2xl font-bold leading-tight">Service Quote</h3>
              <p className="text-[#4c739a] dark:text-slate-400 text-sm font-normal leading-normal mt-1">Client: John Doe • October 24, 2023</p>
              <div className="mt-2 flex items-center gap-2">
                 <span className="text-[10px] font-bold uppercase text-slate-400">Template:</span>
                 <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">{currentTemplate}</span>
              </div>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Draft
            </div>
          </div>

          {/* Business Details */}
          {currentTemplate !== 'Simple' && (
            <div className="px-4 mb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-background-light dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">visibility</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">ClearView Windows</p>
                    <p className="text-xs text-[#4c739a] dark:text-slate-400">service@clearview.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Section */}
          <div className="border-t dark:border-slate-800 mt-2">
            <h3 className="text-[#0d141b] dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">Services</h3>
          </div>
          <div className="space-y-1">
            <LineItem 
              title="Exterior Window Cleaning" 
              desc="Full exterior wash for all glass surfaces" 
              price={`${currencySymbol}150.00`} 
              icon="window" 
              variant={currentTemplate}
            />
            <LineItem 
              title="Screen Deep Clean" 
              desc="Removal and detailed agitation of debris" 
              price={`${currencySymbol}45.00`} 
              icon="grid_view" 
              variant={currentTemplate}
            />
            <LineItem 
              title="Track Vacuuming" 
              desc="Industrial vacuum for sliding tracks" 
              price={`${currencySymbol}30.00`} 
              icon="cleaning_services" 
              variant={currentTemplate}
            />
          </div>

          {/* Totals */}
          <div className={`px-4 py-6 mt-4 border-t dark:border-slate-800 ${currentTemplate === 'Simple' ? 'bg-primary/5 dark:bg-primary/5' : 'bg-background-light/50 dark:bg-slate-900/30'}`}>
            <div className="flex justify-between mb-2">
              <p className="text-[#4c739a] dark:text-slate-400 text-base">Subtotal</p>
              <p className="text-[#0d141b] dark:text-slate-100 text-base font-medium">{currencySymbol}225.00</p>
            </div>
            <div className="flex justify-between mb-4">
              <p className="text-[#4c739a] dark:text-slate-400 text-base">Tax (8%)</p>
              <p className="text-[#0d141b] dark:text-slate-100 text-base font-medium">{currencySymbol}18.00</p>
            </div>
            <div className="flex justify-between pt-4 border-t border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-[#0d141b] dark:text-white text-xl font-bold">Total Amount</p>
              <p className="text-primary text-xl font-black">{currencySymbol}243.00</p>
            </div>
          </div>

          {/* Administrative Controls */}
          {currentTemplate === 'Detailed' && (
            <div className="px-4 pt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-[#0d141b] dark:text-slate-100 text-sm font-bold uppercase tracking-wider">Billing Settings</h3>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#4c739a]">payments</span>
                  <span className="text-[#0d141b] dark:text-slate-100 font-medium">Deposit Paid</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={depositPaid} 
                    onChange={(e) => setDepositPaid(e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#4c739a]">schedule</span>
                  <span className="text-[#0d141b] dark:text-slate-100 font-medium">Scheduled for</span>
                </div>
                <span className="text-sm font-semibold text-primary">Oct 30, 09:00 AM</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 w-full max-w-[480px] p-4 bg-white/80 dark:bg-[#1a242f]/80 backdrop-blur-md border-t dark:border-slate-800 z-50">
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/30 active:scale-[0.98]">
            <span className="material-symbols-outlined">send</span>
            Send to Client
          </button>
          <div className="h-4"></div>
        </div>

        {/* Template Picker Modal */}
        {isTemplatePickerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Choose Template</h3>
                <button onClick={() => setIsTemplatePickerOpen(false)} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                   <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-2">
                {templates.map((t) => (
                  <button 
                    key={t.name}
                    onClick={() => handleTemplateSelect(t.name)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      currentTemplate === t.name 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`size-12 rounded-xl flex items-center justify-center ${currentTemplate === t.name ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold ${currentTemplate === t.name ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>{t.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{t.desc}</p>
                    </div>
                    {currentTemplate === t.name && (
                      <span className="material-symbols-outlined text-primary font-bold">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                 <button onClick={() => setIsTemplatePickerOpen(false)} className="w-full py-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-600">
                   Cancel
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LineItem: React.FC<{ 
  title: string; 
  desc: string; 
  price: string; 
  icon: string;
  variant: InvoiceTemplate;
}> = ({ title, desc, price, icon, variant }) => {
  if (variant === 'Service Summary') {
    return (
      <div className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors animate-in slide-in-from-right-2">
        <div className="flex-1 min-w-0">
          <p className="text-[#0d141b] dark:text-slate-100 text-sm font-bold truncate">{title}</p>
        </div>
        <p className="text-[#0d141b] dark:text-slate-100 text-sm font-black">{price}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-transparent px-4 min-h-[72px] py-2 justify-between animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        {variant !== 'Simple' && (
          <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <p className="text-[#0d141b] dark:text-slate-100 text-base font-medium leading-normal line-clamp-1">{title}</p>
          {variant === 'Detailed' && (
            <p className="text-[#4c739a] dark:text-slate-400 text-sm font-normal leading-normal line-clamp-2">{desc}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[#0d141b] dark:text-slate-100 text-base font-semibold leading-normal">{price}</p>
      </div>
    </div>
  );
};

export default Invoice;
