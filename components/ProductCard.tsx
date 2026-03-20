
import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Heart, Star, Zap } from 'lucide-react';
import Translate from './Translate';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onNavigate: (page: string, id?: string) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onNavigate, onToggleWishlist, isWishlisted }) => {
  const rating = product.avg_rating || 0;
  const reviews = product.review_count || 0;
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 10;
  
  // Real Discount Calculation
  let discountPercentage = 0;
  if (product.original_price && product.original_price > product.price) {
    discountPercentage = Math.round(((product.original_price - product.price) / product.original_price) * 100);
  }

  return (
    <div 
      onClick={() => onNavigate('product-detail', product.id)}
      className="group bg-white rounded-sm border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col h-full relative cursor-pointer"
    >
      <div className="aspect-square overflow-hidden relative bg-gray-100">
        <img 
          src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Real Badge Logic */}
        {isOutOfStock ? (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-sm">
            SOLD OUT
          </div>
        ) : discountPercentage > 0 ? (
          <div className="absolute top-2 right-2 bg-brand-orange text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1">
            <Zap size={10} fill="currentColor"/> -{discountPercentage}%
          </div>
        ) : null}

        {/* Low Stock Urgent Warning */}
        {isLowStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[9px] font-bold py-1 text-center backdrop-blur-sm">
            ONLY {product.stock_quantity} LEFT
          </div>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2 left-2 p-1.5 rounded-full bg-white shadow-sm hover:text-red-500 transition-all ${isWishlisted ? 'text-red-500 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm text-gray-800 font-medium leading-snug line-clamp-2 mb-1 group-hover:text-brand-orange transition-colors">
          <Translate text={product.name} />
        </h3>
        
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                fill={i < Math.floor(rating) ? "currentColor" : "none"} 
                className={i >= Math.floor(rating) ? "text-gray-300" : ""}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            {reviews > 0 ? `(${reviews})` : <Translate text="New" />}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-brand-orange">NPR {product.price.toFixed(2)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-gray-400 line-through">NPR {product.original_price.toFixed(2)}</span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isOutOfStock}
            className={`w-full mt-3 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase rounded-sm transition-colors ${
              !isOutOfStock 
                ? 'bg-brand-navy text-white hover:bg-brand-orange' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200 lg:opacity-0`}
          >
            <ShoppingCart size={14} /> {isOutOfStock ? <Translate text="No Stock" /> : <Translate text="Add to Cart" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
