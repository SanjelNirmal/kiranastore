
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Translate from './Translate';

interface FooterProps {
    onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-brand-navy text-white pt-12 pb-6 text-sm">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Bio and Address */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-brand-orange">KIRANA.</h3>
          <p className="opacity-80 leading-relaxed mb-4">
            <Translate text="Your trusted hyper-local marketplace. Fresh products, real-time inventory, and same-day pickup from your neighborhood store." />
          </p>
          <div className="text-xs opacity-60">
            <p>Pyangaun, Godawari 11 </p>
            <p>Lalitpur, Nepal 44700</p>
            <p>redmi.roshan07@gmail.com</p>
            <p>desharprabesh@gmail.com</p>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-bold mb-4"><Translate text="Customer Care" /></h4>
          <ul className="space-y-2 opacity-80">
            <li onClick={() => onNavigate('help')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Help Center" /></li>
            <li onClick={() => onNavigate('how-to-buy')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="How to Buy" /></li>
            <li onClick={() => onNavigate('returns')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Returns & Refunds" /></li>
            <li onClick={() => onNavigate('contact')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Contact Us" /></li>
          </ul>
        </div>

        {/* T&C  */}
        <div>
          <h4 className="font-bold mb-4">KIRANA E-Store</h4>
          <ul className="space-y-2 opacity-80">
            <li onClick={() => onNavigate('about')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="About Us" /></li>
            <li onClick={() => onNavigate('careers')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Careers" /></li>
            <li onClick={() => onNavigate('privacy')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Privacy Policy" /></li>
            <li onClick={() => onNavigate('terms')} className="hover:text-brand-orange cursor-pointer transition-colors"><Translate text="Terms & Conditions" /></li>
          </ul>
        </div>

        {/* Download and Payment */}
        <div>
          <h4 className="font-bold mb-4"><Translate text="Download App   -> Coming Soon <-" /></h4>
          <div className="flex gap-2 mb-4">
            <div className="bg-white/10 w-32 h-10 rounded flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
              <span className="text-xs">App Store</span>
            </div>
            <div className="bg-white/10 w-32 h-10 rounded flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
              <span className="text-xs">Google Play</span>
            </div>
          </div>
          <h4 className="font-bold mb-2"><Translate text="Payment Methods" /></h4>
          <div className="flex gap-2 opacity-80">
            <span className="text-xs border border-white/30 px-2 py-1 rounded">eSewa</span>
            <span className="text-xs border border-white/30 px-2 py-1 rounded">COD</span>
            <span className="text-xs border border-white/30 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 border-t border-white/10 pt-6 text-center text-xs opacity-50">
        &copy; 2026 KIRANA E-Store. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
