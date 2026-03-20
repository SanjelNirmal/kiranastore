
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ChevronRight, FileText, Shield, Users, HelpCircle, Briefcase } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Translate from '../components/Translate';

interface InfoPagesProps {
  pageId: string;
  onNavigate: (page: string) => void;
}

const InfoPages: React.FC<InfoPagesProps> = ({ pageId, onNavigate }) => {
  
  const renderContent = () => {
    switch (pageId) {
      case 'about':
        return <AboutUs />;
      case 'careers':
        return <Careers />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsConditions />;
      case 'help':
        return <HelpCenter />;
      case 'how-to-buy':
        return <HowToBuy />;
      case 'returns':
        return <ReturnsRefunds />;
      case 'contact':
        return <ContactUs />;
      default:
        return <div>Page not found</div>;
    }
  };

  const getTitle = () => {
    switch(pageId) {
        case 'about': return 'About Us';
        case 'careers': return 'Careers';
        case 'privacy': return 'Privacy Policy';
        case 'terms': return 'Terms & Conditions';
        case 'help': return 'Help Center';
        case 'how-to-buy': return 'How to Buy';
        case 'returns': return 'Returns & Refunds';
        case 'contact': return 'Contact Us';
        default: return 'Information';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: getTitle(), isActive: true }]} />
      <div className="container mx-auto px-4 mt-4">
        <div className="bg-white rounded-sm shadow-sm p-8 min-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const AboutUs = () => (
  <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold text-brand-navy mb-6 flex items-center gap-2">
      <Users className="text-brand-orange" /> <Translate text="About Us" />
    </h1>
    <div className="prose max-w-none text-gray-600 space-y-4">
      <p className="text-lg font-medium text-gray-800">
        <Translate text="Welcome to Sunshine E-Store, Nepal's premier hyper-local marketplace connecting you directly with neighborhood sellers." />
      </p>
      <p>
        <Translate text="Founded in 2024, Sunshine E-Store began with a simple mission: to bridge the gap between local vendors and modern digital consumers. We believe in the power of community commerce, where buying your daily essentials supports the local economy." />
      </p>
      <p>
        <Translate text="Our platform offers a diverse range of products including fresh organic produce, bakery items, household essentials, and personal care products. Unlike traditional e-commerce giants, we prioritize speed and freshness, often delivering within hours of order placement." />
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-4 bg-gray-50 rounded border border-gray-100 text-center">
            <h3 className="font-bold text-brand-navy text-xl mb-2">100%</h3>
            <p className="text-sm">Local Sourcing</p>
        </div>
        <div className="p-4 bg-gray-50 rounded border border-gray-100 text-center">
            <h3 className="font-bold text-brand-navy text-xl mb-2">24h</h3>
            <p className="text-sm">Fast Delivery</p>
        </div>
        <div className="p-4 bg-gray-50 rounded border border-gray-100 text-center">
            <h3 className="font-bold text-brand-navy text-xl mb-2">5k+</h3>
            <p className="text-sm">Happy Customers</p>
        </div>
      </div>
    </div>
  </div>
);

const Careers = () => (
  <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold text-brand-navy mb-6 flex items-center gap-2">
      <Briefcase className="text-brand-orange" /> <Translate text="Careers at Sunshine" />
    </h1>
    <p className="text-gray-600 mb-8">
      <Translate text="Join our team and help us revolutionize the local shopping experience. We are always looking for passionate individuals to join our growing family." />
    </p>

    <div className="space-y-4">
      {['Stock Manager', 'Logistics Coordinator', 'Customer Support Specialist'].map((job, i) => (
        <div key={i} className="border border-gray-200 rounded p-6 flex justify-between items-center hover:border-brand-orange transition-colors group cursor-pointer">
          <div>
            <h3 className="font-bold text-gray-800 text-lg group-hover:text-brand-orange">{job}</h3>
            <p className="text-sm text-gray-500">Lalitpur, Nepal • Full-time</p>
          </div>
          <button className="bg-brand-navy text-white px-4 py-2 rounded text-sm font-bold">Apply Now</button>
        </div>
      ))}
    </div>
    <div className="mt-8 p-4 bg-blue-50 rounded text-sm text-blue-800">
      <Translate text="Don't see a position that fits? Send your CV to redmi.roshan07@gmail.com or desharprabesh@gmail.com" />
    </div>
  </div>
);

const HelpCenter = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-navy mb-6 flex items-center gap-2">
        <HelpCircle className="text-brand-orange" /> <Translate text="Help Center" />
      </h1>
      <div className="space-y-6">
        {[
            { q: "How do I reset my password?", a: "Go to the login page and click on 'Forgot Password'. Follow the email instructions." },
            { q: "What areas do you deliver to?", a: "Currently, we serve the entire Kathmandu Valley (Kathmandu, Bhaktapur, Lalitpur)." },
            { q: "Can I cancel my order?", a: "Yes, you can cancel your order from the 'My Profile' > 'Orders' section as long as the status is 'Pending'." }
        ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">{item.q}</h3>
                <p className="text-gray-600 text-sm">{item.a}</p>
            </div>
        ))}
      </div>
    </div>
);

const HowToBuy = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-navy mb-6"><Translate text="How to Buy" /></h1>
      <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {[
            { step: 1, title: "Search for Products", desc: "Use the search bar or browse categories to find what you need." },
            { step: 2, title: "Add to Cart", desc: "Select the quantity and click 'Add to Cart'." },
            { step: 3, title: "Review Cart", desc: "Go to your cart to check the items and total price." },
            { step: 4, title: "Checkout & Pay", desc: "Enter your delivery details and choose eSewa or Cash on Delivery." },
            { step: 5, title: "Delivery", desc: "Relax! Our team will verify and deliver your order to your doorstep." }
        ].map((item, i) => (
            <div key={i} className="relative pl-12">
                <div className="absolute left-0 top-0 w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
            </div>
        ))}
      </div>
    </div>
);

const ReturnsRefunds = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-navy mb-6"><Translate text="Returns & Refunds" /></h1>
      <div className="prose max-w-none text-gray-600">
        <p>At KIRANA E-Store, we strive to ensure you are satisfied with your purchase. If you receive a defective or incorrect item, you may request a return within <strong>7 days</strong> of delivery.</p>
        
        <h3 className="font-bold text-gray-800 mt-6 mb-2">Eligibility for Returns</h3>
        <ul className="list-disc pl-5 space-y-2">
            <li>Item must be unused and in the same condition that you received it.</li>
            <li>Item must be in the original packaging.</li>
            <li>Perishable goods (Fresh Produce) must be reported within 24 hours.</li>
        </ul>

        <h3 className="font-bold text-gray-800 mt-6 mb-2">Refund Process</h3>
        <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to your original payment method or as store credit within 5-7 business days.</p>
      </div>
    </div>
);

const PrivacyPolicy = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-navy mb-6 flex items-center gap-2">
         <Shield className="text-brand-orange" /> <Translate text="Privacy Policy" />
      </h1>
      <div className="prose max-w-none text-sm text-gray-600 space-y-4">
        <p className="italic text-xs">Last updated: August 2024</p>
        <p>KIRANA E-Store ("we", "our", "us") respects your privacy and is committed to protecting your personal data.</p>
        
        <h3 className="font-bold text-gray-800">1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact customer support. This includes name, email address, phone number, and shipping address.</p>

        <h3 className="font-bold text-gray-800">2. How We Use Your Information</h3>
        <p>We use your information to process transactions, send order updates, improve our services, and detect fraud.</p>

        <h3 className="font-bold text-gray-800">3. Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access or disclosure.</p>
      </div>
    </div>
);

const TermsConditions = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-navy mb-6 flex items-center gap-2">
         <FileText className="text-brand-orange" /> <Translate text="Terms & Conditions" />
      </h1>
      <div className="prose max-w-none text-sm text-gray-600 space-y-4">
        <p>By accessing or using the KIRANA E-Store website, you agree to be bound by these Terms and Conditions.</p>
        
        <h3 className="font-bold text-gray-800">1. Use of Service</h3>
        <p>You must be at least 18 years old to use this service. You agree not to use the service for any illegal or unauthorized purpose.</p>

        <h3 className="font-bold text-gray-800">2. Products and Pricing</h3>
        <p>All products are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice.</p>

        <h3 className="font-bold text-gray-800">3. Limitation of Liability</h3>
        <p>KIRANA E-Store shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
      </div>
    </div>
);

const ContactUs = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
                <h1 className="text-3xl font-bold text-brand-navy mb-6"><Translate text="Contact Us" /></h1>
                <p className="text-gray-600 mb-8">Have a question or feedback? We'd love to hear from you. Fill out the form or reach out via our direct channels.</p>
                
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-brand-orange/10 p-3 rounded-full text-brand-orange">
                            <Phone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Phone</h3>
                            <p className="text-gray-600">+977 9867071985</p>
                            <p className="text-gray-500 text-xs">Mon-Fri, 9am - 6pm</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                        <div className="bg-brand-orange/10 p-3 rounded-full text-brand-orange">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Email</h3>
                            <p className="text-gray-600">redmi.roshan07@gmail.com</p>
                            <p className="text-gray-600">desharprabesh@gmail.com</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="bg-brand-orange/10 p-3 rounded-full text-brand-orange">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Office</h3>
                            <p className="text-gray-600">cHAPAGAUN 11</p>
                            <p className="text-gray-600">Lalitpur, Nepal</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Send a Message</h2>
                {sent ? (
                    <div className="bg-green-100 text-green-700 p-4 rounded text-center">
                        Message sent successfully! We'll get back to you soon.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                            <input className="w-full border p-2 rounded focus:outline-none focus:border-brand-orange" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                            <input type="email" className="w-full border p-2 rounded focus:outline-none focus:border-brand-orange" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                            <input className="w-full border p-2 rounded focus:outline-none focus:border-brand-orange" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                            <textarea rows={4} className="w-full border p-2 rounded focus:outline-none focus:border-brand-orange" required></textarea>
                        </div>
                        <button className="w-full bg-brand-navy text-white py-2 rounded font-bold hover:bg-opacity-90 flex items-center justify-center gap-2">
                            <Send size={16} /> Send Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default InfoPages;
