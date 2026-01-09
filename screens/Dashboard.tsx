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
  const [aiResult, setAiResult] = useState<{ text: string, links: any[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: aiQuery,
        config: {
          systemInstruction: `You are a logistics assistant for Window Wash Pro. Help dispatch crews and check locations. If searching for UK addresses/postcodes, use the Google Maps tool to verify. Always prioritize accuracy for navigation. If the user provides a UK postcode like 'SW1A 1AA', look it up directly.`,
          tools: [{ googleMaps: {} }],
          toolConfig: userLocation ? {
            retrievalConfig: {
              latLng: {
                latitude: userLocation.lat,
                longitude: userLocation.lng
              }
            }
          } : undefined
        },
      });

      const text = response.text || "I couldn't find specific details for that location.";
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      setAiResult({ text, links });
    } catch (err) {
      console.error("AI Search Error:", err);
      setAiResult({ text: "Sorry, I had trouble reaching the maps service. Please try again.", links: [] });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Top App Bar */}
      <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex size-10 shrink-0 items-center">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpMcvpv-vdI__7uaIpCBwiECDS981Ilfpb-TFE81XanMAxMw8e7f6Q1CxfqSciw2TLn9cgn9nbhUxNb-PdlSCCbPZbIbV9LZD_ADQGDmWxEDikrHHws3llM_OHZDP2QX_rq04PojRaueo5BrjC4UFNtLFTQ84eDaVWYe5tHCTjI1hRx7RIFCVU8LPTCAOkvREVDaVXxfMqHW2cPiM-S_tl4LX78lervl5FoTgLQQu9e4-KKcRQd-utBCF9Zdl0QAsQyka2j-J9Gn3z")' }}
          />
        </div>
        <div className="flex flex-col flex-1 px-3">
          <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Owner Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monday, Oct 23</p>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button 
            onClick={() => onNavigate('settings')}
            className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[#0d141b] dark:text-white"
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
        </div>
      </div>

      {/* Smart Dispatch AI Search */}
      <div className="px-4 pt-4">
        <form onSubmit={handleAiSearch} className="relative">
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors ${isAiLoading ? 'text-primary animate-pulse' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-xl">{isAiLoading ? 'auto_awesome' : 'smart_toy'}</span>
          </div>
          <input 
            type="text" 
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Search UK postcode or nearby jobs..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white shadow-sm"
          />
          <button 
            type="submit" 
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-xl active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl leading-none">arrow_forward</span>
          </button>
        </form>

        {aiResult && (
          <div className="mt-3 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {aiResult.text}
                </p>
                {aiResult.links.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {aiResult.links.map((chunk, i) => chunk.maps && (
                      <a 
                        key={i} 
                        href={chunk.maps.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-primary bg-white dark:bg-slate-800 p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">map</span>
                        View on Google Maps: {chunk.maps.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-3 p-4">
        <div className="flex min-w-[160px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Today's Revenue</p>
          <p className="text-primary tracking-tight text-2xl font-bold leading-tight">{currencySymbol}1,240</p>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-green-600 font-bold">trending_up</span>
            <p className="text-green-600 text-xs font-bold leading-normal">+12%</p>
          </div>
        </div>
        <div 
          onClick={() => onNavigate('invoice')}
          className="flex min-w-[160px] flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Pending Quotes</p>
          <p className="text-[#0d141b] dark:text-white tracking-tight text-2xl font-bold leading-tight">8</p>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-amber-500 font-bold">hourglass_empty</span>
            <p className="text-amber-500 text-xs font-bold leading-normal">Needs Review</p>
          </div>
        </div>
        <div 
          onClick={() => onNavigate('crews')}
          className="flex min-w-full flex-col gap-1 rounded-xl p-4 bg-primary text-white shadow-md cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Workforce</p>
              <p className="tracking-tight text-2xl font-bold leading-tight">5 Crews Live</p>
            </div>
            <span className="material-symbols-outlined text-3xl opacity-40">local_shipping</span>
          </div>
          <p className="text-white/70 text-xs mt-1">Tap to see real-time field status</p>
        </div>
      </div>

      {/* Crew Locations Map Section */}
      <div className="px-4 py-2">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Field Map</h3>
          <button onClick={() => onNavigate('crews')} className="text-primary text-sm font-semibold">Track All</button>
        </div>
        <div className="relative group">
          <div 
            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7koKeWgsY0-t76uWlNZlM89kJvD-1Dyh9MLXzYYwzooGKry8JkFY_PtR0fbf8EE-XjwOCA7e-pO3GDal8Og9OxtXVTO62jbroR-CN3irtF3gAmbeDyuyN3FIm1TdGCQ0MRqULAFkOd47q45kodlmgpQDQD9HbMlhtHzitf7FRcNiGgt-cwmaZSvyMcNZ48UtINYZaIz-CzwQrBCvNsbDp-EbU7p0816TwIWDlH1KdFmcvFFlPWOWW8HqeIAHpTIV48B5moh2Nz8Cm")' }}
          >
            <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
              <div className="bg-primary p-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                <span className="material-symbols-outlined text-white text-xs">local_shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs Section */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Upcoming Jobs</h3>
          <span className="text-slate-500 text-xs">4 jobs remaining</span>
        </div>
        <div className="space-y-3">
          <JobCard 
            title="Smith Residence" 
            address="124 Oak St, North Loop" 
            time="02:00 PM" 
            tags={['Exterior', 'East Side Crew']} 
            status="In Progress"
            onClick={() => onNavigate('jobDetails', 'job1')}
          />
          <JobCard 
            title="Tech Hub Office Park" 
            address="Suite 400, Innovation Blvd" 
            time="03:30 PM" 
            tags={['Gutter Cleaning']} 
            status="Confirmed"
            onClick={() => onNavigate('jobDetails', 'job2')}
          />
        </div>
      </div>
    </div>
  );
};

interface JobCardProps {
  title: string;
  address: string;
  time: string;
  tags: string[];
  status?: string;
  onClick: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ title, address, time, tags, status, onClick }) => {
  const [hour, period] = time.split(' ');
  const getStatusColor = (s: string) => {
    if (s === 'In Progress') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    if (s === 'Confirmed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-98 transition-all"
    >
      <div className="flex flex-col items-center justify-center size-14 rounded-lg shrink-0 bg-slate-50 dark:bg-slate-900 text-primary">
        <span className="text-xs font-bold">{hour}</span>
        <span className="text-[10px] text-slate-400">{period}</span>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-[#0d141b] dark:text-white truncate">{title}</h4>
          {status && (
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-tighter ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{address}</p>
        <div className="flex gap-2 mt-2">
          {tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-blue-50 dark:bg-blue-900/30 text-primary">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;