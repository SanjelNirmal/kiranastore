
import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, X, Settings, Globe, Loader2 } from 'lucide-react';
import { supabase, getSupabaseConfigError } from '../supabaseClient';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Translate from './Translate';

interface HeaderProps {
  user: { email: string; role: 'admin' | 'customer' } | null;
  onNavigate: (page: string, id?: string, category?: string) => void;
  onSearch: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate, onSearch, cartCount, wishlistCount, onLogout }) => {
  const { language, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const categories = [
    "Fresh Produce",
    "Bakery",
    "Beverages",
    "Household",
    "Personal Care"
  ];
if (getSupabaseConfigError() || !supabase) {
  setSuggestions([]);
  setIsSearching(false);
  return;
}
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Clear state if search term is too short
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSuggestionClick = (product: Product) => {
    onNavigate('product-detail', product.id);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-brand-navy text-white text-xs py-1">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <span className="hover:underline cursor-pointer"><li onClick={() => onNavigate('help')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Help & Support" /></li></span>
            <span><Translate text="<- Click here for help and support" /></span>
          </div>
          <div className="flex space-x-4 items-center">
            <span><Translate text="To translate to Nepali or English Click here ->" /></span>
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 font-bold hover:text-brand-orange transition-colors"
            >
                <Globe size={12} />
                {language === 'en' ? 'English' : 'नेपाली'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer min-w-max" 
          onClick={() => onNavigate('home', undefined, '')}
        >
          
          <div className="text-2xl font-extrabold tracking-tighter text-brand-navy">
            KIRANA<span className="text-brand-orange">.</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative hidden md:block" ref={searchRef}>
          <div className="flex relative">
            <input 
              type="text" 
              placeholder={language === 'ne' ? "उत्पादनहरू खोज्नुहोस्..." : "Search by title, description..."} 
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-purple text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {/* Loading Indicator or Clear Button */}
            {isSearching ? (
               <div className="absolute right-14 top-2.5 text-brand-orange">
                  <Loader2 size={16} className="animate-spin" />
               </div>
            ) : (
              searchTerm && (
                <button 
                  className="absolute right-14 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )
            )}

            <button 
              className="bg-brand-orange text-white px-6 rounded-r-md hover:bg-orange-600 transition-colors flex items-center justify-center"
              onClick={handleSearchSubmit}
            >
              <Search size={18} />
            </button>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchTerm.length >= 2 && !isSearching && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md border border-gray-100 mt-1 max-h-96 overflow-y-auto z-50">
              <ul>
                {suggestions.map((product) => (
                  <li 
                    key={product.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                    onClick={() => handleSuggestionClick(product)}
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 line-clamp-1"><Translate text={product.name} /></div>
                      <div className="text-xs text-gray-500"><Translate text={product.category} /></div>
                    </div>
                    <div className="text-xs font-bold text-brand-orange">NPR {product.price.toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* No Results State */}
          {showSuggestions && searchTerm.length >= 2 && !isSearching && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md border border-gray-100 mt-1 p-4 text-center text-sm text-gray-500 z-50">
               No products found.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-6 text-brand-navy">
          {/* User / Login */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded group relative"
            onClick={() => !user && onNavigate('login')}
          >
            <User size={20} />
            <div className="hidden lg:flex flex-col text-xs leading-none">
              <span className="text-gray-500"><Translate text={user ? "Hello," : "Sign In"} /> {user ? user.email.split('@')[0] : ''}</span>
              <span className="font-bold"><Translate text={user ? (user.role === 'admin' ? 'Admin Panel' : 'My Account') : 'Login / Register'} /></span>
            </div>
            
            {/* Dropdown for logged in user */}
            {user && (
              <div className="absolute top-full right-0 w-48 bg-white shadow-lg rounded-md py-2 hidden group-hover:block border border-gray-100 z-50">
                {user.role === 'admin' && (
                  <div 
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium flex items-center gap-2"
                    onClick={() => onNavigate('admin')}
                  >
                    <Settings size={14} /> <Translate text="Admin Dashboard" />
                  </div>
                )}
                <div 
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium flex items-center gap-2"
                  onClick={() => onNavigate('profile')}
                >
                  <User size={14} /> <Translate text="My Profile" />
                </div>
                <div className="border-t my-1"></div>
                <div 
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-red-600 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                >
                  <LogOut size={14} /> <Translate text="Logout" />
                </div>
              </div>
            )}
          </div>

          <div 
            className="hidden sm:block cursor-pointer relative hover:text-brand-purple transition-colors"
            onClick={() => onNavigate('wishlist')}
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-purple text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>

          <div 
            className="relative cursor-pointer hover:text-brand-orange transition-colors"
            onClick={() => onNavigate('cart')}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Categories Nav (Desktop) */}
      <div className="border-t border-gray-100 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-8 text-sm font-medium text-gray-600 py-2.5">
            <li className="text-brand-orange flex items-center gap-1 cursor-pointer font-bold">
              <Menu size={16} /> <Translate text="Categories" />
            </li>
            {categories.map((cat) => (
              <li 
                key={cat} 
                className="hover:text-brand-purple cursor-pointer transition-colors"
                onClick={() => onNavigate('home', undefined, cat)}
              >
                <Translate text={cat} />
              </li>
            ))}
            {user?.role === 'admin' && (
              <li 
                className="ml-auto text-brand-purple font-bold cursor-pointer"
                onClick={() => onNavigate('admin')}
              >
                <Translate text="Manage Inventory" />
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
