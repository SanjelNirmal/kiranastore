
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CartItem } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Banknote, QrCode, MapPin, Tag, Copy, Smartphone } from 'lucide-react';
// @ts-ignore
import CryptoJS from 'crypto-js';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onNavigate: (page: string) => void;
  onCheckout: () => void;
  user: { id: string; email: string; full_name?: string; phone_number?: string } | null;
}

type CheckoutStep = 'cart' | 'payment' | 'success';

const Cart: React.FC<CartProps> = ({ cartItems, onUpdateQuantity, onRemove, onNavigate, onCheckout, user }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'esewa_manual' | 'esewa_direct' | 'cod' | null>(null);
  
  // Checkout Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{total: number, method: string} | null>(null);
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Robust calculation to ensure subtotal is always a Number
  const subtotal = Number(cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0) || 0);
  
  // Free shipping threshold logic
  const shippingThreshold = 999;
  const shipping = subtotal >= shippingThreshold ? 0 : 150;
  
  const totalBeforeDiscount = subtotal + shipping;
  const total = Math.max(0, totalBeforeDiscount - Number(appliedDiscount || 0));

  // Pre-fill user details when entering payment step
  useEffect(() => {
    if (user && step === 'payment') {
      if (!fullName && user.full_name) setFullName(user.full_name);
      if (!phoneNumber && user.phone_number) setPhoneNumber(user.phone_number);
    }
  }, [user, step]);

  const handleApplyVoucher = async () => {
      setVoucherMessage(null);
      if(!voucherCode.trim()) return;

      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if(error || !data) {
          setVoucherMessage({type: 'error', text: 'Invalid or expired voucher code.'});
          toast('error', 'Invalid voucher');
          setAppliedDiscount(0);
          return;
      }

      // Check min order amount
      if (subtotal < Number(data.min_order_amount)) {
          setVoucherMessage({type: 'error', text: `Minimum order of NPR ${data.min_order_amount} required.`});
          setAppliedDiscount(0);
          return;
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_type === 'percentage') {
          discount = (subtotal * Number(data.discount_value)) / 100;
      } else {
          discount = Number(data.discount_value);
      }

      setAppliedDiscount(discount);
      setVoucherMessage({type: 'success', text: `Voucher applied! You saved NPR ${discount.toFixed(2)}`});
      toast('success', 'Voucher Applied!');
  };

  const handleProceedToPayment = () => {
    if (!user) {
      toast('error', "Please login to proceed to checkout.");
      onNavigate('login');
      return;
    }
    setStep('payment');
    window.scrollTo(0, 0);
  };

  // --- eSewa V2 Integration Helper ---
  const generateSignature = (totalAmount: string, transactionUuid: string, productCode: string) => {
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const secret = "8gBm/:&EnhH.1/q"; // Standard EPAYTEST secret key
    const hash = CryptoJS.HmacSHA256(signatureString, secret);
    const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
    return hashInBase64;
  };

  const postToEsewa = (params: any) => {
    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
    form.setAttribute("target", "_self");
  
    for (const key in params) {
      const hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", key);
      hiddenField.setAttribute("value", params[key]);
      form.appendChild(hiddenField);
    }
  
    document.body.appendChild(form);
    form.submit();
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!fullName.trim()) return toast('error', "Please enter your full name.");
    if (!phoneNumber.trim()) return toast('error', "Please enter your contact number.");
    if (!address.trim()) return toast('error', "Please enter your shipping address.");
    if (!paymentMethod) return toast('error', "Please select a payment method.");
    if (paymentMethod === 'esewa_manual' && !transactionId.trim()) return toast('error', "Please enter the Transaction ID from your payment.");

    setIsProcessing(true);

    try {
      if (!user?.id) throw new Error("User not authenticated");

      // 1. ATOMIC STOCK CHECK & DECREMENT using RPC
      const orderItemsForRpc = cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
      }));

      const { error: stockError } = await supabase.rpc('decrement_stock', { 
          order_items: orderItemsForRpc 
      });

      if (stockError) {
          throw new Error("Inventory check failed: " + (stockError.message || "Insufficient stock"));
      }

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phoneNumber })
        .eq('id', user.id);
      
      if (profileError) console.warn("Could not update profile stats", profileError);

      // 3. Create Order
      const fullShippingDetails = `
Name: ${fullName}
Phone: ${phoneNumber}
Address: ${address}
      `.trim();

      let paymentDetailsStr = 'Cash on Delivery';
      if (paymentMethod === 'esewa_manual') paymentDetailsStr = `Transaction ID: ${transactionId}`;
      if (paymentMethod === 'esewa_direct') paymentDetailsStr = 'Pending eSewa Gateway Payment';

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          payment_method: paymentMethod,
          payment_details: paymentDetailsStr,
          shipping_address: fullShippingDetails,
          discount_applied: appliedDiscount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items
      if (orderData) {
        const orderItems = cartItems.map(item => ({
          order_id: orderData.id,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        // --- DIRECT ESEWA REDIRECT ---
        if (paymentMethod === 'esewa_direct') {
            const productCode = 'EPAYTEST';
            const signature = generateSignature(total.toString(), orderData.id, productCode);

            const esewaParams = {
                amount: total,
                tax_amount: 0,
                total_amount: total,
                transaction_uuid: orderData.id,
                product_code: productCode,
                product_service_charge: 0,
                product_delivery_charge: 0,
                success_url: `${window.location.origin}/?payment_gateway=esewa_direct`,
                failure_url: `${window.location.origin}/?payment_gateway=esewa_direct&status=failure`,
                signed_field_names: 'total_amount,transaction_uuid,product_code',
                signature: signature,
            };
            
            toast('info', 'Redirecting to eSewa...');
            postToEsewa(esewaParams);
            return;
        }

        // --- MANUAL / COD SUCCESS FLOW ---
        setLastOrderDetails({ total: total, method: paymentMethod });
        setStep('success');
        toast('success', "Order placed successfully!");
        onCheckout();
      }

    } catch (err: any) {
      console.error("Order failed:", err);
      let errorMessage = "Unknown error occurred";
      if (typeof err === 'string') errorMessage = err;
      else if (err instanceof Error) errorMessage = err.message;
      else if (err.message) errorMessage = err.message;

      toast('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard!');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            {lastOrderDetails?.method === 'esewa_manual' 
              ? "Your payment is under verification. We will process your order shortly." 
              : "Your order has been sent to the store admin for verification."}
          </p>
          
          <div className="text-sm bg-gray-50 p-4 rounded mb-6 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-bold text-brand-navy capitalize">
                {lastOrderDetails?.method === 'esewa_manual' ? 'QR Scan & Pay' : 
                 lastOrderDetails?.method === 'esewa_direct' ? 'eSewa Direct' : 'Cash On Delivery'}
              </span>
            </div>
            <div className="flex justify-between text-lg border-t border-gray-200 pt-2 mt-2">
              <span className="font-bold text-gray-800">Total Amount:</span>
              <span className="font-bold text-brand-orange">NPR {lastOrderDetails?.total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setStep('cart');
              onNavigate('home');
            }}
            className="bg-brand-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-600 w-full transition-colors shadow-md"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <button 
            onClick={() => step === 'payment' ? setStep('cart') : onNavigate('home')} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          {step === 'cart' ? `Shopping Cart (${cartItems.length} items)` : 'Checkout Details'}
        </h1>

        {cartItems.length === 0 && step === 'cart' ? (
          <div className="bg-white p-12 rounded shadow-sm text-center">
             <div className="flex justify-center mb-4 text-gray-300">
               <ShoppingBag size={64} />
             </div>
             <p className="text-lg text-gray-500 mb-4">Your cart is empty</p>
             <button 
               onClick={() => onNavigate('home')} 
               className="bg-brand-orange text-white px-6 py-2 rounded font-bold hover:bg-orange-600"
             >
               Start Shopping
             </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {step === 'cart' && (
                <div className="bg-white rounded shadow-sm overflow-hidden">
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Total</div>
                  </div>

                  {cartItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b last:border-0 items-center">
                      <div className="col-span-1 md:col-span-6 flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{item.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                          <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs transition-colors">
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-2 md:gap-0">
                        <span className="md:hidden text-xs font-bold text-gray-500">Price: </span>
                        <span className="text-sm font-medium text-gray-800">NPR {Number(item.price).toFixed(2)}</span>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center items-center">
                        <div className="flex items-center border rounded-sm">
                          <button onClick={() => onUpdateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-2 md:gap-0">
                        <span className="md:hidden text-xs font-bold text-gray-500">Total: </span>
                        <span className="text-sm font-bold text-brand-orange">NPR {(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <div className="bg-white rounded shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <MapPin size={20} className="text-brand-orange"/> Delivery Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                          <input 
                               type="text" 
                               value={fullName}
                               onChange={(e) => setFullName(e.target.value)}
                               className="w-full p-2.5 border border-gray-300 rounded text-sm outline-none"
                               placeholder="Enter full name"
                           />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                           <input 
                               type="tel" 
                               value={phoneNumber}
                               onChange={(e) => setPhoneNumber(e.target.value)}
                               className="w-full p-2.5 border border-gray-300 rounded text-sm outline-none"
                               placeholder="98XXXXXXXX"
                           />
                       </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Shipping Address</label>
                      <textarea 
                        className="w-full border border-gray-300 rounded p-3 text-sm outline-none"
                        rows={3}
                        placeholder="Detailed address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <div className="bg-white rounded shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Select Payment Method</h2>
                    <div className="space-y-4">
                      <label className={`block border rounded cursor-pointer transition-all overflow-hidden ${paymentMethod === 'esewa_manual' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-start p-4">
                          <input type="radio" name="payment" value="esewa_manual" checked={paymentMethod === 'esewa_manual'} onChange={() => setPaymentMethod('esewa_manual')} className="mt-1 mr-4 w-4 h-4"/>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center text-white"><QrCode size={20} /></div>
                              <div>
                                <div className="font-bold text-gray-800">Scan & Pay (eSewa / Fonepay)</div>
                                <p className="text-xs text-gray-500">Scan QR to pay directly from your mobile banking app.</p>
                              </div>
                            </div>
                            
                            {paymentMethod === 'esewa_manual' && (
                                <div className="mt-4 bg-white p-4 rounded border border-green-200 animate-fade-in">
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="bg-white p-2 shadow-sm border border-gray-100 rounded">
                                            <img src={`https://raw.githubusercontent.com/redmiroshan07-cpu/imageonly/refs/heads/main/Screenshot%202026-03-20%20160944.png`} alt="Payment QR" className="w-32 h-32" />
                                        </div>
                                        <div className="flex-1 text-sm space-y-2">
                                            <p className="font-bold text-gray-700">Scan using eSewa or Mobile Banking</p>
                                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                                <span className="text-gray-500">Merchant:</span>
                                                <span className="font-medium">KIRANA E-Store</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-1">
                                                <span className="text-gray-500">Amount:</span>
                                                <span className="font-bold text-brand-orange">NPR {total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Transaction ID / Reference Code <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-green-500"
                                            placeholder="Enter transaction ID"
                                        />
                                    </div>
                                </div>
                            )}
                          </div>
                        </div>
                      </label>

                      <label className={`block border rounded cursor-pointer transition-all overflow-hidden ${paymentMethod === 'esewa_direct' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-start p-4">
                            <input type="radio" name="payment" value="esewa_direct" checked={paymentMethod === 'esewa_direct'} onChange={() => setPaymentMethod('esewa_direct')} className="mt-1 mr-4 w-4 h-4"/>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center text-white"><Smartphone size={20} /></div>
                                    <div>
                                        <div className="font-bold text-gray-800">Pay with eSewa</div>
                                        <p className="text-xs text-gray-500">Secure direct payment with eSewa account.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </label>

                      <label className={`flex items-center p-4 border rounded cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand-orange bg-orange-50' : 'border-gray-200'}`}>
                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mr-4 w-4 h-4"/>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-orange rounded flex items-center justify-center text-white"><Banknote size={20} /></div>
                          <div>
                            <div className="font-bold text-gray-800">Cash on Delivery</div>
                            <p className="text-xs text-gray-500">Pay when your order reaches your door.</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-80">
              <div className="bg-white p-6 rounded shadow-sm sticky top-24">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
                
                {step === 'cart' && (
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <input 
                                className="border border-gray-300 rounded p-2 text-sm flex-1 uppercase outline-none focus:border-brand-orange" 
                                placeholder="Voucher Code"
                                value={voucherCode}
                                onChange={e => setVoucherCode(e.target.value)}
                            />
                            <button onClick={handleApplyVoucher} className="bg-gray-800 text-white px-3 rounded text-xs font-bold hover:bg-gray-700">APPLY</button>
                        </div>
                        {voucherMessage && (
                            <p className={`text-xs mt-1 ${voucherMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                {voucherMessage.text}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-between mb-3 text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>NPR {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between mb-3 text-sm text-gray-600">
                  <span>Shipping Fee</span>
                  <div className="flex items-center gap-1">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-1 rounded border border-green-200">FREE</span>
                    ) : (
                      <span>NPR {shipping.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {appliedDiscount > 0 && (
                     <div className="flex justify-between mb-3 text-sm text-green-600 font-medium">
                        <span className="flex items-center gap-1"><Tag size={12}/> Discount</span>
                        <span>- NPR {Number(appliedDiscount).toFixed(2)}</span>
                     </div>
                )}

                <div className="border-t pt-4 mb-6 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-xl text-brand-orange">NPR {total.toFixed(2)}</span>
                </div>

                {step === 'cart' ? (
                  <button 
                    onClick={handleProceedToPayment}
                    className="w-full bg-brand-orange text-white py-3 rounded font-bold hover:bg-orange-600 shadow-md transition-colors"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                ) : (
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className={`w-full text-white py-3 rounded font-bold shadow-md transition-colors ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-navy hover:bg-opacity-90'}`}
                  >
                    {isProcessing 
                        ? 'PROCESSING...' 
                        : (paymentMethod === 'esewa_direct' ? 'PAY WITH ESEWA' : 'PLACE ORDER')
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
