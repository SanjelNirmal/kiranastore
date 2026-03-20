import React from 'react';
import { Product } from '../types';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';

interface WishlistProps {
  products: Product[];
  onNavigate: (page: string, id?: string) => void;
  onMoveToCart: (product: Product) => void;
  onRemove: (product: Product) => void;
}

const Wishlist: React.FC<WishlistProps> = ({ products, onNavigate, onMoveToCart, onRemove }) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <button onClick={() => onNavigate('home')} className="p-1 hover:bg-gray-200 rounded-full">
            <ArrowLeft size={24} />
          </button>
          My Wishlist
        </h1>

        {products.length === 0 ? (
          <div className="bg-white p-12 rounded shadow-sm text-center">
             <div className="flex justify-center mb-4 text-gray-300">
               <Heart size={64} />
             </div>
             <p className="text-lg text-gray-500 mb-4">Your wishlist is empty</p>
             <button 
               onClick={() => onNavigate('home')} 
               className="bg-brand-orange text-white px-6 py-2 rounded font-bold hover:bg-orange-600"
             >
               Explore Products
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded shadow-sm p-4 flex flex-col">
                <div 
                  className="aspect-square bg-gray-100 mb-4 cursor-pointer overflow-hidden rounded-sm"
                  onClick={() => onNavigate('product-detail', product.id)}
                >
                  <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                
                <h3 
                  className="font-medium text-gray-800 line-clamp-2 mb-2 cursor-pointer hover:text-brand-orange"
                  onClick={() => onNavigate('product-detail', product.id)}
                >
                  {product.name}
                </h3>
                
                <div className="text-brand-orange font-bold text-lg mb-4">NPR {product.price.toFixed(2)}</div>
                
                <div className="mt-auto flex flex-col gap-2">
                  <button 
                    onClick={() => onMoveToCart(product)}
                    className="w-full bg-brand-navy text-white py-2 rounded-sm text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90"
                  >
                    <ShoppingCart size={16} /> Move to Cart
                  </button>
                  <button 
                    onClick={() => onRemove(product)}
                    className="w-full border border-gray-300 text-gray-500 py-2 rounded-sm text-sm font-bold flex items-center justify-center gap-2 hover:text-red-500 hover:border-red-500 transition-colors"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;