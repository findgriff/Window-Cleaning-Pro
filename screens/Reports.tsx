
import React, { useState, useMemo, useEffect } from 'react';

interface ReportsProps {
  onBack: () => void;
  currencySymbol: string;
}

type ReportPeriod = 'Month' | 'Quarter' | 'Year';

interface ChartDataPoint {
  label: string;
  value: number;
}

const Reports: React.FC<ReportsProps> = ({ onBack, currencySymbol }) => {
  const [period, setPeriod] = useState<ReportPeriod>('Month');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExportingLedger, setIsExportingLedger] = useState(false);
  const [isExportingPnL, setIsExportingPnL] = useState(false);
  const [isDataBridgeActive, setIsDataBridgeActive] = useState(true);
  const [lastSync, setLastSync] = useState('2 hours ago');
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const chartData = useMemo((): ChartDataPoint[] => {
    switch (period) {
      case 'Month':
        return [
          { label: 'W1', value: 2800 },
          { label: 'W2', value: 3500 },
          { label: 'W3', value: 4100 },
          { label: 'W4', value: 3840 },
        ];
      case 'Quarter':
        return [
          { label: 'Oct', value: 14240 },
          { label: 'Nov', value: 12800 },
          { label: 'Dec', value: 15600 },
        ];
      case 'Year':
        return [
          { label: 'J', value: 8000 }, { label: 'F', value: 9200 }, { label: 'M', value: 11000 },
          { label: 'A', value: 10500 }, { label: 'M', value: 13000 }, { label: 'J', value: 14500 },
          { label: 'J', value: 15000 }, { label: 'A', value: 13800 }, { label: 'S', value: 12400 },
          { label: 'O', value: 14240 }, { label: 'N', value: 0 }, { label: 'D', value: 0 },
        ];
      default:
        return [];
    }
  }, [period]);

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
      setToast('Cloud sync completed successfully');
    }, 2000);
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast(`${fileName} saved to downloads`);
  };

  const handleExportLedgerCSV = () => {
    setIsExportingLedger(true);
    setTimeout(() => {
      const reportName = period === 'Month' ? 'Oct_2023' : period === 'Quarter' ? 'Q4_2023' : 'FY_23_24';
      const headers = ['Date', 'Category', 'Description', 'Amount', 'Type'];
      const rows = [
        ['2023-10-01', 'Income', 'Residential Cleaning', '8400.00', 'Credit'],
        ['2023-10-02', 'Income', 'Commercial Contracts', '5840.00', 'Credit'],
        ['2023-10-05', 'Expense', 'Field Labor & Commissions', '-3200.00', 'Debit'],
        ['2023-10-10', 'Expense', 'Supplies & Equipment', '-645.00', 'Debit'],
        ['2023-10-15', 'Expense', 'General & Admin', '-1280.00', 'Debit'],
      ];
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      downloadFile(csvContent, `WindowWashPro_Ledger_${reportName}.csv`);
      setIsExportingLedger(false);
    }, 800);
  };

  const handleExportPnLCSV = () => {
    setIsExportingPnL(true);
    setTimeout(() => {
      const reportName = period === 'Month' ? 'Oct_2023' : period === 'Quarter' ? 'Q4_2023' : 'FY_23_24';
      // Professional headers
      const headers = ['Category', 'Line Item', 'Amount', 'Currency', 'Period', 'Status'];
      // P&L Data
      const rows = [
        ['REVENUE', 'Residential Cleaning', '8400.00', currencySymbol, period, 'Final'],
        ['REVENUE', 'Commercial Contracts', '5840.00', currencySymbol, period, 'Final'],
        ['EXPENSE', 'Field Labor & Commissions', '-3200.00', currencySymbol, period, 'Paid'],
        ['EXPENSE', 'Supplies & Equipment', '-645.00', currencySymbol, period, 'Paid'],
        ['EXPENSE', 'General & Admin', '-1280.00', currencySymbol, period, 'Scheduled'],
        ['', '', '', '', '', ''], // Spacer
        ['TOTALS', 'Gross Revenue', '14240.00', currencySymbol, period, ''],
        ['TOTALS', 'Operating Expenses', '-5125.00', currencySymbol, period, ''],
        ['TOTALS', 'Net Income', '9115.00', currencySymbol, period, '']
      ];
      
      const csvContent = [
        headers.join(','), 
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      downloadFile(csvContent, `WindowWashPro_PnL_${reportName}.csv`);
      setIsExportingPnL(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24 relative overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900/95 dark:bg-white/95 backdrop-blur text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 dark:border-slate-200">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <span className="text-xs font-bold truncate">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl font-black">analytics</span>
            <h1 className="text-xl font-black tracking-tight dark:text-white">Financials</h1>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['Month', 'Quarter', 'Year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as ReportPeriod)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Date Range Selection Info */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reporting Window</p>
            <h2 className="text-lg font-bold dark:text-white">
              {period === 'Month' ? 'October 2023' : period === 'Quarter' ? 'Q4 (Oct - Dec)' : 'FY 2023/24'}
            </h2>
          </div>
          <button className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Adjust Range
          </button>
        </div>

        {/* Revenue Visualization Bar Chart */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black dark:text-white uppercase tracking-wider">Revenue Trend</h3>
            <span className="text-[10px] text-slate-400 font-bold">In {currencySymbol}</span>
          </div>
          <RevenueChart data={chartData} />
        </section>

        {/* P&L Snapshot Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{currencySymbol}14,240</p>
            <div className="flex items-center gap-1 text-green-500 mt-1">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>
              <span className="text-[10px] font-bold">+8.4%</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Operating Profit</p>
            <p className="text-2xl font-black text-primary">{currencySymbol}9,115</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">64% Net Margin</p>
          </div>
        </div>

        {/* P&L Detailed Statement */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">Profit & Loss Summary</h3>
            <button 
              onClick={handleExportPnLCSV}
              disabled={isExportingPnL}
              className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <span className={`material-symbols-outlined text-sm ${isExportingPnL ? 'animate-spin' : ''}`}>
                {isExportingPnL ? 'sync' : 'download'}
              </span>
              {isExportingPnL ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
               <p className="text-[10px] font-black uppercase text-primary tracking-widest">Revenue Streams</p>
            </div>
            <PLItem label="Residential Cleaning" value={`${currencySymbol}8,400`} />
            <PLItem label="Commercial Contracts" value={`${currencySymbol}5,840`} />
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
               <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Operating Costs</p>
            </div>
            <PLItem label="Field Labor & Commissions" value={`-${currencySymbol}3,200`} isExpense />
            <PLItem label="Supplies & Equipment" value={`-${currencySymbol}645`} isExpense />
            <PLItem label="General & Admin" value={`-${currencySymbol}1,280`} isExpense />
            
            <div className="p-5 bg-primary/5 dark:bg-primary/10 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-black dark:text-white">Net Income</span>
              <div className="text-right">
                <span className="text-lg font-black text-primary block">{currencySymbol}9,115</span>
                <span className="text-[8px] font-black text-primary/60 uppercase tracking-tighter">Ready for Export</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bookkeeping Integration Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">3rd Party Integrations</h3>
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-sm font-bold">hub</span>
              <span className="text-[9px] font-black uppercase tracking-widest">API Bridge Active</span>
            </div>
          </div>
          
          <div className="bg-slate-900 dark:bg-slate-800/50 p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">External Software Sync</p>
                  <h4 className="text-xl font-black text-white">Bookkeeping Link</h4>
                  <p className="text-xs text-slate-400 mt-1">Status: {isDataBridgeActive ? 'Connected' : 'Disconnected'}</p>
                </div>
                <div className="text-right">
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isDataBridgeActive} 
                      onChange={(e) => setIsDataBridgeActive(e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">Data Bridge</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Allow Data Extraction</span>
                  <span className="text-[10px] font-black text-green-400 uppercase">Enabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Last Successful Sync</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{lastSync}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleSyncData}
                  disabled={isSyncing || !isDataBridgeActive}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                    isSyncing || !isDataBridgeActive
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary text-white shadow-xl shadow-primary/30 active:scale-95'
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">sync</span>
                      Pushing Data to Cloud...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">sync_alt</span>
                      Sync with External Software
                    </>
                  )}
                </button>
                {!isDataBridgeActive && (
                  <p className="text-center text-[10px] text-amber-500 font-bold uppercase tracking-tight">
                    Enable Data Bridge to allow 3rd party extraction
                  </p>
                )}
              </div>
              
              <p className="text-center text-[9px] text-slate-500 font-medium italic">
                Securely stream P&L data and invoices to your preferred cloud accounting platform.
              </p>
            </div>
          </div>
        </section>

        {/* Export & Archiving Grid */}
        <section className="space-y-3">
           <h3 className="text-sm font-black dark:text-white uppercase tracking-wider px-1">Export & Archiving</h3>
           <div className="grid grid-cols-2 gap-3">
              <ReportAction 
                icon={isExportingLedger ? "sync" : "table_chart"} 
                label="Full Ledger" 
                sub="CSV Transaction List" 
                onClick={handleExportLedgerCSV}
                isLoading={isExportingLedger}
              />
              <ReportAction 
                icon={isExportingPnL ? "sync" : "summarize"} 
                label="P&L Summary" 
                sub="CSV Export" 
                onClick={handleExportPnLCSV}
                isLoading={isExportingPnL}
              />
              <ReportAction icon="picture_as_pdf" label="P&L Report" sub="Download PDF" />
              <ReportAction icon="history" label="Sync Log" sub="Extraction History" />
           </div>
        </section>

        {/* Accountant Access Message */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
           <span className="material-symbols-outlined text-slate-300 text-3xl">account_circle</span>
           <h4 className="text-sm font-bold dark:text-white">Direct Accountant Access</h4>
           <p className="text-xs text-slate-500">Enable a dedicated login for your bookkeeper to view transaction records without administrative rights.</p>
           <button className="text-primary text-xs font-black uppercase tracking-widest pt-2">Generate Access Link</button>
        </div>
      </main>
    </div>
  );
};

const RevenueChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1000), [data]);
  const chartHeight = 120;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between h-[120px] gap-2 mb-2 relative">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="border-t border-slate-400 w-full"></div>
          <div className="border-t border-slate-400 w-full"></div>
          <div className="border-t border-slate-400 w-full"></div>
        </div>
        
        {data.map((point, i) => {
          const height = maxValue > 0 ? (point.value / maxValue) * chartHeight : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div 
                className="w-full bg-primary/20 group-hover:bg-primary/40 dark:bg-primary/30 dark:group-hover:bg-primary/50 transition-all rounded-t-lg relative"
                style={{ height: `${height}px` }}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-lg opacity-80"></div>
                
                {/* Simple Tooltip on hover */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded font-black whitespace-nowrap pointer-events-none">
                  {point.value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        {data.map((point, i) => (
          <span key={i} className="flex-1 text-center text-[9px] font-black uppercase text-slate-400 tracking-tighter truncate">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const PLItem: React.FC<{ label: string; value: string; isExpense?: boolean }> = ({ label, value, isExpense }) => (
  <div className="flex justify-between items-center p-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
    <span className={`text-sm font-black ${isExpense ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
      {value}
    </span>
  </div>
);

const ReportAction: React.FC<{ icon: string; label: string; sub: string; onClick?: () => void; isLoading?: boolean }> = ({ icon, label, sub, onClick, isLoading }) => (
  <button 
    onClick={onClick}
    disabled={isLoading}
    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-left hover:border-primary/30 transition-all active:scale-95 shadow-sm group disabled:opacity-70"
  >
    <div className="size-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary mb-3 transition-colors">
      <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>{icon}</span>
    </div>
    <p className="text-xs font-black dark:text-white uppercase tracking-tight">{label}</p>
    <p className="text-[9px] text-slate-400 font-bold uppercase">{sub}</p>
  </button>
);

export default Reports;
