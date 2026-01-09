import React, { useState } from 'react';
import { Customer, ActivityLog } from '../types';
import { MOCK_CUSTOMERS } from './Customers';

interface CustomerProfileProps {
  customerId: string | null;
  onBack: () => void;
  currencySymbol: string;
}

const MOCK_LOGS: ActivityLog[] = [
  { id: '1', date: 'Oct 24, 2:30 PM', type: 'call', content: 'Inquired about gutter cleaning discount for winter.', author: 'Alex' },
  { id: '2', date: 'Oct 20, 11:15 AM', type: 'email', content: 'Sent automated follow-up after service.', author: 'System' },
  { id: '3', date: 'Oct 12, 9:00 AM', type: 'service', content: 'Completed Full Exterior Wash - 5/5 Rating.', author: 'Crew A' },
];

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack, currencySymbol }) => {
  const customer = MOCK_CUSTOMERS.find(c => c.id === customerId) || MOCK_CUSTOMERS[0];
  const [activeTab, setActiveTab] = useState<'history' | 'properties' | 'notes'>('history');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'call' | 'email' | 'note'>('note');

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
      {/* Header Nav */}
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Client Profile</h2>
        <button className="size-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        {/* Core Identity */}
        <div className="flex flex-col items-center text-center py-4">
          <div 
            className="size-28 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-xl mb-4" 
            style={{ backgroundImage: `url("${customer.avatar}")` }}
          />
          <h1 className="text-2xl font-black dark:text-white mb-1">{customer.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{customer.email}</p>
          <div className="mt-3 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${customer.type === 'COMM' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'}`}>
              {customer.type} Client
            </span>
            <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Active
            </span>
          </div>
        </div>

        {/* Quick Contact Actions */}
        <div className="grid grid-cols-3 gap-3">
          <ContactButton icon="call" label="Call" color="bg-green-500" href={`tel:${customer.phone}`} />
          <ContactButton icon="chat" label="Text" color="bg-primary" href={`sms:${customer.phone}`} />
          <ContactButton icon="mail" label="Email" color="bg-slate-700" href={`mailto:${customer.email}`} />
        </div>

        {/* CRM Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Lifetime Spend" value={`${currencySymbol}${customer.totalSpend || 0}`} icon="payments" color="text-green-500" />
          <StatCard label="Job Count" value={`${customer.jobCount || 0}`} icon="cleaning_services" color="text-primary" />
          <StatCard label="Last Seen" value={customer.lastClean.split(',')[0]} icon="event" color="text-amber-500" />
        </div>

        {/* Tab System */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <TabItem active={activeTab === 'history'} label="Activity" onClick={() => setActiveTab('history')} />
            <TabItem active={activeTab === 'properties'} label="Property" onClick={() => setActiveTab('properties')} />
            <TabItem active={activeTab === 'notes'} label="Notes" onClick={() => setActiveTab('notes')} />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold uppercase text-slate-400">Activity Timeline</h3>
                  <button onClick={() => setShowLogModal(true)} className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Log Activity
                  </button>
                </div>
                <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {MOCK_LOGS.map(log => (
                    <div key={log.id} className="flex gap-4 relative">
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-background-light dark:border-background-dark ${
                        log.type === 'call' ? 'bg-green-500 text-white' : 
                        log.type === 'email' ? 'bg-primary text-white' : 
                        'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <span className="material-symbols-outlined text-lg">
                          {log.type === 'call' ? 'call' : log.type === 'email' ? 'mail' : log.type === 'service' ? 'cleaning_services' : 'note'}
                        </span>
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-slate-400">{log.date}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{log.author}</span>
                        </div>
                        <p className="text-sm dark:text-slate-200 leading-relaxed">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWifyHvCBm_vmQLNJOFxrHSK57Z0Y8iS-dkgV9lFLtrQeCrwkT1SKulICHXSsOb4AUGmrTO3HyxJ028UFVQc-a2Awy0HTRBInZsyyQewaO3NyVd7Y-PSrtg90Dnn0wVSgQtKkGu2BTg0a3dAoqQqiOwz0pTCGO_HUkKFXJUeguU9v8E0ZP--WAXSuqqO2JSQEbObJXvcQZL7RcdJmHyVPYkraPHnkqvZxw6hscmW7aUP-IrzuvLOHLrB2Xqt1jLuv7MdwXttIf8qIM")' }} />
                  <div className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">Primary Site</div>
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{customer.address}</h4>
                  <p className="text-sm text-slate-500">Silicon Valley, CA 94025</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Window Count</p>
                    <p className="text-lg font-bold">24 Units</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Access Info</p>
                    <p className="text-lg font-bold">Gate: 1234</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <textarea 
                  placeholder="Tap to add personal client preferences..." 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary h-32 resize-none shadow-sm"
                />
                <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  Update Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Log Activity</h3>
              <button onClick={() => setShowLogModal(false)} className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                {(['call', 'email', 'note'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setLogType(type)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all capitalize font-bold text-xs ${logType === type ? 'bg-primary/5 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined">{type === 'call' ? 'call' : type === 'email' ? 'mail' : 'description'}</span>
                    {type}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 px-1">Detailed Content</label>
                <textarea 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary min-h-[120px]" 
                  placeholder={`Record the ${logType} details...`}
                />
              </div>
              <button onClick={() => setShowLogModal(false)} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                Save to CRM Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactButton: React.FC<{ icon: string; label: string; color: string; href: string }> = ({ icon, label, color, href }) => (
  <a href={href} className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-white shadow-lg active:scale-95 transition-transform ${color}`}>
    <span className="material-symbols-outlined text-2xl">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </a>
);

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
    <span className={`material-symbols-outlined mb-2 ${color}`}>{icon}</span>
    <p className="text-sm font-black dark:text-white leading-tight mb-0.5">{value}</p>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
  </div>
);

const TabItem: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 text-sm font-bold transition-all relative ${active ? 'text-primary' : 'text-slate-400'}`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
  </button>
);

export default CustomerProfile;