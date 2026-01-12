import React, { useState, useMemo } from 'react';
import { Screen, Job } from '../types';

interface ScheduleProps {
  onNavigate: (screen: Screen, id?: string) => void;
}

const MOCK_JOBS_DATA: Job[] = [
  {
    id: 'job-9am',
    time: '09:00 AM',
    crew: 'East Side Crew',
    clientName: 'Johnathan Smith',
    serviceType: 'Exterior Wash',
    address: '124 Oak St',
    status: 'upcoming',
    isRecurring: true,
    recurrencePattern: 'weekly',
    notes: 'Gate code is 1234. Customer requested back windows first.',
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPruBljxeojnUy13ljwJtCENuevq_qFJGirOZfEsCukoeu08gQ8YYVUyIC-FXdZvgpSIF6k3O3dpHOO__RhJDD6nBCCS3myudW_fd4hvFd13I2tvz1m_-ukRAseDZWUmqSUw-NKfkWyXpjT6UrUVTlT9gBzlrjHN9e8gf-qOc2buz13AT-LeFHWPeFnFzb_cQ7TNafbZvcoQ7fH4khiugVgmY8aqgNqgqY6djXB-NRfMPcXMx1VzGBRY79H5dU82TAYe7-qOh8gA3g"
  },
  {
    id: 'job-11am',
    time: '11:00 AM',
    crew: 'West Wing Team',
    clientName: 'Elena Rodriguez',
    serviceType: 'Full Package',
    address: '456 West Blvd',
    status: 'completed',
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaNdHtCplcvXBSxeFUOR-magmkRJQ-0JZ9dd-6R688Zc4HTe8snz_aARmWlFFNL_qG4ykzkGt9-IkG6_tvkc4MGtBJ5tY27Oqsw5chl_PAMDHp3FF5vIoXNz8lPIfWP5oZb6W00SmlI-OKpW_gsdedgSGixzrxdaXKeWKFoG9ke63Ma87G5G_ocCcqdXDtuOHdiko05aIGGARvFwH-HZN9rW_ROeubnqhyJnSeRF3CrUmSiMc1teWRLmgU6co2g0exQTIAV23w44I_"
  }
];

const parseTimeToMinutes = (timeStr: string) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const Schedule: React.FC<ScheduleProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [filterMode, setFilterMode] = useState<'all' | 'recurring'>('all');
  const [newJobClient, setNewJobClient] = useState('');

  const handleSaveRecurringJob = () => {
    if (!newJobClient.trim()) return;
    const newJob: Job = {
      id: `job-${Date.now()}`,
      clientName: newJobClient,
      serviceType: 'Recurring Service',
      crew: 'Support Team',
      time: '08:00 AM',
      address: 'On File',
      status: 'upcoming',
      isRecurring: true,
      recurrencePattern: recurrencePattern,
      thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z"
    };
    setJobs(prev => [...prev, newJob]);
    setShowRecurringModal(false);
    setNewJobClient('');
  };

  const filteredJobs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = jobs.filter(j => j.clientName.toLowerCase().includes(query));
    if (filterMode === 'recurring') result = result.filter(j => j.isRecurring);
    return result.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [jobs, searchQuery, filterMode]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark relative pb-24">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl font-black">event_note</span>
            <h1 className="text-xl font-black tracking-tight dark:text-white">Schedule</h1>
          </div>
          <button 
            onClick={() => setFilterMode(filterMode === 'all' ? 'recurring' : 'all')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'recurring' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            {filterMode === 'recurring' ? 'Recurring Only' : 'Show Recurring'}
          </button>
        </div>
        <div className="px-4 pb-3">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedule..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary dark:text-white"
          />
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="py-20 text-center animate-in fade-in duration-300">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">calendar_today</span>
            <p className="text-slate-500 font-bold">No jobs matching your view.</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="flex gap-4">
              <div className="w-10 pt-4 text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 leading-none">{job.time.split(' ')[0]}</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase">{job.time.split(' ')[1]}</p>
              </div>
              <div 
                onClick={() => onNavigate('jobDetails', job.id)}
                className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
              >
                {job.isRecurring && (
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest text-white ${
                    job.recurrencePattern === 'daily' ? 'bg-blue-500' : 
                    job.recurrencePattern === 'weekly' ? 'bg-amber-500' : 'bg-purple-500'
                  }`}>
                    {job.recurrencePattern} Subscription
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-base font-black dark:text-white">{job.clientName}</h4>
                    <p className="text-xs text-slate-400 font-medium">{job.address}</p>
                  </div>
                  <div className="size-10 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shrink-0">
                    <img src={job.thumbnail} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">groups</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{job.crew}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">timer</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Est. 2h</span>
                  </div>
                  {job.notes && (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="material-symbols-outlined text-xs text-amber-500">sticky_note_2</span>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Notes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <button 
        onClick={() => setShowRecurringModal(true)}
        className="fixed right-6 bottom-24 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <span className="material-symbols-outlined text-3xl">add_task</span>
      </button>

      {showRecurringModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white tracking-tight">New Recurring Job</h3>
              <button onClick={() => setShowRecurringModal(false)} className="text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Name</label>
                <input 
                  type="text" 
                  value={newJobClient}
                  onChange={(e) => setNewJobClient(e.target.value)}
                  placeholder="e.g. Robert Fox" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-primary dark:text-white" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Frequency</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(pattern => (
                    <button 
                      key={pattern} 
                      onClick={() => setRecurrencePattern(pattern)} 
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${recurrencePattern === pattern ? 'bg-primary border-primary text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900'}`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleSaveRecurringJob} 
                disabled={!newJobClient.trim()}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-primary text-white shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
              >
                Create Recurring Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;