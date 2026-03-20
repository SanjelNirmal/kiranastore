
import React from 'react';
import { Home, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import Translate from '../components/Translate';

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-brand-orange/10 blur-3xl rounded-full"></div>
        <div className="relative bg-white p-8 rounded-full shadow-xl">
           <Search size={80} className="text-brand-orange animate-bounce" />
           <div className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full border-4 border-white">
              <AlertCircle size={24} />
           </div>
        </div>
      </div>
      
      <h1 className="text-7xl font-black text-brand-navy mb-2 tracking-tighter">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
        <Translate text="Oops! Page Not Found" />
      </h2>
      
      <p className="text-gray-500 max-w-md mb-8 text-lg leading-relaxed">
        <Translate text="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable." />
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
            onClick={() => onNavigate('home')}
            className="bg-brand-navy text-white px-8 py-3.5 rounded-full font-bold hover:bg-brand-orange transition-all flex items-center justify-center gap-2 shadow-lg transform hover:-translate-y-1"
        >
            <Home size={20} /> <Translate text="Back to Home" />
        </button>
        <button 
            onClick={() => window.history.back()}
            className="bg-white text-gray-700 border border-gray-200 px-8 py-3.5 rounded-full font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
            <ArrowLeft size={20} /> <Translate text="Go Back" />
        </button>
      </div>
    </div>
  );
};

export default NotFound;
