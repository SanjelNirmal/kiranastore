
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { Product, Order, Review, Voucher } from '../types';
import { Edit, Plus, X, Trash2, Search, Package, DollarSign, ShoppingBag, Printer, MessageSquare, Reply, User, Ticket, Clock, CheckSquare, Square, Save, Star } from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  original_price: string;
  stock_quantity: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  is_flash_sale: boolean;
}

interface AdminOrder extends Order {
  user_email?: string;
  user_full_name?: string;
  user_phone?: string;
}

const INITIAL_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  stock_quantity: '',
  image_url: '',
  category: 'Fresh Produce',
  is_featured: false,
  is_flash_sale: false
};

const Admin: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reviews' | 'vouchers' | 'settings'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ProductForm>(INITIAL_FORM);
  const [replyText, setReplyText] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [flashSaleDate, setFlashSaleDate] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchOrders(), fetchReviews(), fetchVouchers(), fetchSettings()]);
    } catch (e) {
      console.error("Error loading dashboard:", e);
      toast('error', "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
      toast('error', 'Failed to fetch products');
    }
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
      
    if (ordersData) {
      const userIds = Array.from(new Set(ordersData.map((o: any) => o.user_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone_number')
        .in('id', userIds);

      const mappedOrders = ordersData.map((order: any) => {
        const profile = profilesData?.find(p => p.id === order.user_id);
        return {
          ...order,
          items: order.order_items,
          user_email: profile?.email || 'Unknown',
          user_full_name: profile?.full_name || 'N/A',
          user_phone: profile?.phone_number || 'N/A'
        };
      });
      setOrders(mappedOrders);
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (data) {
        const formatted = data.map((r: any) => ({
            ...r,
            date: new Date(r.created_at).toLocaleDateString()
        }));
        setReviews(formatted);
    }
  };

  const fetchVouchers = async () => {
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
    setVouchers(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('key', 'flash_sale_end').single();
    if (data) {
        const date = new Date(data.value);
        const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setFlashSaleDate(localIso);
    }
  };

  const handleEditClick = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      category: product.category || 'Fresh Produce',
      is_featured: product.is_featured || false,
      is_flash_sale: product.is_flash_sale || false
    });
    setCurrentId(product.id);
    setIsEditing(true);
    setView('form');
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast('success', "Product deleted successfully");
      await fetchProducts();
    } catch (err: any) {
      toast('error', "Error deleting product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setFormData(INITIAL_FORM);
    setCurrentId(null);
    setIsEditing(false);
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url,
        category: formData.category,
        is_featured: formData.is_featured,
        is_flash_sale: formData.is_flash_sale
      };
      let error;
      if (isEditing && currentId) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', currentId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert([payload]);
        error = insertError;
      }
      if (error) throw error;
      await fetchProducts();
      setView('list');
      toast('success', isEditing ? "Product updated" : "Product created");
    } catch (err: any) {
      toast('error', "Error saving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim() || !discountValue) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('vouchers').insert([{
          code: voucherCode.toUpperCase(),
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          min_order_amount: parseFloat(minOrder),
          is_active: true
      }]);
      if (error) throw error;
      setVoucherCode('');
      setDiscountValue('');
      setMinOrder('0');
      await fetchVouchers();
      toast('success', "Voucher created");
    } catch(err: any) {
      toast('error', "Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if(!window.confirm("Delete voucher?")) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (!error) {
        fetchVouchers();
        toast('success', "Voucher deleted");
    }
  };

  const handleSaveSettings = async () => {
     setLoading(true);
     try {
       const utcDate = new Date(flashSaleDate).toISOString();
       const { error } = await supabase.from('app_settings').upsert({ key: 'flash_sale_end', value: utcDate });
       if(error) throw error;
       toast('success', "Flash sale timer updated successfully");
     } catch (err: any) {
       toast('error', "Error: " + err.message);
     } finally {
       setLoading(false);
     }
  };

  const handleOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast('error', "Error: " + error.message);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      toast('success', "Status updated");
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from('reviews').update({ reply: replyText }).eq('id', reviewId);
    if (!error) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText } : r));
      setReplyText('');
      setActiveReviewId(null);
      toast('success', "Reply sent to customer");
    }
  };

  const handlePrintInvoice = (order: AdminOrder) => {
    const printWindow = window.open('', '', 'height=800,width=900');
    if (!printWindow) return;
    // Calculation logic for invoice
    const itemSubtotal = Number(order.items?.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0);
    const subtotal = itemSubtotal;
    const shippingFee = itemSubtotal >= 999 ? 0 : 150;
    const displayAddress = order.shipping_address?.replace(/\n/g, ', ');
    const itemsHtml = order.items?.map(item => `
      <tr>
        <td>${item.name}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">NPR ${Number(item.price).toFixed(2)}</td>
        <td class="text-right">NPR ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .invoice-label { font-size: 36px; font-weight: bold; color: #141A46; letter-spacing: 1px; }
            .company-info { text-align: right; }
            .company-name { font-size: 20px; font-weight: bold; color: #ED872D; margin-bottom: 5px; }
            .company-address { font-size: 13px; color: #666; }
            
            .bill-to-section { margin-bottom: 40px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            
            .client-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
            .client-field { display: flex; flex-direction: column; }
            .field-label { font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 4px; }
            .field-value { font-size: 14px; font-weight: 500; word-break: break-word; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background-color: #f8f9fa; padding: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #ddd; color: #555; }
            td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
            .text-right { text-align: right; }
            
            .totals-container { display: flex; justify-content: flex-end; margin-bottom: 60px; }
            .totals-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
            .grand-total { font-weight: bold; font-size: 18px; color: #141A46; border-top: 2px solid #333; margin-top: 8px; padding-top: 12px; }

            .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; margin-top: 50px; text-align: center; }
            .signature-box { display: flex; flex-direction: column; align-items: center; }
            .signature-line { width: 100%; border-top: 1px solid #333; margin-bottom: 8px; }
            .signature-label { font-size: 12px; font-weight: bold; color: #555; }
            .signature-value { font-size: 13px; margin-bottom: 4px; height: 20px; }

            .terms { margin-top: 50px; font-size: 11px; color: #777; border-top: 1px dashed #ddd; padding-top: 20px; }
            .thanks { margin-top: 30px; text-align: center; font-size: 16px; font-weight: bold; color: #ED872D; font-style: italic; }
            
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
             <div>
                <div class="invoice-label">INVOICE</div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">#${order.id.slice(0, 8).toUpperCase()}</div>
             </div>
             <div class="company-info">
                <div class="company-name">KIRANA E-Store</div>
                <div class="company-address">Pyangaun, Godawari 11</div>
                <div class="company-address">Lalitpur, Nepal 44700</div>
                <div class="company-address">redmi.roshan07@gmail.com | +9779867071985</div>
                <div class="company-address">desharparash@gmail.com</div>
             </div>
          </div>

          <div class="bill-to-section">
            <div class="section-title">Bill To</div>
            <div class="client-grid">
               <div class="client-field">
                  <span class="field-label">Client Name</span>
                  <span class="field-value">${order.user_full_name || 'Valued Customer'}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Email</span>
                  <span class="field-value">${order.user_email}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Address</span>
                  <span class="field-value">${displayAddress || 'N/A'}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Phone Number</span>
                  <span class="field-value">${order.user_phone || 'N/A'}</span>
               </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 45%">Item Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="4" style="text-align:center; padding: 20px;">No items found</td></tr>'}
            </tbody>
          </table>

          <div class="totals-container">
             <div class="totals-box">
                <div class="total-row">
                   <span style="color: #666;">Subtotal</span>
                   <span>NPR ${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                   <span style="color: #666;">Shipping Fee</span>
                   <span>${shippingFee === 0 ? 'FREE' : 'NPR ' + shippingFee.toFixed(2)}</span>
                </div>
                ${order.discount_applied ? `
                <div class="total-row" style="color: #ED872D;">
                   <span>Discount</span>
                   <span>- NPR ${Number(order.discount_applied).toFixed(2)}</span>
                </div>` : ''}
                <div class="total-row grand-total">
                   <span>Grand Total</span>
                   <span>NPR ${Number(order.total_amount).toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div class="footer-grid">
             <div class="signature-box">
                <div class="signature-value"></div>
                <div class="signature-line"></div>
                <div class="signature-label">Signature</div>
             </div>
             <div class="signature-box">
                <div class="signature-value">KIRANA E-STORE</div>
                <div class="signature-line"></div>
                <div class="signature-label">Name of Seller</div>
             </div>
             <div class="signature-box">
                <div class="signature-value">${new Date(order.created_at).toLocaleDateString()}</div>
                <div class="signature-line"></div>
                <div class="signature-label">Date of Purchase</div>
             </div>
             <div class="signature-box">
                <div class="signature-value" style="text-transform: capitalize;">${order.payment_method}</div>
                <div class="signature-line"></div>
                <div class="signature-label">Payment Option</div>
             </div>
          </div>

          <div class="terms">
             <strong>Terms and Conditions</strong><br/>
             1. Goods once sold will not be returned unless defective.<br/>
             2. Warranty claims require this invoice.<br/>
             3. All disputes are subject to Kathmandu jurisdiction.<br/>
             ..............................................................................................................
          </div>

          <div class="thanks">Thank you for shopping with KIRANA E-Store!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-brand-navy text-white flex-shrink-0">
         <div className="p-6 text-2xl font-bold tracking-tight">Admin<span className="text-brand-orange">Portal</span></div>
         <nav className="mt-4">
            <div onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><Package size={20}/> Dashboard</div>
            <div onClick={() => setActiveTab('products')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'products' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><ShoppingBag size={20}/> Products</div>
            <div onClick={() => setActiveTab('orders')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'orders' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><DollarSign size={20}/> Orders</div>
            <div onClick={() => setActiveTab('vouchers')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'vouchers' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><Ticket size={20}/> Vouchers</div>
            <div onClick={() => setActiveTab('reviews')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'reviews' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><MessageSquare size={20}/> Reviews</div>
            <div onClick={() => setActiveTab('settings')} className={`px-6 py-3 cursor-pointer flex items-center gap-3 ${activeTab === 'settings' ? 'bg-white/20 border-r-4 border-brand-orange' : ''}`}><Clock size={20}/> Settings</div>
         </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {activeTab === 'dashboard' && (
          <div>
             <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded shadow-sm border-l-4 border-brand-purple">
                 <div className="text-gray-500 uppercase text-xs font-bold">Total Sales</div>
                 <div className="text-2xl font-bold">NPR {Number(orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0)).toLocaleString()}</div>
               </div>
               <div className="bg-white p-6 rounded shadow-sm border-l-4 border-brand-orange">
                 <div className="text-gray-500 uppercase text-xs font-bold">Pending Orders</div>
                 <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
               </div>
               <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
                 <div className="text-gray-500 uppercase text-xs font-bold">Total Products</div>
                 <div className="text-2xl font-bold">{products.length}</div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'products' && (
           <div>
             {view === 'list' ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <button onClick={handleAddNewClick} className="bg-brand-navy text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-opacity-90"><Plus size={18}/> Add Product</button>
                  </div>
                  <div className="bg-white rounded shadow-sm overflow-hidden">
                     <div className="p-4 border-b flex items-center">
                        <Search className="text-gray-400 mr-2" size={18} />
                        <input placeholder="Search products..." className="outline-none w-full text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                     </div>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                           <tr><th className="px-6 py-3">Product</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Stock</th><th className="px-6 py-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody>
                           {filteredProducts.map(p => (
                             <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 flex items-center gap-3"><img src={p.image_url} className="w-8 h-8 rounded object-cover" />{p.name}</td>
                                <td className="px-6 py-4">NPR {Number(p.price).toFixed(2)}</td>
                                <td className="px-6 py-4">{p.stock_quantity}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                   <button onClick={() => handleEditClick(p)} className="text-blue-600 hover:underline">Edit</button>
                                   <button onClick={() => handleDeleteClick(p.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                </>
             ) : (
                <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">{isEditing ? 'Edit Product' : 'New Product'}</h2>
                      <button onClick={() => setView('list')}><X size={24} className="text-gray-400"/></button>
                   </div>
                   <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold mb-1">Name</label>
                         <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                      </div>
                      <div>
                         <label className="block text-sm font-bold mb-1">Description</label>
                         <textarea className="w-full border p-2 rounded" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-bold mb-1">Sale Price</label>
                            <input className="w-full border p-2 rounded" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required/>
                         </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">Original Price</label>
                            <input className="w-full border p-2 rounded" type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} placeholder="Show discount?"/>
                         </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">Stock</label>
                            <input className="w-full border p-2 rounded" type="number" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} required/>
                         </div>
                      </div>
                      <div><label className="block text-sm font-bold mb-1">Image URL</label><input className="w-full border p-2 rounded" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} required/></div>
                      <div>
                          <label className="block text-sm font-bold mb-1">Category</label>
                          <select className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                             <option value="Fresh Produce">Fresh Produce</option>
                             <option value="Bakery">Bakery</option>
                             <option value="Household">Household</option>
                             <option value="Beverages">Beverages</option>
                             <option value="Personal Care">Personal Care</option>
                          </select>
                      </div>
                      <div className="flex gap-6 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <div onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}>{formData.is_featured ? <CheckSquare className="text-brand-orange" /> : <Square />}</div>
                              <span>Featured</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <div onClick={() => setFormData({...formData, is_flash_sale: !formData.is_flash_sale})}>{formData.is_flash_sale ? <CheckSquare className="text-brand-orange" /> : <Square />}</div>
                              <span>Flash Sale</span>
                          </label>
                      </div>
                      <button type="submit" className="bg-brand-navy text-white px-6 py-2 rounded font-bold w-full mt-4" disabled={loading}>Save Product</button>
                   </form>
                </div>
             )}
           </div>
        )}

        {activeTab === 'orders' && (
           <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>
              <div className="bg-white rounded shadow-sm overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                       <tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Total</th><th className="px-6 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                       {orders.map(order => (
                          <tr key={order.id} className="border-b">
                             <td className="px-6 py-4 text-xs font-mono">{order.id.slice(0,8)}</td>
                             <td className="px-6 py-4"><b>{order.user_full_name}</b><br/><span className="text-xs text-gray-500">{order.user_email}</span></td>
                             <td className="px-6 py-4">
                                <select value={order.status} onChange={(e) => handleOrderStatus(order.id, e.target.value)} className="rounded border px-2 py-1 text-xs font-bold uppercase">
                                   <option value="pending">Pending</option>
                                   <option value="processing">Processing</option>
                                   <option value="delivered">Delivered</option>
                                   <option value="cancelled">Cancelled</option>
                                </select>
                             </td>
                             <td className="px-6 py-4 font-medium">NPR {Number(order.total_amount).toFixed(2)}</td>
                             <td className="px-6 py-4 text-right"><button onClick={() => handlePrintInvoice(order)} className="text-gray-600 hover:text-brand-navy"><Printer size={18}/></button></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'vouchers' && (
            <div>
               <h1 className="text-2xl font-bold text-gray-800 mb-6">Vouchers & Promos</h1>
               
               {/* Create Form */}
               <div className="bg-white p-6 rounded shadow-sm mb-8">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> Create New Voucher</h2>
                  <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                        <input className="w-full border p-2 rounded text-sm uppercase" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="SAVE20" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                        <select className="w-full border p-2 rounded text-sm" value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                           <option value="fixed">Fixed NPR</option>
                           <option value="percentage">Percentage %</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value</label>
                        <input className="w-full border p-2 rounded text-sm" type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="50" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Order</label>
                        <input className="w-full border p-2 rounded text-sm" type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="999" />
                     </div>
                     <button type="submit" className="bg-brand-navy text-white p-2 rounded font-bold hover:bg-brand-orange transition-colors h-[38px]">Create</button>
                  </form>
               </div>

               {/* Voucher List */}
               <div className="bg-white rounded shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                        <tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Value</th><th className="px-6 py-3">Min Order</th><th className="px-6 py-3 text-right">Actions</th></tr>
                     </thead>
                     <tbody>
                        {vouchers.map(v => (
                           <tr key={v.id} className="border-b">
                              <td className="px-6 py-4 font-bold text-brand-orange">{v.code}</td>
                              <td className="px-6 py-4">{v.discount_type === 'percentage' ? `${v.discount_value}%` : `NPR ${v.discount_value}`}</td>
                              <td className="px-6 py-4">NPR {v.min_order_amount}</td>
                              <td className="px-6 py-4 text-right">
                                 <button onClick={() => handleDeleteVoucher(v.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
        )}

        {activeTab === 'reviews' && (
            <div>
               <h1 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h1>
               <div className="space-y-4">
                  {reviews.length === 0 ? (
                      <div className="bg-white p-8 rounded text-center text-gray-400">No reviews found yet.</div>
                  ) : reviews.map(review => (
                      <div key={review.id} className="bg-white p-6 rounded shadow-sm">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-brand-navy uppercase">{review.user_name.charAt(0)}</div>
                               <div>
                                  <div className="font-bold">{review.user_name}</div>
                                  <div className="flex text-yellow-400">
                                     {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                                  </div>
                               </div>
                            </div>
                            <div className="text-xs text-gray-400">{review.date}</div>
                         </div>
                         <p className="text-gray-700 italic mb-4">"{review.comment}"</p>
                         
                         {review.reply ? (
                             <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                <div className="text-xs font-bold text-blue-800 uppercase mb-1">Store Reply:</div>
                                <p className="text-sm text-blue-700">{review.reply}</p>
                             </div>
                         ) : (
                             <div>
                                {activeReviewId === review.id ? (
                                    <div className="space-y-2 mt-4">
                                       <textarea 
                                          className="w-full border p-2 rounded text-sm outline-none focus:border-brand-orange" 
                                          placeholder="Write your response..."
                                          value={replyText}
                                          onChange={e => setReplyText(e.target.value)}
                                          rows={2}
                                       />
                                       <div className="flex gap-2">
                                          <button onClick={() => handleReplySubmit(review.id)} className="bg-brand-navy text-white px-4 py-1.5 rounded text-xs font-bold">Send Reply</button>
                                          <button onClick={() => setActiveReviewId(null)} className="text-gray-500 px-4 py-1.5 rounded text-xs">Cancel</button>
                                       </div>
                                    </div>
                                ) : (
                                    <button onClick={() => { setActiveReviewId(review.id); setReplyText(''); }} className="text-brand-orange text-xs font-bold flex items-center gap-1 hover:underline"><Reply size={14}/> Reply to customer</button>
                                )}
                             </div>
                         )}
                      </div>
                  ))}
               </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto">
               <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h1>
               
               <div className="bg-white p-6 rounded shadow-sm border-t-4 border-brand-orange">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={20}/> Flash Sale Management</h2>
                  <p className="text-sm text-gray-500 mb-6">Update the global countdown timer shown on the home page for flash sales.</p>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sale End Date & Time</label>
                        <input 
                           type="datetime-local" 
                           className="w-full border border-gray-300 rounded p-3 text-sm focus:border-brand-orange outline-none" 
                           value={flashSaleDate}
                           onChange={e => setFlashSaleDate(e.target.value)}
                        />
                     </div>
                     <button 
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="w-full bg-brand-navy text-white py-3 rounded font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                     >
                        <Save size={18}/> {loading ? 'Saving...' : 'Save Settings'}
                     </button>
                  </div>
               </div>

               <div className="bg-white p-6 rounded shadow-sm mt-8 opacity-60">
                  <h2 className="text-lg font-bold mb-4">Maintenance Mode</h2>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">Put store in maintenance mode?</span>
                     <div className="w-12 h-6 bg-gray-200 rounded-full cursor-not-allowed"></div>
                  </div>
               </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
