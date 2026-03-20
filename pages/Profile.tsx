
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, Save, ArrowLeft, Package, Printer, Clock, Check, X, XCircle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Order, OrderItem } from '../types';

interface ProfileProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
  } | null;
  onNavigate: (page: string) => void;
  onProfileUpdate: () => void;
}

// Extend OrderItem to include product image from the join
interface ExtendedOrderItem extends OrderItem {
  products?: {
    image_url: string;
  };
}

interface ProfileOrder extends Order {
  items: ExtendedOrderItem[];
}

// Visual Progress Component for Order Status
const OrderProgress = ({ status }: { status: string }) => {
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md border border-red-100 flex items-center gap-3 mb-6 text-sm">
        <XCircle size={20} className="flex-shrink-0" />
        <div>
          <span className="font-bold">Order Cancelled</span>
          <p className="text-red-600 text-xs mt-0.5">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Placed', active: ['pending', 'processing', 'delivered'].includes(status) },
    { label: 'Processing', active: ['processing', 'delivered'].includes(status) },
    { label: 'Delivered', active: ['delivered'].includes(status) },
  ];

  let progressWidth = '0%';
  if (status === 'processing') progressWidth = '50%';
  if (status === 'delivered') progressWidth = '100%';

  return (
    <div className="mb-8 px-2 md:px-6 mt-2">
       <div className="relative flex justify-between items-center">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
          
          {/* Active Progress Line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded transition-all duration-500"
            style={{ width: progressWidth }}
          ></div>

          {/* Steps */}
          {steps.map((step, idx) => (
             <div key={idx} className="flex flex-col items-center bg-white px-2">
                <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        step.active 
                        ? 'bg-green-500 border-green-500 text-white shadow-sm scale-110' 
                        : 'bg-white border-gray-300 text-gray-300'
                    }`}
                >
                   {step.active ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <span className={`text-xs mt-2 font-bold uppercase tracking-wide ${step.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                </span>
             </div>
          ))}
       </div>
    </div>
  )
}

const Profile: React.FC<ProfileProps> = ({ user, onNavigate, onProfileUpdate }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Track expanded order details
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    // Fetch orders and join order_items, then join products to get images
    const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (data) {
        const formatted = data.map((o: any) => ({
            ...o,
            items: o.order_items
        }));
        setOrders(formatted);
    }
    setLoadingOrders(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      onProfileUpdate(); // Trigger refresh in App.tsx
    } catch (err: any) {
      console.error("Profile update error:", err);
      if (err.message && err.message.includes('Could not find the')) {
         setMessage({ type: 'error', text: "Database Error: Missing columns. Please run the SQL commands provided in db_schema.txt" });
      } else {
         setMessage({ 
           type: 'error', 
           text: err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 'Failed to update profile' 
         });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    setLoadingOrders(true);
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);
        
        if (error) throw error;
        
        // Refresh orders list
        await fetchOrders(); 
    } catch (err: any) {
        alert("Error cancelling order: " + err.message);
    } finally {
        setLoadingOrders(false);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const handlePrintInvoice = (order: ProfileOrder) => {
    const printWindow = window.open('', '', 'height=800,width=900');
    if (!printWindow) return;

    // Calculate totals correctly based on actual items
    const subtotal = Number(order.items?.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0);
    // Derive shipping fee from the total paid minus item costs and plus any discount applied
    const shippingFee = Math.max(0, Number(order.total_amount || 0) - subtotal + Number(order.discount_applied || 0));
    
    // Clean address if it contains labels
    const displayAddress = order.shipping_address?.includes('Address:') 
        ? order.shipping_address.split('Address:')[1]?.trim() 
        : order.shipping_address?.replace(/\n/g, ', ');

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
                <div class="company-name">Sunshine E-Store</div>
                <div class="company-address">123 Market Street, City Center</div>
                <div class="company-address">Kathmandu, Nepal</div>
                <div class="company-address">support@sunshinestore.com | +977-1-4XXXXXX</div>
             </div>
          </div>

          <div class="bill-to-section">
            <div class="section-title">Bill To</div>
            <div class="client-grid">
               <div class="client-field">
                  <span class="field-label">Client Name</span>
                  <span class="field-value">${user?.full_name || 'Valued Customer'}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Email</span>
                  <span class="field-value">${user?.email}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Address</span>
                  <span class="field-value">${displayAddress || 'N/A'}</span>
               </div>
               <div class="client-field">
                  <span class="field-label">Phone Number</span>
                  <span class="field-value">${user?.phone_number || 'N/A'}</span>
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
                <div class="signature-value">Sunshine Seller</div>
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

          <div class="thanks">Thank you for shopping with Sunshine E-Store!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center text-gray-600 mb-6 hover:text-brand-orange transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Home
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 bg-brand-navy rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
                        {fullName ? fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 text-center">{fullName || 'User'}</h1>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded mb-4 text-xs ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <Mail size={12} /> Email
                        </label>
                        <input 
                            type="email" 
                            value={user.email} 
                            disabled 
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-500 text-sm cursor-not-allowed"
                        />
                        </div>

                        <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <User size={12} /> Full Name
                        </label>
                        <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-brand-purple focus:border-transparent outline-none text-sm"
                        />
                        </div>

                        <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <Phone size={12} /> Phone Number
                        </label>
                        <input 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-brand-purple focus:border-transparent outline-none text-sm"
                        />
                        </div>

                        <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-orange text-white py-2 rounded font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
                        >
                        {loading ? 'Saving...' : <><Save size={14} /> Update Profile</>}
                        </button>
                    </form>
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Package size={20} className="text-brand-purple"/> My Orders
                    </h2>
                    
                    {loadingOrders ? (
                        <div className="text-center py-8 text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-200">
                            <Package size={40} className="mx-auto text-gray-300 mb-2"/>
                            <p className="text-gray-500">No orders found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map(order => (
                                <div key={order.id} className="border border-gray-100 rounded-sm hover:border-brand-purple transition-colors">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded border border-gray-200">
                                                <Clock size={16} className="text-brand-orange"/>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-500 uppercase">Order Placed</div>
                                                <div className="text-sm font-bold text-gray-800">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-gray-500 uppercase">Total Paid</div>
                                            <div className="text-sm font-bold text-brand-navy">NPR {Number(order.total_amount).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <OrderProgress status={order.status} />

                                        <div className="space-y-2 mb-6">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                                             <img 
                                                               src={item.products?.image_url || 'https://via.placeholder.com/40'} 
                                                               alt={item.name} 
                                                               className="w-full h-full object-cover"
                                                               onError={(e) => e.currentTarget.style.display = 'none'} 
                                                             />
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-800 font-medium">{item.name}</div>
                                                            <div className="text-gray-400 text-xs">{item.quantity} x NPR {Number(item.price).toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-gray-700">NPR {(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {expandedOrderId === order.id && (
                                          <div className="bg-gray-50 p-4 rounded mb-4 text-sm animate-fade-in border border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-1"><MapPin size={14}/> Shipping Address</h4>
                                                <p className="text-gray-600 whitespace-pre-wrap">{order.shipping_address}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-bold text-gray-700 mb-2">Payment Details</h4>
                                                <p className="text-gray-600"><span className="font-medium">Method:</span> <span className="uppercase">{order.payment_method}</span></p>
                                                {order.payment_details && <p className="text-gray-600"><span className="font-medium">Info:</span> {order.payment_details}</p>}
                                                <p className="text-gray-600"><span className="font-medium">Order ID:</span> {order.id.slice(0, 8)}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                  onClick={() => toggleOrderDetails(order.id)}
                                                  className="text-gray-500 hover:text-brand-navy text-xs font-bold flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded transition-colors"
                                                >
                                                  {expandedOrderId === order.id ? <><ChevronUp size={14}/> Hide Details</> : <><ChevronDown size={14}/> View Details</>}
                                                </button>

                                                {order.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        <X size={14} /> Cancel
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => handlePrintInvoice(order)}
                                                    className="text-brand-navy hover:text-brand-orange text-xs font-bold flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    <Printer size={14}/> Invoice
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
