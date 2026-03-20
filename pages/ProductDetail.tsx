
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Product, Review } from '../types';
import { ShoppingCart, Star, Truck, Heart, Send, Zap, User, Minus, Plus, AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Translate from '../components/Translate';

interface ProductDetailProps {
  productId: string;
  onNavigate: (page: string, id?: string, category?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  user: { email: string; role: 'admin' | 'customer' } | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onNavigate, onAddToCart, onToggleWishlist, isWishlisted, user }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    window.scrollTo(0, 0);
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error("Error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
    if (data) {
      setReviews(data.map((r: any) => ({
        ...r,
        date: new Date(r.created_at).toLocaleDateString()
      })));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onNavigate('login');
    if (!newComment.trim()) return;
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        user_name: user.email.split('@')[0],
        rating: newRating,
        comment: newComment
      }]);
      
      if (error) throw error;
      
      setNewComment('');
      setNewRating(5);
      fetchReviews();
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product) onAddToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (product) {
      onAddToCart(product, quantity);
      onNavigate('cart');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  const discountPercentage = product.original_price && product.original_price > product.price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-12">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: product.category }, { label: product.name, isActive: true }]} />
      
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-sm shadow-sm p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-12 mb-6">
          <div>
            <div className="aspect-square bg-gray-100 border border-gray-100 rounded-lg overflow-hidden group">
               <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>

          <div>
            <div className="mb-2">
               <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">{product.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="flex items-center text-brand-orange">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      fill={i < Math.round(product.avg_rating || 0) ? "currentColor" : "none"} 
                      className={i >= Math.round(product.avg_rating || 0) ? "text-gray-300" : ""}
                    />
                  ))}
                  <span className="text-gray-500 text-sm ml-2 font-medium">({reviews.length} Ratings)</span>
               </div>
               <div 
                 className={`ml-auto flex items-center gap-1 cursor-pointer transition-colors p-2 rounded-full hover:bg-red-50 ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                 onClick={() => onToggleWishlist(product)}
                 title="Add to wishlist"
               >
                 <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
               </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
               <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-brand-orange">NPR {product.price.toFixed(2)}</span>
                  {discountPercentage > 0 && (
                     <>
                        <span className="text-gray-400 line-through text-xl">NPR {product.original_price?.toFixed(2)}</span>
                        <span className="bg-orange-100 text-brand-orange font-bold px-3 py-1 rounded-full text-sm">-{discountPercentage}%</span>
                     </>
                  )}
               </div>
            </div>

            {/* Stock and Quantity */}
            <div className="mb-8 space-y-6">
               <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Quantity</span>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                     <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="p-3 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        disabled={isOutOfStock || quantity <= 1}
                     >
                        <Minus size={18}/>
                     </button>
                     <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                     <button 
                        onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                        className="p-3 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        disabled={isOutOfStock || quantity >= product.stock_quantity}
                     >
                        <Plus size={18}/>
                     </button>
                  </div>
                  <div className="text-sm">
                     {isOutOfStock ? (
                        <span className="text-red-600 font-bold flex items-center gap-1 bg-red-50 px-3 py-1 rounded"><AlertTriangle size={14}/> Out of Stock</span>
                     ) : (
                        <span className="text-gray-500">Only <b className="text-gray-800">{product.stock_quantity}</b> left in stock</span>
                     )}
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="flex-[1.5] bg-brand-navy text-white font-bold py-4 rounded-lg hover:bg-opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <ShoppingCart size={22} /> ADD TO CART
                  </button>
                  <button 
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="flex-1 bg-brand-orange text-white font-bold py-4 rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Zap size={22} fill="currentColor" /> BUY NOW
                  </button>
               </div>
            </div>

            <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
               <div className="flex items-center gap-3 text-xs font-medium text-gray-500 uppercase tracking-tighter"><Truck size={18} className="text-brand-navy"/> Standard Delivery 2-3 Days</div>
               <div className="flex items-center gap-3 text-xs font-medium text-gray-500 uppercase tracking-tighter"><CheckCircle size={18} className="text-green-500"/> Quality Guaranteed</div>
            </div>
          </div>
        </div>

        {/* Product Info Tabs-style layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Description Section */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-50">
                 <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-brand-orange inline-block">Product Information</h2>
                 <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                    {product.description || "No description provided for this product."}
                 </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-50">
                 <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="text-brand-orange"/> Customer Reviews</h2>
                    <div className="text-sm font-bold bg-brand-navy text-white px-3 py-1 rounded-full">
                       {reviews.length} total
                    </div>
                 </div>

                 {/* Submission Form */}
                 <div className="mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    {!user ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-4 text-sm">You must be logged in to share your experience.</p>
                        <button onClick={() => onNavigate('login')} className="text-brand-orange font-bold hover:underline">Login / Register</button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                         <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-700">Your Rating:</span>
                            <div className="flex items-center gap-1">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => setNewRating(star)}
                                   onMouseEnter={() => setHoverRating(star)}
                                   onMouseLeave={() => setHoverRating(0)}
                                   className="transition-transform hover:scale-125 focus:outline-none"
                                 >
                                   <Star 
                                      size={24} 
                                      className={`${(hoverRating || newRating) >= star ? 'text-brand-orange' : 'text-gray-300'} transition-colors`}
                                      fill={(hoverRating || newRating) >= star ? "currentColor" : "none"}
                                   />
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div>
                            <textarea 
                               className="w-full border border-gray-300 rounded-lg p-4 text-sm focus:border-brand-orange outline-none shadow-inner"
                               rows={3}
                               placeholder="Tell us what you like or dislike about this product..."
                               value={newComment}
                               onChange={e => setNewComment(e.target.value)}
                               required
                            />
                         </div>
                         <div className="flex justify-end">
                            <button 
                               type="submit" 
                               disabled={submittingReview}
                               className="bg-brand-navy text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-orange transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                               {submittingReview ? 'Posting...' : <><Send size={16}/> POST REVIEW</>}
                            </button>
                         </div>
                      </form>
                    )}
                 </div>

                 {/* Reviews List */}
                 <div className="space-y-8">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                         <Star size={48} className="text-gray-100 mx-auto mb-4" />
                         <p className="text-gray-400 italic">No reviews yet. Be the first to rate this product!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="animate-fade-in group">
                           <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-black text-brand-navy uppercase border-2 border-white shadow-sm flex-shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-colors">
                                 {review.user_name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm md:text-base capitalize">{review.user_name}</h4>
                                    <span className="text-[10px] md:text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{review.date}</span>
                                 </div>
                                 <div className="flex text-yellow-400 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                       <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-200" : ""} />
                                    ))}
                                 </div>
                                 <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{review.comment}"</p>
                                 
                                 {/* Admin Reply Logic */}
                                 {review.reply && (
                                    <div className="ml-4 md:ml-8 mt-4 bg-brand-navy/5 p-4 rounded-xl border-l-4 border-brand-orange relative">
                                       <div className="absolute -top-3 left-4 bg-brand-orange text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Store Response</div>
                                       <p className="text-sm text-gray-700 leading-relaxed">{review.reply}</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>

           {/* Sidebar - Related Info */}
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-50">
                 <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">Store Highlights</h3>
                 <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                       <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                          <CheckCircle size={16}/>
                       </div>
                       Verified Local Inventory
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                       <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy">
                          <Truck size={16}/>
                       </div>
                       Same-Day Pick Up Ready
                    </li>
                 </ul>
              </div>

              <div className="bg-gradient-to-br from-brand-navy to-brand-purple p-6 rounded-sm shadow-lg text-white">
                 <h3 className="font-bold mb-2">Secure Checkout</h3>
                 <p className="text-xs opacity-80 mb-4 leading-relaxed">Shop with confidence. We offer direct eSewa integration and Cash on Delivery for your peace of mind.</p>
                 <div className="flex gap-2">
                    <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">eSewa</div>
                    <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">COD</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
