
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Product, Review } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';
import { Filter, ChevronDown, ChevronRight, ChevronLeft, Clock, Zap, Star as StarIcon, Carrot, Coffee, Home as HomeIcon, Smartphone, Shirt, ShoppingBag, WifiOff, RefreshCcw } from 'lucide-react';
import Translate from '../components/Translate';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
  onNavigate: (page: string, id?: string, category?: string) => void;
  selectedCategory: string;
  searchQuery: string;
  addToCart: (product: Product) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
}

const useCountdown = (targetDate: string | null) => {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({
            days: days.toString().padStart(2, '0'),
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
};

const Home: React.FC<HomeProps> = ({ onNavigate, selectedCategory, searchQuery, addToCart, toggleWishlist, isInWishlist }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sortOption, setSortOption] = useState('default');
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [newLaunchProducts, setNewLaunchProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const timeLeft = useCountdown(flashSaleEndTime);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      await Promise.all([fetchProducts(), fetchSettings()]);
    } catch (err: any) {
      console.error('Initialization Error:', err);
      setErrorState(err.message || 'Failed to connect to the store.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('key', 'flash_sale_end').single();
    if (data) setFlashSaleEndTime(data.value);
  };

  const fetchProducts = async () => {
    const { data: prodData, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Fetch Review aggregates - build a map in O(N+M) instead of filtering per product
    const { data: reviewData } = await supabase.from('reviews').select('product_id, rating');
    
    const reviewMap = new Map<string, { sum: number; count: number }>();
    for (const r of reviewData || []) {
      const entry = reviewMap.get(r.product_id) ?? { sum: 0, count: 0 };
      entry.sum += r.rating;
      entry.count += 1;
      reviewMap.set(r.product_id, entry);
    }

    const enrichedProducts: Product[] = (prodData || []).map(p => {
        const agg = reviewMap.get(p.id);
        const count = agg?.count ?? 0;
        const avg = count > 0 ? (agg!.sum / count) : 0;
        return {
            ...p,
            avg_rating: avg,
            review_count: count
        };
    });

    setProducts(enrichedProducts);
    setFlashSaleProducts(enrichedProducts.filter(p => p.is_flash_sale).slice(0, 4));
    setNewLaunchProducts(enrichedProducts.slice(0, 4));
    setFeaturedProducts(enrichedProducts.filter(p => p.is_featured).slice(0, 4));
  };

  // Error UI
  if (errorState) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3"><Translate text="Connection Error" /></h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            <Translate text="We're having trouble reaching our database. Your project might be paused or there's a network issue." />
          </p>
          <button 
            onClick={initData}
            className="w-full bg-brand-navy text-white py-4 rounded-xl font-bold hover:bg-brand-orange transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCcw size={18} /> <Translate text="Try Again" />
          </button>
        </div>
      </div>
    );
  }

  // Rest of filtering/sorting logic
  let filteredProducts = products;
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  } else if (selectedCategory) {
    filteredProducts = products.filter(p => p.category === selectedCategory || (selectedCategory === "Household" && p.category === "Home"));
  }
  if (priceRange.min) filteredProducts = filteredProducts.filter(p => p.price >= Number(priceRange.min));
  if (priceRange.max) filteredProducts = filteredProducts.filter(p => p.price <= Number(priceRange.max));

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  const displayProducts = sortedProducts.slice(0, visibleCount);
  const categoriesList = ["Fresh Produce", "Bakery", "Beverages", "Household", "Personal Care"];

  if (searchQuery) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen pb-12">
        <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home', undefined, '') }, { label: `Search: "${searchQuery}"`, isActive: true }]} />
        <div className="container mx-auto px-4 mt-4 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
             <div className="bg-white p-4 rounded-sm shadow-sm">
               <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Filter size={16}/> <Translate text="Filter Results" /></h3>
               <div className="mb-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2"><Translate text="Related Categories" /></h4>
                 <div className="space-y-1">
                   {categoriesList.map(cat => (
                     <div key={cat} className="flex items-center gap-2">
                       <input type="checkbox" checked={filteredProducts.some(p => p.category === cat)} readOnly className="rounded text-brand-orange focus:ring-brand-orange" />
                       <label className="text-sm text-gray-600"><Translate text={cat} /></label>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="mb-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2"><Translate text="Price Range" /></h4>
                 <div className="flex items-center gap-2 mb-2">
                   <input type="number" placeholder="Min" className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}/>
                   <span className="text-gray-400">-</span>
                   <input type="number" placeholder="Max" className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}/>
                 </div>
                 <button className="w-full bg-brand-navy text-white text-xs py-1 rounded hover:bg-opacity-90"><Translate text="APPLY" /></button>
               </div>
             </div>
          </div>
          <div className="flex-1">
             <div className="bg-white p-4 rounded-sm shadow-sm mb-4 flex justify-between items-center">
               <div>
                 <h1 className="text-lg font-bold text-gray-800"><Translate text="Search results for" /> "{searchQuery}"</h1>
                 <p className="text-xs text-gray-500">{filteredProducts.length} <Translate text="items found" /></p>
               </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onNavigate={onNavigate} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(product.id)} />
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
     return (
        <div className="bg-[#F5F5F5] min-h-screen pb-12">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home', undefined, '') }, { label: selectedCategory, isActive: true }]} />
          <div className="container mx-auto px-4 mt-6">
            <h2 className="text-xl font-bold text-gray-700 mb-6"><Translate text={selectedCategory} /></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} onNavigate={onNavigate} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(product.id)} />
              ))}
            </div>
          </div>
        </div>
     );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-12">
      <div className="container mx-auto px-4 mt-6 mb-10">
         <HeroSlider onNavigate={onNavigate} />
      </div>
      <div className="container mx-auto px-4 mb-10">
         <CategoryRail onNavigate={onNavigate} />
      </div>

      {products.length === 0 && !loading ? (
        <div className="container mx-auto px-4 text-center py-12">
          <div className="bg-white p-8 rounded shadow-sm">
             <h2 className="text-xl font-bold text-gray-700 mb-2"><Translate text="Welcome to Sunshine Store!" /></h2>
             <p className="text-gray-500"><Translate text="The store is currently empty. Please login as Admin to add products." /></p>
          </div>
        </div>
      ) : (
        <>
          {flashSaleProducts.length > 0 && (
              <div className="container mx-auto px-4 mb-10">
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                     <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-bold text-brand-orange flex items-center gap-2"><Zap fill="currentColor"/> <Translate text="Flash Sale" /></h2>
                        {flashSaleEndTime && (
                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <span><Translate text="Ending in" /></span>
                            <div className="flex items-center gap-1.5 font-mono">
                                <div className="flex flex-col items-center">
                                    <div className="bg-brand-navy text-white px-2 py-1 rounded text-xs font-bold w-10 text-center">{timeLeft.days}</div>
                                    <span className="text-[8px] uppercase font-sans mt-0.5 text-gray-400">Days</span>
                                </div>
                                <span className="text-brand-navy font-bold pb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <div className="bg-brand-navy text-white px-2 py-1 rounded text-xs font-bold w-10 text-center">{timeLeft.hours}</div>
                                    <span className="text-[8px] uppercase font-sans mt-0.5 text-gray-400">Hrs</span>
                                </div>
                                <span className="text-brand-navy font-bold pb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <div className="bg-brand-navy text-white px-2 py-1 rounded text-xs font-bold w-10 text-center">{timeLeft.minutes}</div>
                                    <span className="text-[8px] uppercase font-sans mt-0.5 text-gray-400">Min</span>
                                </div>
                                <span className="text-brand-navy font-bold pb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <div className="bg-brand-orange text-white px-2 py-1 rounded text-xs font-bold w-10 text-center">{timeLeft.seconds}</div>
                                    <span className="text-[8px] uppercase font-sans mt-0.5 text-gray-400">Sec</span>
                                </div>
                            </div>
                            </div>
                        )}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {flashSaleProducts.map(p => (
                        <ProductCard key={`flash-${p.id}`} product={p} onAddToCart={addToCart} onNavigate={onNavigate} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(p.id)} />
                     ))}
                  </div>
                </div>
              </div>
          )}
          <div className="container mx-auto px-4 mb-10">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800"><Translate text="New Launch" /></h2>
                <button className="text-sm font-bold text-brand-orange hover:underline"><Translate text="Shop All" /></button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {newLaunchProducts.map(p => (
                   <ProductCard key={`new-${p.id}`} product={p} onAddToCart={addToCart} onNavigate={onNavigate} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(p.id)} />
                ))}
             </div>
          </div>
          {featuredProducts.length > 0 && (
            <div className="container mx-auto px-4 mb-10">
               <h2 className="text-2xl font-bold text-gray-800 mb-6"><Translate text="Featured Products" /></h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {featuredProducts.slice(0, 2).map((p, idx) => (
                      <div key={`feat-${p.id}`} className={`bg-white p-6 rounded-lg shadow-sm flex gap-6 border-l-8 hover:shadow-md transition-shadow ${idx === 0 ? 'border-brand-orange' : 'border-brand-purple'}`}>
                         <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-100 flex-shrink-0 cursor-pointer rounded-md overflow-hidden" onClick={() => onNavigate('product-detail', p.id)}>
                            <img src={p.image_url} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt={p.name} />
                         </div>
                         <div className="flex flex-col justify-center">
                            <div className="text-xs font-bold text-brand-orange uppercase mb-2 tracking-wide">{idx === 0 ? <Translate text="Editor's Pick" /> : <Translate text="Top Rated" />}</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-brand-orange transition-colors" onClick={() => onNavigate('product-detail', p.id)}><Translate text={p.name} /></h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4"><Translate text={p.description} /></p>
                            <div className="font-bold text-xl text-brand-navy">NPR {p.price.toFixed(2)}</div>
                         </div>
                      </div>
                   ))}
               </div>
            </div>
          )}
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm sticky top-[72px] z-20">
               <h2 className="text-lg font-bold text-gray-700 flex-1"><Translate text="Just For You" /></h2>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500"><Translate text="Sort By" /></span>
                  <select className="text-xs border border-gray-300 rounded p-1" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                     <option value="default">Best Match</option>
                     <option value="price-asc">Price Low</option>
                     <option value="price-desc">Price High</option>
                  </select>
               </div>
            </div>
            {loading ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {[...Array(12)].map((_, i) => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded"></div>)}
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onNavigate={onNavigate} onToggleWishlist={toggleWishlist} isWishlisted={isInWishlist(product.id)} />
                ))}
              </div>
            )}
            {sortedProducts.length > visibleCount && (
              <div className="mt-10 flex justify-center pb-8">
                <button onClick={() => setVisibleCount(v => v + 12)} className="bg-white border-2 border-brand-orange text-brand-orange px-10 py-3 rounded-full text-sm font-bold hover:bg-brand-orange hover:text-white transition-all uppercase tracking-wide shadow-sm">
                  <Translate text="Load More" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const HeroSlider = ({ onNavigate }: { onNavigate: any }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { id: 1, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop", title: "Fresh for your Everyday Life", sub: "Up to 50% off on weekly groceries.", cta: "Shop Groceries", category: "Fresh Produce" },
    { id: 2, image: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?q=80&w=2129&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Electronics Big Sale", sub: "Latest gadgets at unbeatable prices.", cta: "View Gadgets", category: "Electronics" },
    { id: 3, image: "https://images.unsplash.com/photo-1594885270166-07d20113fb9a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", title: "Organic & Healthy", sub: "Start your healthy lifestyle today.", cta: "Go Organic", category: "Groceries" }
  ];
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
       {slides.map((slide, index) => (
         <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`absolute inset-0 transition-transform duration-[10000ms] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'}`}>
                <img src={slide.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent backdrop-blur-[1px]"></div>
            </div>
            <div className={`absolute inset-0 flex items-center px-8 md:px-16`}>
                <div className={`text-white max-w-xl transition-all duration-700 delay-300 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                   <span className="bg-brand-orange/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-wider shadow-sm border border-brand-orange/50">
                      <Translate text="FEATURED COLLECTION" />
                   </span>
                   <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight drop-shadow-lg"><Translate text={slide.title} /></h1>
                   <p className="text-gray-100 mb-8 text-base md:text-lg font-light leading-relaxed drop-shadow-md max-w-md"><Translate text={slide.sub} /></p>
                   <button onClick={() => onNavigate('home', undefined, slide.category)} className="bg-white text-brand-navy px-8 py-3.5 rounded-full font-bold hover:bg-brand-orange hover:text-white transition-all shadow-lg transform hover:-translate-y-1 flex items-center gap-2 group/btn">
                      <Translate text={slide.cta} /> <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>
                   </button>
                </div>
            </div>
         </div>
       ))}
       <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
         {slides.map((_, i) => (
           <div key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${i === currentSlide ? 'bg-brand-orange w-8' : 'bg-white/50 hover:bg-white w-2'}`} />
         ))}
       </div>
    </div>
  )
}

const CategoryRail = ({ onNavigate }: { onNavigate: any }) => {
    const categories = [
        { name: "Fresh Produce", icon: Carrot, color: "bg-green-100 text-green-600" },
        { name: "Bakery", icon: Coffee, color: "bg-amber-100 text-amber-600" },
        { name: "Beverages", icon: Coffee, color: "bg-blue-100 text-blue-600" },
        { name: "Household", icon: HomeIcon, color: "bg-purple-100 text-purple-600" },
        { name: "Electronics", icon: Smartphone, color: "bg-gray-100 text-gray-600" },
        { name: "Fashion", icon: Shirt, color: "bg-pink-100 text-pink-600" },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
                <div key={idx} onClick={() => onNavigate('home', undefined, cat.name)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-200 flex flex-col items-center gap-3 group animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <cat.icon size={26} />
                    </div>
                    <span className="font-medium text-gray-700 text-sm group-hover:text-brand-orange transition-colors text-center"><Translate text={cat.name} /></span>
                </div>
            ))}
        </div>
    );
}

export default Home;
