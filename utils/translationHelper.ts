
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const CACHE_PREFIX = 'sunshine_trans_';

// Fallback Dictionary for static UI elements (English -> Nepali)
// This ensures core UI works even if the API key is blocked or over quota
const DICTIONARY: Record<string, string> = {
  "Become a Seller": "विक्रेता बन्नुहोस्",
  "Help & Support": "सहयोग र समर्थन",
  "Download App": "एप डाउनलोड गर्नुहोस्",
  "Follow us on": "हामीलाई पछ्याउनुहोस्",
  "Search by title, description...": "शीर्षक, विवरण द्वारा खोज्नुहोस्...",
  "उत्पादनहरू खोज्नुहोस्...": "उत्पादनहरू खोज्नुहोस्...", // Self reference check
  "Login / Register": "लगइन / दर्ता",
  "Sign In": "साइन इन",
  "Hello,": "नमस्ते,",
  "My Account": "मेरो खाता",
  "Admin Panel": "एडमिन प्यानल",
  "Admin Dashboard": "एडमिन ड्यासबोर्ड",
  "My Profile": "मेरो प्रोफाइल",
  "Logout": "लगआउट",
  "Categories": "कोटीहरू",
  "Fresh Produce": "ताजा उत्पादन",
  "Bakery": "बेकरी",
  "Beverages": "पेय पदार्थ",
  "Household": "घरायसी",
  "Personal Care": "व्यक्तिगत हेरचाह",
  "Manage Inventory": "इन्भेन्टरी व्यवस्थापन",
  "Home": "गृहपृष्ठ",
  "Cart": "कार्ट",
  "Wishlist": "विशलिस्ट",
  "Add to Cart": "कार्टमा थप्नुहोस्",
  "Buy Now": "अहिले किन्नुहोस्",
  "No Brand": "कुनै ब्रान्ड छैन",
  "Ratings": "मूल्याङ्कनहरू",
  "Add to Wishlist": "विशलिस्टमा थप्नुहोस्",
  "Product Details": "उत्पादन विवरण",
  "Ratings & Reviews": "मूल्याङ्कन र समीक्षाहरू",
  "Add your review": "तपाईंको समीक्षा थप्नुहोस्",
  "Your Rating": "तपाईंको मूल्याङ्कन",
  "Submit Review": "समीक्षा पेश गर्नुहोस्",
  "Please": "कृपया",
  "login": "लगइन",
  "to write a review.": "समीक्षा लेख्न।",
  "Delivery Options": "डेलिभरी विकल्पहरू",
  "Standard Delivery": "मानक डेलिभरी",
  "Days": "दिनहरू",
  "7 Days Return": "७ दिन फिर्ता",
  "Change of mind is not applicable": "मन परिवर्तन लागू हुँदैन",
  "Warranty": "वारेन्टी",
  "Warranty not available": "वारेन्टी उपलब्ध छैन",
  "Flash Sale": "फ्लास सेल",
  "Shop All": "सबै किनमेल गर्नुहोस्",
  "New Launch": "नयाँ लन्च",
  "Featured Products": "विशेष उत्पादनहरू",
  "Editor's Pick": "सम्पादकको रोजाइ",
  "Top Rated": "उच्च मूल्याङ्कन गरिएको",
  "Just For You": "तपाईंको लागि मात्र",
  "Load More": "थप लोड गर्नुहोस्",
  "Sort By": "क्रमबद्ध गर्नुहोस्",
  "Filter Results": "नतिजा फिल्टर गर्नुहोस्",
  "Related Categories": "सम्बन्धित कोटीहरू",
  "Price Range": "मूल्य दायरा",
  "Rating": "मूल्याङ्कन",
  "APPLY": "लागू गर्नुहोस्",
  "Search results for": "खोज नतिजाहरू",
  "items found": "वस्तुहरू फेला पर्यो",
  "Welcome to Sunshine Store!": "सनशाइन स्टोरमा स्वागत छ!",
  "The store is currently empty. Please login as Admin to add products.": "स्टोर हाल खाली छ। कृपया उत्पादनहरू थप्न एडमिनको रूपमा लगइन गर्नुहोस्।",
  "From Same Store": "एउटै पसलबाट",
  "Brand": "ब्रान्ड",
  "Clear Filters": "फिल्टर हटाउनुहोस्",
  "No products found matching your criteria.": "तपाईंको मापदण्डसँग मेल खाने कुनै उत्पादन फेला परेन।",
  "No products found in this category.": "यस कोटीमा कुनै उत्पादन फेला परेन।",
  "No other products in this category": "यस कोटीमा अन्य कुनै उत्पादन छैन",
  "No reviews yet. Be the first to review this product!": "अहिलेसम्म कुनै समीक्षा छैन। यो उत्पादन समीक्षा गर्ने पहिलो हुनुहोस्!",
  "No description available for this product.": "यस उत्पादनको लागि कुनै विवरण उपलब्ध छैन।",
  "Customer Care": "ग्राहक सेवा",
  "Help Center": "सहायता केन्द्र",
  "How to Buy": "कसरी किन्ने",
  "Returns & Refunds": "फिर्ता र रिफन्ड",
  "Contact Us": "सम्पर्क गर्नुहोस्",
  "About Us": "हाम्रो बारेमा",
  "Careers": "रोजगारी अवसरहरू",
  "Privacy Policy": "गोपनीयता नीति",
  "Terms & Conditions": "नियम र सर्तहरू",
  "Payment Methods": "भुक्तानी विधिहरू",
  "Your trusted hyper-local marketplace. Fresh products, real-time inventory, and same-day pickup from your neighborhood store.": "तपाईंको विश्वसनीय स्थानीय बजार। ताजा उत्पादनहरू, वास्तविक-समय सूची, र तपाईंको छिमेकी स्टोरबाट सोही दिन पिकअप।"
};

let apiDisabled = false; // Flag to stop calling API if permission is denied

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (targetLang === 'en') return text;
  if (!text || !text.trim()) return text;

  // 1. Check Dictionary First (Offline Fallback)
  if (DICTIONARY[text]) return DICTIONARY[text];

  // 2. Check Local Cache
  const cacheKey = `${CACHE_PREFIX}${targetLang}_${text}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  // 3. API Call (Only if not disabled by previous errors and key is available)
  if (apiDisabled || !API_KEY) return text;

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text'
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
        // If Permission Denied (403), disable API to prevent spamming the console with errors
        // This usually happens if the API key doesn't have Cloud Translation API enabled or billing is off.
        if (response.status === 403 || data.error?.code === 403) {
            console.warn("Translation API Permission Denied. Switching to offline dictionary mode for remaining texts.");
            apiDisabled = true;
        } else {
            // Only log other types of errors
            console.error('Translation API Error:', JSON.stringify(data, null, 2));
        }
        return text; // Fallback to original text
    }

    const translated = data.data.translations[0].translatedText;
    
    // Save to cache
    try {
        localStorage.setItem(cacheKey, translated);
    } catch (e) {
        // Handle quota exceeded for local storage silently
    }
    
    return translated;
  } catch (err) {
    console.error('Translation Fetch Error:', err);
    return text;
  }
};
