import React, { useState } from 'react';

interface JobDetailsProps {
  jobId: string | null;
  onBack: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onBack }) => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [items, setItems] = useState([
    { id: 1, label: "Exterior glass cleaning", completed: true },
    { id: 2, label: "Screen washing", count: "24 count", completed: false },
    { id: 3, label: "Track vacuuming", completed: false },
  ]);

  const toggleItem = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const openMap = () => {
    const address = "123 Sunshine Lane, Silicon Valley, CA 94025";
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://?q=${encodedAddress}` 
      : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    window.open(url, '_blank');
  };

  const totalItems = items.length;
  const completedItems = items.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#0d141b] dark:text-slate-100 min-h-screen pb-32">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800">
        <div onClick={onBack} className="text-[#0d141b] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Job Details</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-[#0d141b] dark:text-white gap-2 text-base font-bold">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Active Status Banner */}
        {isClockedIn && (
          <div className="mx-4 mt-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-between shadow-lg shadow-green-500/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-pulse text-sm">radio_button_checked</span>
              <span className="text-xs font-bold uppercase tracking-wider">Clocked In: 12:45 PM</span>
            </div>
            <span className="text-xs font-mono font-bold">00:14:22</span>
          </div>
        )}

        {/* Address Card */}
        <div className="p-4 pb-2">
          <div className="flex flex-col gap-4 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight">123 Sunshine Lane</p>
                <p className="text-[#4c739a] dark:text-slate-400 text-sm font-normal leading-normal">Silicon Valley, CA 94025</p>
                <p className="text-[#137fec] text-sm font-medium mt-1">Customer: John Doe • (555) 012-3456</p>
              </div>
              <div 
                className="w-20 h-20 bg-center bg-no-repeat bg-cover rounded-lg shrink-0 ring-1 ring-slate-100 dark:ring-slate-800" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBWifyHvCBm_vmQLNJOFxrHSK57Z0Y8iS-dkgV9lFLtrQeCrwkT1SKulICHXSsOb4AUGmrTO3HyxJ028UFVQc-a2Awy0HTRBInZsyyQewaO3NyVd7Y-PSrtg90Dnn0wVSgQtKkGu2BTg0a3dAoqQqiOwz0pTCGO_HUkKFXJUeguU9v8E0ZP--WAXSuqqO2JSQEbObJXvcQZL7RcdJmHyVPYkraPHnkqvZxw6hscmW7aUP-IrzuvLOHLrB2Xqt1jLuv7MdwXttIf8qIM")' }}
              />
            </div>
            <button 
              onClick={openMap}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-primary text-white gap-2 text-base font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">near_me</span>
              <span className="truncate">Navigate to Site</span>
            </button>
          </div>
        </div>

        {/* Job Progress Section */}
        <div className="px-4 py-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Progress</h3>
              <span className="text-primary font-black text-lg">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {completedItems} of {totalItems} tasks completed
            </p>
          </div>
        </div>

        {/* Job Specs */}
        <div className="flex justify-between items-end px-4 pt-4 pb-2">
          <h3 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Job Specs</h3>
          <span className="text-xs text-primary font-bold">Edit Specs</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <SpecCard icon="apartment" title="3-story house" label="Property Type" />
          <SpecCard icon="grid_view" title="24 windows" label="Total Count" />
        </div>

        {/* Field Notes */}
        <div className="px-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-sm">warning</span>
              <p className="text-amber-700 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">Field Notes</p>
            </div>
            <p className="text-amber-900 dark:text-amber-200 text-sm font-normal leading-normal">
              Standard exterior clean. Requires 30ft ladder. Watch out for loose shingles on the north side. Dog in backyard is friendly but please keep gate closed.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <h3 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">Service Checklist</h3>
        <div className="px-4 space-y-3">
          {items.map(item => (
            <ChecklistItem 
              key={item.id}
              label={item.label} 
              completed={item.completed} 
              count={item.count}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>

        {/* Photos */}
        <h3 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">Documentation</h3>
        <div className="grid grid-cols-2 gap-4 px-4 pb-10">
          <PhotoUpload label="Before Photos" icon="add_a_photo" />
          <PhotoUpload label="After Photos" icon="photo_camera" />
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 pb-8 flex items-center justify-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-md w-full flex items-center gap-4">
          <button 
            onClick={() => setIsClockedIn(!isClockedIn)}
            className={`flex-1 flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 gap-3 text-lg font-bold shadow-lg transition-all active:scale-95 ${
              isClockedIn 
              ? 'bg-red-500 text-white shadow-red-500/30' 
              : 'bg-primary text-white shadow-primary/30'
            }`}
          >
            <span className="material-symbols-outlined">{isClockedIn ? 'logout' : 'schedule'}</span>
            <span>{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SpecCard: React.FC<{ icon: string; title: string; label: string }> = ({ icon, title, label }) => (
  <div className="flex flex-1 gap-3 rounded-xl border border-[#cfdbe7] dark:border-gray-800 bg-white dark:bg-slate-900 p-4 flex-col shadow-sm">
    <span className="material-symbols-outlined text-primary">{icon}</span>
    <div className="flex flex-col gap-1">
      <h2 className="text-[#0d141b] dark:text-white text-base font-bold leading-tight">{title}</h2>
      <p className="text-[#4c739a] dark:text-slate-400 text-sm font-normal leading-normal">{label}</p>
    </div>
  </div>
);

const ChecklistItem: React.FC<{ label: string; completed?: boolean; count?: string; onToggle: () => void }> = ({ label, completed, count, onToggle }) => (
  <div 
    onClick={onToggle}
    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-xl transition-all cursor-pointer ${
      completed ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 shadow-sm'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${completed ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
        {completed && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
      </div>
      <span className={`font-medium transition-colors ${completed ? 'text-primary dark:text-blue-400' : 'text-[#0d141b] dark:text-white'}`}>{label}</span>
    </div>
    {count && <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${completed ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{count}</span>}
  </div>
);

const PhotoUpload: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <div className="flex flex-col gap-2">
    <p className="text-[#4c739a] dark:text-slate-400 text-sm font-medium">{label}</p>
    <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900/50 gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
      <span className="text-xs text-gray-500 font-medium">Tap to upload</span>
    </div>
  </div>
);

export default JobDetails;