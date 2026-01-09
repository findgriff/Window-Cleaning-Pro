import React from 'react';
import { Crew } from '../types';

interface CrewsProps {
  onBack: () => void;
}

const MOCK_CREWS: Crew[] = [
  {
    id: 'c1',
    name: 'East Side Crew',
    leader: 'Mike Henderson',
    members: ['Mike H.', 'Steve T.', 'Chris L.'],
    status: 'on-job',
    currentJobName: 'Smith Residence',
    lastSeen: '2 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPruBljxeojnUy13ljwJtCENuevq_qFJGirOZfEsCukoeu08gQ8YYVUyIC-FXdZvgpSIF6k3O3dpHOO__RhJDD6nBCCS3myudW_fd4hvFd13I2tvz1m_-ukRAseDZWUmqSUw-NKfkWyXpjT6UrUVTlT9gBzlrjHN9e8gf-qOc2buz13AT-LeFHWPeFnFzb_cQ7TNafbZvcoQ7fH4khiugVgmY8aqgNqgqY6djXB-NRfMPcXMx1VzGBRY79H5dU82TAYe7-qOh8gA3g'
  },
  {
    id: 'c2',
    name: 'West Wing Team',
    leader: 'Sarah Jenkins',
    members: ['Sarah J.', 'Kevin B.'],
    status: 'transit',
    currentJobName: 'Tech Hub Office Park',
    lastSeen: '12 mins ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z'
  },
  {
    id: 'c3',
    name: 'Support Unit',
    leader: 'Dave Miller',
    members: ['Dave M.'],
    status: 'available',
    lastSeen: 'Just now',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW1gpaeVBptM4rahr20QR3J7MH_SdX_a-T_KBPp2LORLMUms7YEfXL3tFMHH3Uq79EjEkMAXxQxMxoMY1NMJ19k6xRC6EGHBKSkqrjgwmRt46m-McG_gzz7PwCROwr2wSWY4LVgYPVid2QytZM0dXovxfsd-aDSew5dYRRda3WuxiypbApvheQpmfPNX721fF1lz0FP2LX0rgMmP2Q4nNMC0OM4RjHyufo7_RJ4BpiSli6OreLN8zjAChNmbH0-8-6q9keeFjmiNVg'
  }
];

const Crews: React.FC<CrewsProps> = ({ onBack }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 font-display">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight">Field Teams</h2>
        <button className="size-10 rounded-full flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">person_add</span>
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-xl font-black text-green-500">2</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">On Job</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-xl font-black text-primary">1</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">Available</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-xl font-black text-slate-400">0</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">Offline</p>
          </div>
        </div>

        {/* Crew List */}
        <div className="space-y-4 mt-2">
          {MOCK_CREWS.map(crew => (
            <CrewCard key={crew.id} crew={crew} />
          ))}
        </div>

        {/* Fleet Broadcast */}
        <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-3xl text-center space-y-4">
           <span className="material-symbols-outlined text-4xl text-primary">campaign</span>
           <h3 className="text-lg font-bold">Broadcast to All</h3>
           <p className="text-sm text-slate-500 px-4">Send a message or safety alert to all active field members instantly.</p>
           <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform">
             New Announcement
           </button>
        </div>
      </main>
    </div>
  );
};

const CrewCard: React.FC<{ crew: Crew }> = ({ crew }) => {
  const getStatusInfo = () => {
    switch(crew.status) {
      case 'on-job': return { label: 'On Job', color: 'text-green-500', bg: 'bg-green-500/10', icon: 'cleaning_services' };
      case 'transit': return { label: 'In Transit', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'local_shipping' };
      case 'available': return { label: 'Available', color: 'text-primary', bg: 'bg-primary/10', icon: 'check_circle' };
      default: return { label: 'Offline', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: 'power_settings_new' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="size-14 rounded-2xl bg-cover bg-center border border-slate-100" 
            style={{ backgroundImage: `url("${crew.avatar}")` }}
          />
          <div>
            <h3 className="text-base font-black dark:text-white">{crew.name}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Leader: {crew.leader}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${status.bg} ${status.color}`}>
          <span className={`material-symbols-outlined text-sm ${crew.status === 'on-job' ? 'animate-pulse' : ''}`}>{status.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Current Task</p>
          <p className="text-xs font-bold truncate dark:text-white">{crew.currentJobName || 'Waiting...'}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">GPS Update</p>
          <p className="text-xs font-bold truncate dark:text-white">{crew.lastSeen}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex -space-x-2">
          {crew.members.map((m, i) => (
            <div key={i} className="size-8 rounded-full bg-primary/20 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-primary">
              {m.split(' ')[0][0]}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
           <button className="size-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-500">
             <span className="material-symbols-outlined">chat</span>
           </button>
           <button className="px-4 h-10 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
             Track
           </button>
        </div>
      </div>
    </div>
  );
};

export default Crews;