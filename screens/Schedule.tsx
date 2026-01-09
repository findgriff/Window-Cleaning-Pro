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
  },
  {
    id: 'job-2pm',
    time: '02:00 PM',
    crew: 'East Side Crew',
    clientName: 'Marcus Webb',
    serviceType: 'Gutter Cleaning',
    address: '789 Summit Dr',
    status: 'conflict',
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCW1gpaeVBptM4rahr20QR3J7MH_SdX_a-T_KBPp2LORLMUms7YEfXL3tFMHH3Uq79EjEkMAXxQxMxoMY1NMJ19k6xRC6EGHBKSkqrjgwmRt46m-McG_gzz7PwCROwr2wSWY4LVgYPVid2QytZM0dXovxfsd-aDSew5dYRRda3WuxiypbApvheQpmfPNX721fF1lz0FP2LX0rgMmP2Q4nNMC0OM4RjHyufo7_RJ4BpiSlioreLN8zjAChNmbH0-8-6q9keeFjmiNVg"
  },
  {
    id: 'job-330pm',
    time: '03:30 PM',
    crew: 'Support Team',
    clientName: 'Sarah Jenkins',
    serviceType: 'Solar Panel Clean',
    address: '22 Maple Ave',
    status: 'upcoming',
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z"
  }
];

// Helper to convert "09:30 AM" to absolute minutes for proper sorting
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
  const [sortBy, setSortBy] = useState<'time' | 'crew'>('time');
  
  const [jobNotes, setJobNotes] = useState<Record<string, string>>({
    'job-9am': 'Client requested back porch windows be done first.',
  });

  const handleUpdateNote = (jobId: string, note: string) => {
    setJobNotes(prev => ({ ...prev, [jobId]: note }));
  };

  const handleConfirmDelete = () => {
    if (jobToDelete) {
      setJobs(prev => prev.filter(j => j.id !== jobToDelete.id));
      setJobToDelete(null);
    }
  };

  const filteredJobs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const matches = jobs.filter(j => 
      j.clientName.toLowerCase().includes(query) || 
      j.address.toLowerCase().includes(query) || 
      j.crew.toLowerCase().includes(query) ||
      j.serviceType.toLowerCase().includes(query)
    );

    return matches.sort((a, b) => {
      if (sortBy === 'time') {
        return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
      }
      // Primary sort by Crew name, secondary by Time
      const crewCompare = a.crew.localeCompare(b.crew);
      if (crewCompare !== 0) return crewCompare;
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });
  }, [jobs, sortBy, searchQuery]);

  const crewGroups = useMemo(() => {
    if (sortBy !== 'crew') return null;
    return filteredJobs.reduce((acc, job) => {
      if (!acc[job.crew]) acc[job.crew] = [];
      acc[job.crew].push(job);
      return acc;
    }, {} as Record<string, Job[]>);
  }, [filteredJobs, sortBy]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark relative">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-primary material-symbols-outlined text-2xl font-bold">calendar_today</div>
            <h1 className="text-lg font-bold tracking-tight">Schedule</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-xl">account_circle</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="px-4 pb-2">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, crew, or address..."
              className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex justify-between items-center overflow-x-auto hide-scrollbar gap-2 py-2">
            {[
              { day: 'Mon', num: '16' },
              { day: 'Tue', num: '17' },
              { day: 'Wed', num: '18', active: true },
              { day: 'Thu', num: '19' },
              { day: 'Fri', num: '20' },
              { day: 'Sat', num: '21' },
              { day: 'Sun', num: '22' },
            ].map((d) => (
              <a 
                key={d.num} 
                className={`flex flex-col items-center min-w-[44px] py-2 rounded-xl transition-all ${d.active ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}`} 
                href="#"
              >
                <span className={`text-[11px] font-medium uppercase ${d.active ? 'text-white/80' : 'text-slate-500'}`}>{d.day}</span>
                <span className="text-base font-bold">{d.num}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sorting Toggles */}
        <div className="px-4 pb-3 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/50 mt-1 pt-3">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sort Jobs:</span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setSortBy('time')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'time' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              Time
            </button>
            <button 
              onClick={() => setSortBy('crew')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'crew' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-sm">groups</span>
              Crew
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold leading-tight tracking-tight">Wednesday, Oct 18</h3>
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Today</span>
          </div>
        </div>

        <div className="relative space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
              <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              </div>
              <h4 className="text-slate-900 dark:text-white font-bold">No jobs found</h4>
              <p className="text-sm text-slate-500 max-w-[200px] mt-1">We couldn't find any jobs matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary font-bold text-sm"
              >
                Clear search
              </button>
            </div>
          ) : sortBy === 'time' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TimeSlot time="8 AM" />
              {filteredJobs.map((job) => (
                <JobEntry 
                  key={job.id}
                  id={job.id}
                  time={job.time}
                  crew={job.crew}
                  client={job.clientName}
                  service={job.serviceType}
                  duration={job.time}
                  isRecurring={job.isRecurring}
                  status={job.status}
                  notes={jobNotes[job.id]}
                  onUpdateNote={(note) => handleUpdateNote(job.id, note)}
                  onDelete={() => setJobToDelete(job)}
                  image={job.thumbnail || ""}
                  onClick={() => onNavigate('jobDetails', job.id)}
                />
              ))}
              <TimeSlot time="4 PM" />
              {!searchQuery && (
                <div className="flex gap-4">
                  <div className="w-12 text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">5 PM</span>
                  </div>
                  <div 
                    onClick={() => setShowRecurringModal(true)}
                    className="flex-1 mt-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center py-6 text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span className="text-xs font-medium">Tap to schedule</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
              {Object.entries(crewGroups || {}).map(([crewName, jobs]) => (
                <div key={crewName} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/10">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">{crewName}</span>
                      <span className="size-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">{jobs.length}</span>
                    </div>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                  <div className="space-y-4 ml-4">
                    {jobs.map(job => (
                      <JobEntry 
                        key={job.id}
                        id={job.id}
                        time={job.time}
                        crew={job.crew}
                        client={job.clientName}
                        service={job.serviceType}
                        duration={job.time}
                        isRecurring={job.isRecurring}
                        status={job.status}
                        notes={jobNotes[job.id]}
                        onUpdateNote={(note) => handleUpdateNote(job.id, note)}
                        onDelete={() => setJobToDelete(job)}
                        image={job.thumbnail || ""}
                        onClick={() => onNavigate('jobDetails', job.id)}
                        noTimeLabel
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setShowRecurringModal(true)}
        className="fixed right-6 bottom-24 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-2">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">Delete Job?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Are you sure you want to remove the job for <span className="font-bold text-slate-700 dark:text-slate-200">{jobToDelete.clientName}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  Yes, Delete Job
                </button>
                <button 
                  onClick={() => setJobToDelete(null)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">New Recurring Job</h3>
              <button 
                onClick={() => setShowRecurringModal(false)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">Client Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">person</span>
                  <input type="text" placeholder="Search or add client..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary dark:text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-slate-400">Recurrence Frequency</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(pattern => (
                    <button key={pattern} onClick={() => setRecurrencePattern(pattern)} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${recurrencePattern === pattern ? 'bg-primary border-primary text-white' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900'}`}>{pattern}</button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{recurrencePattern === 'daily' && "Job will repeat every day."}{recurrencePattern === 'weekly' && "Job will repeat every week."}{recurrencePattern === 'monthly' && "Job will repeat every month."}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRecurringModal(false)} className="flex-1 py-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">Cancel</button>
                <button onClick={() => setShowRecurringModal(false)} className="flex-[2] py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30">Save Recurring Job</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimeSlot: React.FC<{ time: string }> = ({ time }) => (
  <div className="flex gap-4">
    <div className="w-12 text-right">
      <span className="text-[11px] font-bold text-slate-400 uppercase">{time}</span>
    </div>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mt-2.5"></div>
  </div>
);

const JobEntry: React.FC<{ 
  id: string;
  time: string; 
  crew: string; 
  client: string; 
  service: string; 
  duration: string; 
  image: string;
  isRecurring?: boolean;
  status?: string;
  notes?: string;
  onUpdateNote?: (note: string) => void;
  onDelete?: () => void;
  onClick: () => void;
  noTimeLabel?: boolean;
}> = ({ id, time, crew, client, service, duration, image, isRecurring, status, notes, onUpdateNote, onDelete, onClick, noTimeLabel }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(notes || '');

  const handleToggleNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNote(!isEditingNote);
  };

  const handleSaveNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote?.(tempNote);
    setIsEditingNote(false);
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'conflict':
        return {
          border: 'border-l-4 border-l-red-500',
          text: 'text-red-500',
          bg: 'bg-red-50/50 dark:bg-red-900/10'
        };
      case 'completed':
        return {
          border: 'border-l-4 border-l-green-500',
          text: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50/50 dark:bg-green-900/10'
        };
      case 'upcoming':
      default:
        return {
          border: 'border-l-4 border-l-primary',
          text: 'text-primary',
          bg: 'bg-primary/5 dark:bg-primary/10'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex gap-4 group transition-all duration-300">
      {!noTimeLabel && (
        <div className="w-12 text-right">
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            {time.split(' ')[0]} <br/>
            <span className="text-[9px] opacity-60">{time.split(' ')[1]}</span>
          </span>
        </div>
      )}
      <div className={`flex-1 ${noTimeLabel ? 'w-full' : '-mt-4'}`}>
        <div 
          onClick={onClick}
          className={`bg-white dark:bg-[#1a2632] rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-all relative ${isEditingNote ? 'ring-2 ring-primary/30' : ''} ${styles.border}`}
        >
          {notes && !isEditingNote && (
            <div className="absolute -top-1.5 -right-1.5 size-6 bg-amber-400 rounded-full border-2 border-white dark:border-[#1a2632] shadow-sm flex items-center justify-center animate-in zoom-in-50 duration-300">
               <span className="material-symbols-outlined text-white text-[14px] font-bold">description</span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
                  {status === 'conflict' ? 'Conflict' : status === 'completed' ? 'Completed' : crew}
                </p>
                {isRecurring && (
                  <span className="material-symbols-outlined text-[14px] text-slate-400">repeat</span>
                )}
              </div>
              <h4 className="text-base font-bold text-[#0d141b] dark:text-white truncate">{client}</h4>
            </div>
            
            <div className="flex items-start gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="size-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
              <button 
                onClick={handleToggleNote}
                className={`size-8 rounded-lg flex items-center justify-center transition-colors ${isEditingNote ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600'}`}
              >
                <span className="material-symbols-outlined text-xl">sticky_note_2</span>
              </button>
              <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">cleaning_services</span>
              <span className="text-xs">{service}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="text-xs font-medium">{duration}</span>
            </div>
          </div>

          {(isEditingNote || notes) && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`mt-2 p-3 rounded-lg border transition-all duration-300 ${
                isEditingNote 
                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}
            >
              {isEditingNote ? (
                <div className="space-y-3">
                  <textarea
                    autoFocus
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="Add a short note for this job..."
                    className="w-full bg-transparent border-none p-0 text-sm dark:text-slate-200 placeholder:text-slate-400 focus:ring-0 min-h-[60px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditingNote(false); setTempNote(notes || ''); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                    <button onClick={handleSaveNote} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg shadow-sm">Save Note</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"{notes}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;