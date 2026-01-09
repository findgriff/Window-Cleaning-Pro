import React, { useState, useEffect } from 'react';
import { Screen } from './types';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import JobDetails from './screens/JobDetails';
import Invoice from './screens/Invoice';
import Customers from './screens/Customers';
import CustomerProfile from './screens/CustomerProfile';
import Crews from './screens/Crews';
import Settings from './screens/Settings';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => {
        console.warn("Geolocation access denied:", error);
      });
    }

    const locale = navigator.language || 'en-US';
    if (locale.startsWith('en-GB') || locale.startsWith('en-IE')) {
      setCurrencySymbol('£');
    } else {
      setCurrencySymbol('$');
    }

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navigateTo = (screen: Screen, id?: string) => {
    if (id) setSelectedId(id);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} currencySymbol={currencySymbol} userLocation={userLocation} />;
      case 'schedule':
        return <Schedule onNavigate={navigateTo} />;
      case 'jobDetails':
        return <JobDetails jobId={selectedId} onBack={() => navigateTo('dashboard')} />;
      case 'invoice':
        return <Invoice onBack={() => navigateTo('dashboard')} currencySymbol={currencySymbol} />;
      case 'customers':
        return <Customers onNavigate={navigateTo} />;
      case 'customerProfile':
        return <CustomerProfile customerId={selectedId} onBack={() => navigateTo('customers')} currencySymbol={currencySymbol} />;
      case 'crews':
        return <Crews onBack={() => navigateTo('dashboard')} />;
      case 'settings':
        return <Settings onBack={() => navigateTo('dashboard')} darkMode={darkMode} setDarkMode={setDarkMode} />;
      default:
        return <Dashboard onNavigate={navigateTo} currencySymbol={currencySymbol} userLocation={userLocation} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[480px] mx-auto bg-white dark:bg-background-dark shadow-2xl relative overflow-x-hidden">
      <main className="flex-1">
        {renderScreen()}
      </main>
      
      {!['jobDetails', 'invoice', 'settings', 'customerProfile'].includes(currentScreen) && (
        <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} />
      )}
    </div>
  );
};

export default App;