import React, { useState, useMemo } from 'react';
import { Screen, Customer } from '../types';

interface CustomersProps {
  onNavigate: (screen: Screen, id?: string) => void;
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust1',
    name: 'Johnathan Doe',
    email: 'j.doe@example.com',
    phone: '555-010-2233',
    address: '124 Oak St, North Loop',
    type: 'RESI',
    lastClean: 'Oct 12, 2023',
    lastService: 'Full Exterior Wash',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxjL5MEoKt4kzpniMEW6Ty8CW7HH-6HGswcMXHWj6FU8o38w0dgVfdviK_17NMjO4DN-34UuNPwWBKuA4SyqwkROEUnFG0cbwwsBRUBV2ECr9Ep0jMCriMF41b9jqnVqQc56mgzYK3eaOhOfUgossey8f1c54lp-igUMPqRDtjbTbUCNthCMcEWJEMuIrwNjzr5ElCpEwwb5VjY7SQwykd5oGNiZXTGBy-NNS5o6rdlcgK1KJp2vTZANWjwlVsZ1lkFz0Wz0Rn6-AS',
    flags: ['pets'],
    totalSpend: 1450,
    jobCount: 8,
    status: 'NORMAL',
    notes: ['Gate code is 1234', 'Watch for the rose bushes']
  },
  {
    id: 'cust2',
    name: 'Sunshine Cafe',
    email: 'hello@sunshinecafe.biz',
    phone: '555-999-1234',
    address: 'Suite 400, Innovation Blvd',
    type: 'COMM',
    lastClean: 'Nov 05, 2023',
    lastService: 'Monthly Maintenance',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC92RPLDXGWa7fBtt1NIgp32jGob4EgiKvlLjIqqPpF1ISuSBJscYp8LBK6LiBXj1gcy7u5o9wDIx8TfGhOGnkw2FAikfQ4b5mm3c9tGQS4rU96tMDJOA8c5ZdxBCVSbnidcVpknfGOsQM07hX9WAP2t4eGacQsZpwkCh3LeG_hu7lqVSPaKDlrQXupSPUpoiNptQ14jlDphoBMrRHgmchhV4sRO819ITCfxoEK_ZYY5rnAjSbkJ_oJhJVBvYeCfji60FgPgAeZ2wVr',
    flags: ['lock'],
    totalSpend: 3200,
    jobCount: 12,
    status: 'NORMAL'
  },
  {
    id: 'cust3',
    name: 'Sarah Smith',
    email: 'sarah.smith88@webmail.com',
    phone: '555-443-2211',
    address: '789 Pine Rd, South Loop',
    type: 'RESI',
    lastClean: 'Aug 22, 2023',
    lastService: 'Deep Clean + Gutters',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvM7m36qRn509daL2PjY3lvH9blJvyRz_7GyA_LdMy-SsNvu2pp_dCtVC0Lcc5athqzh3qMBjMDK9DHsqNwDvPlM9ipEpejgo8cn2dScRbJqu8c-Sv0UGyZXoPirAC6ZyJdJ-6yAg5P6bzKxX_AeR078RoyoW0kGpoIl7Dpl7IpHBiRcNilUnU42UkQSZi_PYIPbgbHp9keFmIrLvbV4TLeMbEXZyRCdk6WhXIryxt7rBdpMqSAloswtz6qyxzYpTkDgd2vEXDwVLd',
    status: 'OVERDUE',
    totalSpend: 890,
    jobCount: 4,
    notes: ['Always call 15 mins ahead']
  },
  {
    id: 'lead1',
    name: 'Robert Fox',
    email: 'r.fox@example.com',
    phone: '555-222-3344',
    address: '332 Silver Creek Ct',
    type: 'RESI',
    lastClean: 'N/A',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW1gpaeVBptM4rahr20QR3J7MH_SdX_a-T_KBPp2LORLMUms7YEfXL3tFMHH3Uq79EjEkMAXxQxMxoMY1NMJ19k6xRC6EGHBKSkqrjgwmRt46m-McG_gzz7PwCROwr2wSWY4LVgYPVid2QytZM0dXovxfsd-aDSew5dYRRda3WuxiypbApvheQpmfPNX721fF1lz0FP2LX0rgMmP2Q4nNMC0OM4RjHyufo7_RJ4BpiSli6OreLN8zjAChNmbH0-8-6q9keeFjmiNVg',
    status: 'LEAD',
    source: 'Google Maps'
  }
];

type PipelineMode = 'CLIENTS' | 'LEADS';

const Customers: React.FC<CustomersProps> = ({ onNavigate }) => {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipeline, setPipeline] = useState<PipelineMode>('CLIENTS');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedNotesCustomer, setSelectedNotesCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');

  const filteredCustomers = useMemo(() => {
    let result = localCustomers;

    // First, filter by pipeline stage
    if (pipeline === 'LEADS') {
      result = result.filter(c => c.status === 'LEAD');
    } else {
      result = result.filter(c => c.status !== 'LEAD');
    }

    // Secondary category filters
    if (activeFilter !== 'all') {
      if (activeFilter === 'OVERDUE') {
        result = result.filter(c => c.status === 'OVERDUE');
      } else {
        result = result.filter(c => c.type === activeFilter);
      }
    }

    // Search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.address.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [localCustomers, searchQuery, pipeline, activeFilter]);

  const handleAddNote = () => {
    if (!selectedNotesCustomer || !newNote.trim()) return;
    
    const updatedCustomers = localCustomers.map(c => {
      if (c.id === selectedNotesCustomer.id) {
        return {
          ...c,
          notes: [...(c.notes || []), newNote.trim()]
        };
      }
      return c;
    });

    setLocalCustomers(updatedCustomers);
    
    // Update selected customer to show new note in modal immediately
    const updatedSelected = updatedCustomers.find(c => c.id === selectedNotesCustomer.id);
    if (updatedSelected) setSelectedNotesCustomer(updatedSelected);
    
    setNewNote('');
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">group</span>
            <h1 className="text-xl font-bold tracking-tight">CRM</h1>
          </div>
          <button className="flex items-center justify-center rounded-full w-10 h-10 bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">person_add</span>
          </button>
        </div>

        {/* Pipeline Toggle */}
        <div className="px-4 pb-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl max-w-xl mx-auto">
            <button 
              onClick={() => setPipeline('CLIENTS')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${pipeline === 'CLIENTS' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Clients
            </button>
            <button 
              onClick={() => setPipeline('LEADS')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${pipeline === 'LEADS' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              New Leads
            </button>
          </div>
        </div>
        
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary shadow-sm" 
              placeholder={`Search ${pipeline.toLowerCase()}...`}
            />
          </div>
        </div>

        {pipeline === 'CLIENTS' && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto hide-scrollbar max-w-xl mx-auto">
            <FilterChip label="All" isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
            <FilterChip label="Residential" isActive={activeFilter === 'RESI'} onClick={() => setActiveFilter('RESI')} />
            <FilterChip label="Commercial" isActive={activeFilter === 'COMM'} onClick={() => setActiveFilter('COMM')} />
            <FilterChip label="Overdue" isActive={activeFilter === 'OVERDUE'} onClick={() => setActiveFilter('OVERDUE')} isWarning />
          </div>
        )}
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <CustomerItem 
              key={customer.id}
              customer={customer}
              onNotesClick={() => setSelectedNotesCustomer(customer)}
              onClick={() => onNavigate('customerProfile', customer.id)}
            />
          ))
        ) : (
          <div className="py-20 text-center animate-in fade-in duration-300">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">search_off</span>
            <p className="text-slate-500 text-sm">No {pipeline.toLowerCase()} matching your criteria.</p>
          </div>
        )}
      </main>

      {/* Notes Modal */}
      {selectedNotesCustomer && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="size-10 rounded-full bg-cover bg-center border border-slate-200" 
                  style={{ backgroundImage: `url("${selectedNotesCustomer.avatar}")` }}
                />
                <div>
                  <h3 className="text-lg font-bold dark:text-white leading-tight">Customer Notes</h3>
                  <p className="text-xs text-slate-500">{selectedNotesCustomer.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotesCustomer(null)}
                className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedNotesCustomer.notes && selectedNotesCustomer.notes.length > 0 ? (
                <div className="space-y-3">
                  {selectedNotesCustomer.notes.map((note, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-left duration-200">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{note}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Added by Alex</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 opacity-60">
                  <span className="material-symbols-outlined text-5xl mb-2">sticky_note_2</span>
                  <p className="text-sm">No notes for this customer yet.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <input 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a short note..."
                  className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="bg-primary text-white size-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; isActive: boolean; onClick: () => void; isWarning?: boolean }> = ({ label, isActive, onClick, isWarning }) => (
  <button 
    onClick={onClick}
    className={`flex h-8 shrink-0 items-center justify-center gap-x-1 rounded-full px-4 text-xs font-bold transition-all ${
      isActive 
      ? (isWarning ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-primary text-white shadow-lg shadow-primary/20') 
      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
    }`}
  >
    {label}
  </button>
);

const CustomerItem: React.FC<{ customer: Customer; onNotesClick: () => void; onClick: () => void }> = ({ customer, onNotesClick, onClick }) => (
  <div 
    className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden"
  >
    {customer.notes && customer.notes.length > 0 && (
      <div className="absolute -top-1 -right-1">
        <div className="size-6 bg-amber-400 rounded-bl-xl flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[14px] text-white font-bold">sticky_note_2</span>
        </div>
      </div>
    )}

    <div 
      onClick={onClick}
      className="size-14 rounded-full bg-cover bg-center border-2 border-slate-100 dark:border-slate-700 shrink-0" 
      style={{ backgroundImage: `url("${customer.avatar}")` }}
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5" onClick={onClick}>
        <h3 className="text-base font-bold dark:text-white truncate">{customer.name}</h3>
        {customer.status === 'OVERDUE' && (
          <span className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">Overdue</span>
        )}
        {customer.status === 'LEAD' && (
          <span className="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">Lead</span>
        )}
      </div>
      
      <div className="flex flex-col mb-2" onClick={onClick}>
        <p className="text-[11px] text-primary dark:text-blue-400 font-semibold truncate leading-tight">
          {customer.email}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {customer.address}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onNotesClick(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all border ${
            customer.notes && customer.notes.length > 0 
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800' 
            : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-sm">sticky_note_2</span>
          Notes {customer.notes && customer.notes.length > 0 && `(${customer.notes.length})`}
        </button>
        
        <div className="flex items-center gap-1 opacity-60 ml-1" onClick={onClick}>
          <span className="material-symbols-outlined text-[14px] text-slate-400">history</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{customer.status === 'LEAD' ? `Source: ${customer.source}` : `Last: ${customer.lastClean}`}</span>
        </div>
      </div>
    </div>
    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors ml-1" onClick={onClick}>chevron_right</span>
  </div>
);

export default Customers;