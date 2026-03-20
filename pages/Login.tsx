
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { User, Phone, Lock, Mail, ArrowLeft, Send } from 'lucide-react';
import Translate from '../components/Translate';

interface LoginProps {
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetting) {
        // --- RESET PASSWORD FLOW ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/?view=login`,
        });
        if (error) throw error;
        toast('success', 'Password reset link sent to your email!');
        setIsResetting(false);
      } else if (isRegistering) {
        // --- REGISTER FLOW ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            phone_number: phoneNumber
          });

          if (profileError) console.error("Error creating profile:", profileError);
        }

        if (data.user && data.session === null) {
          toast('success', 'Registration successful! Please verify your email.');
          setIsRegistering(false); 
        } else {
          toast('success', 'Account created! Welcome to Sunshine.');
        }

      } else {
        // --- LOGIN FLOW ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before logging in.');
          }
          throw error;
        }
        toast('success', 'Welcome back!');
      }
    } catch (err: any) {
      toast('error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-orange/10 rounded-full mb-4">
             {isResetting ? <Lock className="text-brand-orange" size={32} /> : <User className="text-brand-orange" size={32} />}
          </div>
          <h2 className="text-3xl font-bold text-brand-navy">
            {isResetting ? 'Reset Password' : (isRegistering ? 'Create Account' : 'Welcome Back')}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isResetting 
              ? 'Enter your email to receive a password reset link' 
              : (isRegistering ? 'Join KIRANA E-Store today' : 'Log in to your KIRANA account')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Registration Extra Fields */}
          {isRegistering && !isResetting && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    required={isRegistering}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="tel" 
                    required={isRegistering}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
                    placeholder="98XXXXXXXX"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {!isResetting && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">Password</label>
                {!isRegistering && (
                  <button 
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-xs font-bold text-brand-orange hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {isRegistering && <p className="text-[10px] text-gray-400 mt-1">Must be at least 6 characters</p>}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-lg hover:bg-brand-orange transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (
              isResetting ? <><Send size={18} /> Send Reset Link</> : (isRegistering ? 'CREATE ACCOUNT' : 'LOG IN')
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isResetting ? (
            <button 
              onClick={() => setIsResetting(false)}
              className="text-brand-navy font-bold flex items-center gap-2 mx-auto hover:text-brand-orange transition-colors"
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          ) : (
            <p>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                className="text-brand-orange font-bold hover:underline"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Log in here' : 'Register here'}
              </button>
            </p>
          )}
          
          <button 
            className="mt-6 text-xs text-gray-400 flex items-center gap-1 mx-auto hover:text-gray-600 transition-colors"
            onClick={() => onNavigate('home')}
          >
            <ArrowLeft size={12} /> <Translate text="Back to Store" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
