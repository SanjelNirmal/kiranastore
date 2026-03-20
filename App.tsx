
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import InfoPages from './pages/InfoPages';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Footer from './components/Footer';
import { Product, CartItem } from './types';

type UserRole = 'admin' | 'customer';

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone_number?: string;
}

interface ViewState {
  page: string;
  id?: string;
  category?: string;
}

const AppContent: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [redirectTarget, setRedirectTarget] = useState<ViewState | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchUserProfile(session.user.id, session.user.email || '');
      else setLoadingAuth(false);
    };
    initializeSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoadingAuth(false);
        setWishlist([]); 
        if (['admin', 'cart', 'wishlist', 'profile'].includes(currentView)) {
          setCurrentView('home');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []); 

  // Redirect after successful login
  useEffect(() => {
    if (user && currentView === 'login') {
      if (redirectTarget) {
        setCurrentView(redirectTarget.page);
        if (redirectTarget.id) setSelectedProductId(redirectTarget.id);
        if (redirectTarget.category !== undefined) setSelectedCategory(redirectTarget.category);
        setRedirectTarget(null);
      } else {
        setCurrentView('home');
      }
    }
  }, [user, currentView, redirectTarget]);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      let { data: profile } = await supabase.from('profiles').select('role, full_name, phone_number').eq('id', userId).maybeSingle();
      if (email.toLowerCase().includes('admin') && (!profile || profile.role !== 'admin')) {
          await supabase.from('profiles').upsert({ id: userId, email, role: 'admin', full_name: email.split('@')[0] });
          profile = { ...profile, role: 'admin' };
      }
      const role: UserRole = profile?.role === 'admin' ? 'admin' : (email.includes('admin') ? 'admin' : 'customer');
      setUser({ id: userId, email, role, full_name: profile?.full_name || '', phone_number: profile?.phone_number || '' });
    } catch (err) { 
      setUser({ id: userId, email, role: 'customer' }); 
    } finally { 
      setLoadingAuth(false); 
    }
  };

  useEffect(() => {
    const userKey = user ? user.id : 'guest';
    const savedCart = localStorage.getItem(`sunshine_cart_${userKey}`);
    setCart(savedCart ? JSON.parse(savedCart) : []);
    
    const loadWishlist = async () => {
      if (user) {
        const { data: wishlistItems } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
        if (wishlistItems?.length) {
             const ids = wishlistItems.map(item => item.product_id);
             const { data: products } = await supabase.from('products').select('*').in('id', ids);
             setWishlist(products || []);
        } else setWishlist([]);
      }
    };
    loadWishlist();
  }, [user]);

  useEffect(() => {
    const userKey = user ? user.id : 'guest';
    localStorage.setItem(`sunshine_cart_${userKey}`, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (product: Product, quantityToShop: number = 1) => {
    if (product.stock_quantity <= 0) {
        toast('error', "Item is out of stock.");
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentInCart = existing ? existing.quantity : 0;
      const newTotal = currentInCart + quantityToShop;

      if (newTotal > product.stock_quantity) {
          toast('error', `Only ${product.stock_quantity} units available. You already have ${currentInCart} in cart.`);
          return prev;
      }

      if (existing) {
        toast('success', `Added ${quantityToShop} more to cart.`);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newTotal } : item);
      }
      toast('success', `Added ${quantityToShop} units to cart.`);
      return [...prev, { ...product, quantity: quantityToShop }];
    });
  };

  const toggleWishlist = async (product: Product) => {
    const isRemoving = !!wishlist.find(p => p.id === product.id);
    setWishlist(prev => isRemoving ? prev.filter(p => p.id !== product.id) : [...prev, product]);
    if (user) {
      if (isRemoving) await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      else await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
    }
  };

  const handleNavigate = (page: string, id?: string, category?: string) => {
    // If attempting to access protected pages without login, save target and show login
    const protectedPages = ['admin', 'profile', 'wishlist'];
    if (protectedPages.includes(page) && !user) {
      setRedirectTarget({ page, id, category });
      setCurrentView('login');
    } else {
      if (id) setSelectedProductId(id);
      if (category !== undefined) setSelectedCategory(category);
      setCurrentView(page);
    }
    window.scrollTo(0, 0);
  };

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Header user={user} onNavigate={handleNavigate} onSearch={q => { setSearchQuery(q); setCurrentView('home'); }} cartCount={cart.reduce((a, i) => a + i.quantity, 0)} wishlistCount={wishlist.length} onLogout={() => supabase.auth.signOut()} />
      <main className="flex-grow">
        {currentView === 'home' && <Home onNavigate={handleNavigate} selectedCategory={selectedCategory} searchQuery={searchQuery} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={id => !!wishlist.find(p => p.id === id)} />}
        {currentView === 'product-detail' && selectedProductId && <ProductDetail productId={selectedProductId} onNavigate={handleNavigate} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} isWishlisted={!!wishlist.find(p => p.id === selectedProductId)} user={user} />}
        {currentView === 'cart' && <Cart cartItems={cart} onUpdateQuantity={(id, d) => setCart(p => p.map(i => i.id === id ? {...i, quantity: Math.min(i.stock_quantity, Math.max(1, i.quantity + d))} : i))} onRemove={id => setCart(p => p.filter(i => i.id !== id))} onNavigate={handleNavigate} onCheckout={() => setCart([])} user={user} />}
        {currentView === 'wishlist' && <Wishlist products={wishlist} onNavigate={handleNavigate} onMoveToCart={p => { addToCart(p); toggleWishlist(p); }} onRemove={p => toggleWishlist(p)} />}
        {currentView === 'profile' && <Profile user={user} onNavigate={handleNavigate} onProfileUpdate={() => {}} />}
        {currentView === 'admin' && <Admin />}
        {currentView === 'login' && <Login onNavigate={handleNavigate} />}
        {['about', 'careers', 'privacy', 'terms', 'help', 'how-to-buy', 'returns', 'contact'].includes(currentView) && <InfoPages pageId={currentView} onNavigate={handleNavigate} />}
        {currentView === 'not-found' && <NotFound onNavigate={handleNavigate} />}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><ToastProvider><AppContent /></ToastProvider></LanguageProvider>;
export default App;
