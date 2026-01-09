
import React from 'react';

interface SettingsProps {
  onBack: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, darkMode, setDarkMode }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-12 font-display">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-100 dark:border-slate-800">
        <div onClick={onBack} className="text-[#0d141b] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Settings</h2>
        <div className="w-12"></div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="relative">
            <div 
              className="size-24 rounded-full bg-cover bg-center ring-4 ring-primary/20" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z")' }}
            />
            <button className="absolute bottom-0 right-0 size-8 bg-primary rounded-full border-4 border-white dark:border-background-dark flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold dark:text-white">Alex Johnson</h3>
            <p className="text-sm text-slate-500">Alex@clearview.com • Admin</p>
          </div>
        </div>

        {/* Business Settings */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Business</h4>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <SettingsItem icon="business" label="Company Profile" sub="ClearView Windows Inc." />
            <SettingsItem icon="credit_card" label="Subscription" sub="Pro Plan • Monthly" />
            <SettingsItem icon="receipt_long" label="Billing History" />
            <SettingsItem icon="group" label="Team Management" sub="5 Active Members" last />
          </div>
        </div>

        {/* App Preferences */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">App Preferences</h4>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                </div>
                <span className="font-semibold dark:text-white">Dark Mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={darkMode} 
                  onChange={(e) => setDarkMode(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            <SettingsItem icon="notifications_active" label="Push Notifications" sub="On" />
            <SettingsItem icon="language" label="Language" sub="English (US)" last />
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Support</h4>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <SettingsItem icon="help" label="Help Center" />
            <SettingsItem icon="mail" label="Contact Us" />
            <SettingsItem icon="info" label="Privacy Policy" last />
          </div>
        </div>

        {/* Logout */}
        <button className="w-full py-4 text-red-500 font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm active:scale-95 transition-transform">
          Log Out
        </button>
        
        <div className="text-center pb-8">
          <p className="text-[10px] text-slate-400 font-medium">Window Wash Pro v2.4.1 (Build 890)</p>
        </div>
      </div>
    </div>
  );
};

const SettingsItem: React.FC<{ icon: string; label: string; sub?: string; last?: boolean }> = ({ icon, label, sub, last }) => (
  <div className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!last ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-semibold dark:text-white leading-tight">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
  </div>
);

export default Settings;
