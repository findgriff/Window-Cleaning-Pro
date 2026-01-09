import React, { useState } from 'react';
import { Screen } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  onNavigate: (screen: Screen, id?: string) => void;
  currencySymbol?: string;
  userLocation?: {lat: number, lng: number} | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, currencySymbol = '$', userLocation }) => {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<{ text: string, links: any[], verified: boolean } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResult(null);
    setLoadingStep('Initializing Dispatch AI...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setLoadingStep('Searching Google Maps...');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: aiQuery,
        config: {
          systemInstruction: `You are the Window Wash Pro Smart Dispatch Assistant. 
Focus: Logistics, Location Verification, and Crew Assignment.
Rules:
1. For ANY address or UK postcode (e.g. SW1, EC2, M1), ALWAYS use googleMaps to verify.
2. Identify the specific UK District/Town from the map data.
3. Determine "Dispatch Readiness":
   - VERIFIED: Exact match found.
   - AMBIGUOUS: Multiple matches or partial address.
   - UNKNOWN: No map data found.
4. Output a helpful summary for a dispatcher. Mention nearby landmarks or traffic if available in map results.`,
          tools: [{ googleMaps: {} }],
          toolConfig: userLocation ? {
            retrievalConfig: {
              latLng: { latitude: userLocation.lat, longitude: userLocation.lng }
            }
          } : undefined
        },
      });

      const text = response.text || "No dispatch data found for this query.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const hasMapMatch = chunks.some(chunk => chunk.maps);
      
      setAiResult({ 
        text, 
        links: chunks,
        verified: hasMapMatch
      });
    } catch (err) {
      console.error("AI Search Error:", err);
      setAiResult({ 
        text: "Logistics system offline. Please verify the address manually.", 
        links: [],
        verified: false
      });
    } finally {
      setIsAiLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="flex flex-col pb-24 font-sans">
      {/* Top App Bar */}
      <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex size-10 shrink-0 items-center">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z")' }}
          />
        </div>
        <div className="flex flex-col flex-1 px-3">
          <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight">Window Wash Pro</h2>
          <p className="text-[10px] font-black uppercase text-primary tracking-widest">Smart Logistics v2.5</p>
        </div>
        <button onClick={() => onNavigate('settings')} className="size-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
          <span className="material-symbols-outlined text-slate-500">settings</span>
        </button>
      </div>

      {/* AI Dispatch Search */}
      <div className="px-4 pt-6">
        <form onSubmit={handleAiSearch} className="relative">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all ${isAiLoading ? 'text-primary' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined ${isAiLoading ? 'animate-spin' : ''}`}>
              {isAiLoading ? 'sync' : 'search_check'}
            </span>
          </div>
          <input 
            type="text" 
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Verify UK Postcode or Customer Site..."
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none"
          />
        </form>

        {isAiLoading && (
          <div className="mt-3 px-2 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="size-1 bg-primary rounded-full animate-bounce"></div>
              <div className="size-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="size-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{loadingStep}</p>
          </div>
        )}

        {aiResult && (
          <div className="mt-4 p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-start mb-4">
               <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${aiResult.verified ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                 {aiResult.verified ? 'Location Verified' : 'Ambiguous Location'}
               </div>
               <button onClick={() => setAiResult(null)} className="text-slate-300 hover:text-slate-500"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-4">
              {aiResult.text}
            </p>

            {aiResult.links.map((chunk, i) => chunk.maps && (
              <a 
                key={i} 
                href={chunk.maps.uri} 
                target="_blank" 
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="size-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined">directions</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">View on Google Maps</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{chunk.maps.title}</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">open_in_new</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Daily Revenue</p>
          <p className="text-2xl font-black dark:text-white">{currencySymbol}1,240</p>
          <div className="flex items-center gap-1 text-green-500 mt-1">
             <span className="material-symbols-outlined text-xs">trending_up</span>
             <span className="text-[10px] font-bold">+12% vs yesterday</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Active Quotes</p>
          <p className="text-2xl font-black dark:text-white">08</p>
          <div className="flex items-center gap-1 text-amber-500 mt-1">
             <span className="material-symbols-outlined text-xs">hourglass_top</span>
             <span className="text-[10px] font-bold">Needs followup</span>
          </div>
        </div>
      </div>

      {/* Field Operations Map Placeholder */}
      <div className="px-4 pb-4">
        <div className="relative group cursor-pointer" onClick={() => onNavigate('crews')}>
          <div 
            className="w-full aspect-[2/1] bg-center bg-no-repeat bg-cover rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7koKeWgsY0-t76uWlNZlM89kJvD-1Dyh9MLXzYYwzooGKry8JkFY_PtR0fbf8EE-XjwOCA7e-pO3GDal8Og9OxtXVTO62jbroR-CN3irtF3gAmbeDyuyN3FIm1TdGCQ0MRqULAFkOd47q45kodlmgpQDQD9HbMlhtHzitf7FRcNiGgt-cwmaZSvyMcNZ48UtINYZaIz-CzwQrBCvNsbDp-EbU7p0816TwIWDlH1KdFmcvFFlPWOWW8HqeIAHpTIV48B5moh2Nz8Cm")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <p className="text-white text-sm font-bold flex items-center gap-2">
                <span className="size-2 bg-green-500 rounded-full animate-ping"></span>
                5 Crews Live
              </p>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-white/20">
              <span className="material-symbols-outlined text-primary">explore</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Track Operations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Queue */}
      <div className="px-4 py-2 space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-lg font-black dark:text-white tracking-tight">Today's Schedule</h3>
          <button onClick={() => onNavigate('schedule')} className="text-primary text-xs font-black uppercase tracking-widest">Full View</button>
        </div>
        <div className="space-y-3">
          <JobCard 
            title="Smith Residence" 
            address="124 Oak St, North Loop" 
            time="02:00 PM" 
            tags={['Exterior']} 
            status="In Progress"
            onClick={() => onNavigate('jobDetails', 'job1')}
          />
          <JobCard 
            title="Tech Hub Office" 
            address="Innovation Blvd, UK EC1" 
            time="03:30 PM" 
            tags={['Deep Clean']} 
            status="Confirmed"
            onClick={() => onNavigate('jobDetails', 'job2')}
          />
        </div>
      </div>
    </div>
  );
};

const JobCard: React.FC<{ title: string; address: string; time: string; tags: string[]; status: string; onClick: () => void }> = ({ title, address, time, tags, status, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-98 transition-all"
  >
    <div className="flex flex-col items-center justify-center size-14 rounded-2xl shrink-0 bg-slate-50 dark:bg-slate-900 text-primary border border-slate-100 dark:border-slate-800">
      <span className="text-xs font-black uppercase tracking-tighter">{time.split(' ')[0]}</span>
      <span className="text-[9px] text-slate-400 font-bold uppercase">{time.split(' ')[1]}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <h4 className="text-sm font-black dark:text-white truncate">{title}</h4>
        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded bg-primary/10 text-primary`}>{status}</span>
      </div>
      <p className="text-[11px] text-slate-400 truncate font-medium mb-2">{address}</p>
      <div className="flex gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            {tag}
          </span>
        ))}
      </div>
    </div>
    <button className="size-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-primary hover:bg-primary/10">
      <span className="material-symbols-outlined">near_me</span>
    </button>
  </div>
);

export default Dashboard;