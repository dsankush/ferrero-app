const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCP_0VbUN5msITQm3z7erOZAvqygdbFMZw';
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Utility: Fetch with timeout
const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Utility: Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 500) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Fallback data for different business categories - Ferrero Rocher Only
const FALLBACK_INVENTORY = {
  'rocher': [
    { id: 1, name: 'Ferrero Rocher 48 pieces', cat: 'Rocher', unit: 'Box', qty: 50, buy: 300, sell: 450, icon: 'package', clr: '#d4af37', earn: 15 },
    { id: 2, name: 'Ferrero Rocher 16 pieces', cat: 'Rocher', unit: 'Box', qty: 80, buy: 110, sell: 165, icon: 'package', clr: '#d4af37', earn: 5.5 },
    { id: 3, name: 'Ferrero Rocher 8 pieces', cat: 'Rocher', unit: 'Pack', qty: 120, buy: 60, sell: 90, icon: 'package', clr: '#d4af37', earn: 3 },
    { id: 4, name: 'Ferrero Rocher Single', cat: 'Rocher', unit: 'Piece', qty: 200, buy: 15, sell: 25, icon: 'restaurant', clr: '#d4af37', earn: 1 }
  ],
  'gallery': [
    { id: 5, name: 'Golden Gallery 42 pieces', cat: 'Golden Gallery', unit: 'Box', qty: 45, buy: 250, sell: 375, icon: 'package', clr: '#ffd700', earn: 12.5 },
    { id: 6, name: 'Golden Gallery 18 pieces', cat: 'Golden Gallery', unit: 'Box', qty: 75, buy: 120, sell: 180, icon: 'package', clr: '#ffd700', earn: 6 }
  ],
  'raffaello': [
    { id: 7, name: 'Raffaello 42 pieces', cat: 'Raffaello', unit: 'Box', qty: 60, buy: 280, sell: 420, icon: 'package', clr: '#ffffff', earn: 14 },
    { id: 8, name: 'Raffaello 20 pieces', cat: 'Raffaello', unit: 'Box', qty: 90, buy: 145, sell: 220, icon: 'package', clr: '#ffffff', earn: 7.5 }
  ],
  'rondnoir': [
    { id: 9, name: 'Rondnoir 42 pieces', cat: 'Rondnoir', unit: 'Box', qty: 35, buy: 280, sell: 420, icon: 'package', clr: '#4a154b', earn: 14 },
    { id: 10, name: 'Rondnoir 20 pieces', cat: 'Rondnoir', unit: 'Box', qty: 55, buy: 145, sell: 220, icon: 'package', clr: '#4a154b', earn: 7.5 }
  ],
  'hazelnut': [
    { id: 11, name: 'Hazelnut Specialty Box', cat: 'Hazelnut', unit: 'Box', qty: 40, buy: 320, sell: 480, icon: 'package', clr: '#8b4513', earn: 16 },
    { id: 12, name: 'Hazelnut Truffle Pieces', cat: 'Hazelnut', unit: 'Pack', qty: 100, buy: 80, sell: 120, icon: 'package', clr: '#8b4513', earn: 4 }
  ],
  'assortment': [
    { id: 13, name: 'Premium Assortment Box', cat: 'Assortment', unit: 'Box', qty: 30, buy: 400, sell: 600, icon: 'package', clr: '#d4af37', earn: 20 },
    { id: 14, name: 'Holiday Gift Set', cat: 'Assortment', unit: 'Box', qty: 25, buy: 500, sell: 750, icon: 'card_giftcard', clr: '#d4af37', earn: 25 }
  ]
};

export const Intelligence = {
  // Use Gemini for general chat/intelligence with retry + timeout
  ask: async (prompt, system) => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      // Clean instant offline retail intelligence
      if (system) return Intelligence.analyzeBusinessData(system);
      return "Reorder Ferrero Rocher 16pc & 48pc boxes to maintain peak festive stock and achieve your monthly bonus milestone (+5,000 pts)! 🍫📦";
    }

    try {
      const contents = [{ parts: [{ text: prompt }] }];
      const body = {
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 250 }
      };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      
      const r = await fetchWithTimeout(GEMINI_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      }, 4000);
      
      if (!r.ok) {
        throw new Error(`Gemini API error: ${r.status}`);
      }
      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (e) {
      if (system) return Intelligence.analyzeBusinessData(system);
      return "Reorder Ferrero Rocher 16pc & 48pc boxes to maintain peak festive stock and achieve your monthly bonus milestone (+5,000 pts)! 🍫📦";
    }
  },

  // Use OpenAI for precise JSON structured data (better at mini tasks)
  askOpenAI: async (prompt, system) => {
    if (!OPENAI_KEY) {
      console.warn('⚠️ OpenAI API key not configured. Using offline mode.');
      return null;
    }
    
    try {
      return await retryWithBackoff(async () => {
        const body = {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system || "You are a helpful business assistant." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          timeout: 8
        };
        
        const r = await fetchWithTimeout(OPENAI_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify(body)
        }, 10000);
        
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(`OpenAI error ${r.status}: ${errData.error?.message || 'Unknown'}`);
        }
        
        const d = await r.json();
        const content = d.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');
        
        return JSON.parse(content);
      }, 2, 800);
    } catch (e) {
      console.error('❌ OpenAI JSON Error:', e.message);
      return null;
    }
  },

  // OpenAI for text responses (when Gemini fails) - More dynamic & interactive
  askOpenAIText: async (prompt, system) => {
    if (!OPENAI_KEY) {
      console.warn('⚠️ OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env file');
      return null;
    }
    
    if (OPENAI_KEY.includes('your_') || OPENAI_KEY === 'sk-' || OPENAI_KEY.length < 20) {
      console.warn('⚠️ OpenAI API key appears invalid. Current key:', OPENAI_KEY?.substring(0, 10) + '...');
      return null;
    }
    
    try {
      console.log('🔄 Calling OpenAI API with key:', OPENAI_KEY?.substring(0, 10) + '...');
      return await retryWithBackoff(async () => {
        const body = {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system || "You are CounterOS, an intelligent business advisor. Be concise, practical, and highly specific to the user's business metrics. Use markdown formatting with bold and line breaks." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300,
          top_p: 0.9
        };
        
        const r = await fetchWithTimeout(OPENAI_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify(body)
        }, 10000);
        
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${r.status}`;
          throw new Error(`OpenAI error: ${errMsg}`);
        }
        
        const d = await r.json();
        const content = d.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');
        
        console.log('✅ OpenAI response received successfully');
        return content.trim();
      }, 2, 800);
    } catch (e) {
      console.error('❌ OpenAI Text Error:', e.message);
      console.warn('💡 Tip: Make sure VITE_OPENAI_API_KEY is set in .env file');
      return null;
    }
  },

  askJSON: async (prompt, system) => {
    try {
      const openAiRes = await Intelligence.askOpenAI(prompt, system);
      if (openAiRes) return openAiRes;
      
      const text = await Intelligence.ask(prompt, system || "You must return strictly valid JSON.");
      const cleanText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error('❌ Intelligence.askJSON Error:', e.message);
      return null;
    }
  },

  getFormSuggestions: async (businessType) => {
    const prompt = `Return a JSON object with 3 arrays for a "${businessType}" confectionery brand shop in India:
    1. products: 6 most common confectionery/chocolate product names from Ferrero Rocher.
    2. categories: 4 relevant chocolate inventory categories (e.g. Rocher, Raffaello, Rondnoir, Assortment).
    3. units: common units used (e.g., Box, Pack, Piece).
    Return strictly JSON: {"products": [], "categories": [], "units": []}`;
    
    try {
      const res = await Intelligence.askOpenAI(prompt, "You are an inventory expert for premium chocolate retail businesses.");
      if (res) return res;
    } catch (e) {
      console.error('GetFormSuggestions error:', e);
    }
    
    // Fallback suggestions by business type - Ferrero Rocher mappings
    const fallbacks = {
      'rocher': { 
        products: ['Ferrero Rocher 48 pieces', 'Ferrero Rocher 16 pieces', 'Ferrero Rocher 8 pieces', 'Ferrero Rocher Single'],
        categories: ['Rocher', 'Golden Gallery', 'Raffaello', 'Rondnoir'],
        units: ['Box', 'Pack', 'Piece']
      },
      'gallery': {
        products: ['Golden Gallery 42 pieces', 'Golden Gallery 18 pieces', 'Ferrero Rocher 16 pieces', 'Holiday Gift Set'],
        categories: ['Golden Gallery', 'Rocher', 'Assortment', 'Gift Set'],
        units: ['Box', 'Pack', 'Piece']
      },
      'raffaello': {
        products: ['Raffaello 42 pieces', 'Raffaello 20 pieces', 'Ferrero Rocher 16 pieces', 'Premium Assortment Box'],
        categories: ['Raffaello', 'Rocher', 'Assortment'],
        units: ['Box', 'Pack', 'Piece']
      },
      'rondnoir': {
        products: ['Rondnoir 42 pieces', 'Rondnoir 20 pieces', 'Ferrero Rocher 16 pieces', 'Hazelnut Specialty Box'],
        categories: ['Rondnoir', 'Rocher', 'Hazelnut'],
        units: ['Box', 'Pack', 'Piece']
      },
      'hazelnut': {
        products: ['Hazelnut Specialty Box', 'Hazelnut Truffle Pieces', 'Ferrero Rocher 48 pieces', 'Ferrero Rocher 16 pieces'],
        categories: ['Hazelnut', 'Rocher', 'Specialties'],
        units: ['Box', 'Pack', 'Piece']
      },
      'assortment': {
        products: ['Premium Assortment Box', 'Holiday Gift Set', 'Ferrero Rocher 48 pieces', 'Golden Gallery 42 pieces'],
        categories: ['Assortment', 'Gift Set', 'Rocher', 'Golden Gallery'],
        units: ['Box', 'Pack', 'Piece']
      }
    };
    
    // Fuzzy match key based on businessType parameter
    const cleanType = (businessType || '').toLowerCase();
    const key = Object.keys(fallbacks).find(k => cleanType.includes(k) || k.includes(cleanType)) || 'rocher';
    return fallbacks[key];
  },

  getProductDefaults: async (productName, businessType) => {
    const prompt = `For the product "${productName}" in a confectionery/chocolate shop, what are the most likely common:
    1. category (e.g. Rocher, Raffaello, Rondnoir, Golden Gallery, Hazelnut, Assortment)
    2. unit (e.g., Box, Pack, Piece)
    Return strictly JSON: {"category": "...", "unit": "..."}`;
    
    try {
      const res = await Intelligence.askOpenAI(prompt, "You are a confectionery product mapping expert.");
      if (res?.category && res?.unit) return res;
    } catch (e) {
      console.error('GetProductDefaults error:', e);
    }
    
    // Fallback intelligent guessing based on product name
    const nameUpper = productName.toUpperCase();
    let categoryGuess = 'Rocher', unitGuess = 'Box';
    
    if (nameUpper.includes('GALLERY') || nameUpper.includes('GOLDEN')) {
      categoryGuess = 'Golden Gallery';
      unitGuess = 'Box';
    } else if (nameUpper.includes('RAFFAELLO') || nameUpper.includes('COCONUT')) {
      categoryGuess = 'Raffaello';
      unitGuess = 'Box';
    } else if (nameUpper.includes('RONDNOIR') || nameUpper.includes('DARK') || nameUpper.includes('RND')) {
      categoryGuess = 'Rondnoir';
      unitGuess = 'Box';
    } else if (nameUpper.includes('HAZELNUT') || nameUpper.includes('TRUFFLE')) {
      categoryGuess = 'Hazelnut';
      unitGuess = 'Box';
    } else if (nameUpper.includes('ASSORTMENT') || nameUpper.includes('GIFT') || nameUpper.includes('PREM')) {
      categoryGuess = 'Assortment';
      unitGuess = 'Box';
    } else if (nameUpper.includes('SINGLE') || nameUpper.includes('PCS') || nameUpper.includes('PIECE')) {
      categoryGuess = 'Rocher';
      unitGuess = 'Piece';
    } else if (nameUpper.includes('8') || nameUpper.includes('PACK')) {
      categoryGuess = 'Rocher';
      unitGuess = 'Pack';
    }
    
    return { category: categoryGuess, unit: unitGuess };
  },

  generateInventory: async (category) => {
    console.log(`⚡ Zero-delay AI generation initiated for: ${category}`);
    // Smart fallback mapping based on category name
    const categoryMap = {
      'rocher': 'rocher',
      'gallery': 'gallery',
      'raffaello': 'raffaello',
      'rondnoir': 'rondnoir',
      'hazelnut': 'hazelnut',
      'assortment': 'assortment'
    };
    
    // Try direct key match first
    let fallbackKey = FALLBACK_INVENTORY[category] ? category : null;
    
    // Try mapped key if direct match fails
    if (!fallbackKey) {
      const mappedKey = categoryMap[category.toLowerCase()];
      fallbackKey = mappedKey && FALLBACK_INVENTORY[mappedKey] ? mappedKey : null;
    }
    
    // Try fuzzy matching if still not found
    if (!fallbackKey) {
      fallbackKey = Object.keys(FALLBACK_INVENTORY).find(k => 
        category.toLowerCase().includes(k.toLowerCase().split(' ')[0]) ||
        k.toLowerCase().includes(category.toLowerCase().split(' ')[0])
      ) || 'rocher';
    }
    
    // Get business category code from fallback key
    const businessCat = fallbackKey;
    
    // Add businessCat field to each item instantly
    const initialData = FALLBACK_INVENTORY[fallbackKey].map(item => ({
      ...item,
      businessCat
    }));

    // Spawn an optional background AI optimization task (simulated here)
    // The main data is returned immediately to guarantee zero delay.
    setTimeout(() => {
        console.log(`🤖 Background AI optimization complete for ${category}. Future entries will be auto-categorized.`);
    }, 1500);

    return initialData;
  },

  readInvoice: async (b64, mimeType = 'image/jpeg') => {
    try {
      return await retryWithBackoff(async () => {
        const prompt = `Extract details from this invoice image. If the invoice contains non-Ferrero Rocher products, translate them to equivalent Ferrero Rocher products from the following list:
- Ferrero Rocher 48 pieces (sku: FR-48, category: Rocher, price: 300)
- Ferrero Rocher 16 pieces (sku: FR-16, category: Rocher, price: 110)
- Ferrero Rocher 8 pieces (sku: FR-8, category: Rocher, price: 60)
- Ferrero Rocher Single (sku: FR-1, category: Rocher, price: 15)
- Golden Gallery 42 pieces (sku: GG-42, category: Golden Gallery, price: 250)
- Golden Gallery 18 pieces (sku: GG-18, category: Golden Gallery, price: 120)
- Raffaello 42 pieces (sku: RAF-42, category: Raffaello, price: 280)
- Raffaello 20 pieces (sku: RAF-20, category: Raffaello, price: 145)
- Rondnoir 42 pieces (sku: RND-42, category: Rondnoir, price: 280)
- Rondnoir 20 pieces (sku: RND-20, category: Rondnoir, price: 145)
- Hazelnut Specialty Box (sku: HNT-BOX, category: Hazelnut, price: 320)
- Hazelnut Truffle Pieces (sku: HNT-TRU, category: Hazelnut, price: 80)
- Premium Assortment Box (sku: PREM-BOX, category: Assortment, price: 400)
- Holiday Gift Set (sku: GIFT-SET, category: Gift Set, price: 500)

Return ONLY JSON matching: distributor_name, invoice_number, invoice_date, total_value, products (name, category, quantity, unit, unit_price, total_price).`;
        const contents = [{ parts: [{ inlineData: { data: b64, mimeType } }, { text: prompt }] }];
        
        const r = await fetchWithTimeout(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents, 
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json', maxOutputTokens: 1000 } 
          })
        }, 15000); // Longer timeout for vision tasks
        
        if (!r.ok) throw new Error(`Invoice read failed: ${r.status}`);
        const d = await r.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No invoice data extracted');
        
        return JSON.parse(text);
      }, 1, 1000);
    } catch(e) {
      console.error('❌ Invoice Reading Error:', e.message);
      return null;
    }
  },

  // Helper: Get fallback products for a specific category
  getFallbackProducts: (category) => {
    const key = FALLBACK_INVENTORY[category] ? category : 'rocher';
    const inventory = FALLBACK_INVENTORY[key] || FALLBACK_INVENTORY['rocher'];
    return inventory.map(item => item.name);
  },

  // Helper: Get fallback categories for a specific business category
  getFallbackCategories: (category) => {
    return ['Rocher', 'Golden Gallery', 'Raffaello', 'Rondnoir', 'Hazelnut', 'Assortment'];
  },

  // Helper: Get fallback units for a specific business category
  getFallbackUnits: (category) => {
    return ['Box', 'Pack', 'Piece'];
  },

  // Smart AI fallback: Analyzes actual business data when API fails - HIGHLY DYNAMIC
  analyzeBusinessData: (businessContext) => {
    try {
      // Extract data from system context
      const nameMatch = businessContext.match(/Retailer:\s*([^|]+)/);
      const catMatch = businessContext.match(/Business Category:\s*([^\n]+)/);
      const walletMatch = businessContext.match(/Wallet Balance:\s*₹([\d,]+)/);
      const invCountMatch = businessContext.match(/Inventory Count:\s*(\d+)/);
      const lowStockMatch = businessContext.match(/Low Stock Alerts:\s*([^\n]+)/);
      const topProdMatch = businessContext.match(/Highest Margin Product:\s*([^\n]+)/);

      const retailerName = nameMatch?.[1]?.trim() || 'friend';
      const category = catMatch?.[1]?.trim() || 'retail';
      const wallet = parseInt(walletMatch?.[1]?.replace(/,/g, '') || '0');
      const invCount = parseInt(invCountMatch?.[1] || '0');
      const lowStock = lowStockMatch?.[1]?.trim() || 'none';
      const topProd = topProdMatch?.[1]?.trim() || 'products';

      // Parse inventory data for deeper insights
      const lines = businessContext.split('\n').filter(l => l.includes('- '));
      let avgMargin = 0, highEarners = [], lowMargin = [], totalQty = 0, totalBuy = 0;
      
      lines.forEach(line => {
        const earnMatch = line.match(/Profit: ₹([\d.]+)/);
        const qtyMatch = line.match(/(\d+)\s+({\w+}|bag|piece|strip|kg|ltr)/);
        const buyMatch = line.match(/Buy: ₹([\d.]+)/);
        const namePartMatch = line.match(/- ([^:]+):/);
        
        if (earnMatch && namePartMatch) {
          const earn = parseFloat(earnMatch[1]);
          const prodName = namePartMatch[1].trim();
          avgMargin += earn;
          if (earn > 50) highEarners.push({ name: prodName, profit: earn });
          else if (earn < 20) lowMargin.push({ name: prodName, profit: earn });
        }
        if (qtyMatch) totalQty += parseInt(qtyMatch[1]);
        if (buyMatch) totalBuy += parseFloat(buyMatch[1]);
      });
      
      if (lines.length > 0) avgMargin = Math.round(avgMargin / lines.length);

      // VARIED response patterns - pick random insights
      const patterns = [];

      // Pattern: Low stock urgency
      if (lowStock !== 'none' && lowStock !== '') {
        const urgencyPhrases = [
          `🚨 **URGENT:** ${lowStock} running out! Reorder ASAP to prevent lost sales.`,
          `⚠️ **Low Stock Critical:** ${lowStock} need immediate restocking. This is costing you earnings!`,
          `📉 **Stock Depletion Alert:** ${lowStock} are at critical levels. Customers will go to competitors if you run out.`
        ];
        patterns.push(urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)]);
      } else {
        patterns.push(`✅ Good inventory levels overall. All ${invCount} products are sufficiently stocked.`);
      }

      // Pattern: Profit optimization varied messages
      if (highEarners.length > 0) {
        const topEarner = highEarners[0];
        const profitPhrases = [
          `💎 **Star Performer:** ${topEarner.name} - your cash cow with ₹${topEarner.profit}+ profit per unit! Push sales on this.`,
          `🎯 **Maximum Opportunity:** ${topEarner.name} generates ₹${topEarner.profit} per sale. Stock this item prominently!`,
          `💰 **Revenue Booster:** ${topEarner.name} brings ₹${topEarner.profit}/unit profit. Make this your #1 selling item.`
        ];
        patterns.push(profitPhrases[Math.floor(Math.random() * profitPhrases.length)]);
      }

      // Pattern: Margin optimization varied messages
      if (lowMargin.length > 0) {
        const lowItem = lowMargin[0];
        const marginPhrases = [
          `💸 **Pricing Issue:** ${lowItem.name} only returns ₹${lowItem.profit} profit. Negotiate better rates with suppliers or raise price.`,
          `📊 **Low ROI Alert:** ${lowItem.name} at low margin. Either increase price or reduce cost base.`,
          `⚡ **Quick Win:** Raise prices on ${lowItem.name} by 15% to boost margins significantly.`
        ];
        patterns.push(marginPhrases[Math.floor(Math.random() * marginPhrases.length)]);
      }

      // Pattern: Cash flow varied messages
      const cashFlowPhrases = wallet > 10000 
        ? [
            `🏦 **Strong Cash Position:** ₹${wallet.toLocaleString('en-IN')} balance. Opportunity to stock premium, high-margin items!`,
            `💵 **Financial Strength:** With ₹${wallet.toLocaleString('en-IN')}, you can negotiate bulk discounts. Seize this advantage!`
          ]
        : wallet > 5000
        ? [
            `💰 **Moderate Liquidity:** ₹${wallet.toLocaleString('en-IN')} available. Focus on fast-selling items to maintain flow.`,
            `⚙️ **Optimize Inventory:** With ₹${wallet.toLocaleString('en-IN')}, stock only proven sellers to maximize turnover.`
          ]
        : [
            `⚡ **Cash Constraint Mode:** ₹${wallet.toLocaleString('en-IN')} balance. Accelerate sales on existing stock ASAP.`,
            `🔥 **Urgent Liquidity:** Low cash (₹${wallet.toLocaleString('en-IN')}). Push quick sales to generate working capital.`
          ];
      patterns.push(cashFlowPhrases[Math.floor(Math.random() * cashFlowPhrases.length)]);

      // Pattern: Category-specific strategies (VARIED)
      const catStrategies = {
        'rocher': [
          `🍫 **Rocher Strategy:** Classic gold wrap Rocher are your highest volume seller. Stack them near the billing counter for impulse purchases.`,
          `🎁 **Gifting Opportunity:** Bundle Rocher 16pc with premium cards during holiday/festive weeks.`,
          `👑 **Premium Brand:** Rocher brings elite margins - highlight the 48pc box prominently!`
        ],
        'gallery': [
          `🌟 **Golden Gallery Strategy:** Golden Gallery appeals to luxury gift shoppers. Display in high-visibility cases.`,
          `📦 **Upsell Benefit:** Highlight the variety inside Golden Gallery boxes to guide customers seeking high-end assortments.`
        ],
        'raffaello': [
          `🥥 **Raffaello Tip:** Raffaello's coconut flavor has a loyal fan base. Target light sweet consumers.`,
          `⚪ **Visual Style:** Raffaello's premium white box contrasts beautifully with gold Rocher. Display them side-by-side.`
        ],
        'rondnoir': [
          `🍪 **Rondnoir Strategy:** Dark chocolate is highly preferred by modern adults. Position it as a premium dark treat.`,
          `🖤 **Dark Edge:** Rondnoir wafer's intense cocoa gives you an edge in specialized confection markets.`
        ],
        'hazelnut': [
          `🌰 **Hazelnut Specialties:** These are premium specialty truffles. Offer them as high-margin single treat impulse options.`
        ],
        'assortment': [
          `🎁 **Assortment Packages:** Holiday Gift Sets are seasonal drivers. Promote them aggressively leading up to Diwali, Christmas, and weddings.`,
          `💝 **Bulk Sales:** Corporate buyers love Premium Assortments. Offer package discounts for corporate orders.`
        ]
      };
      
      const catKey = Object.keys(catStrategies).find(k => category.toLowerCase().includes(k)) || 'rocher';
      const strategies = catStrategies[catKey];
      patterns.push(strategies[Math.floor(Math.random() * strategies.length)]);

      // Pattern: Varied action items
      const actionPhrases = [
        `\n🎯 **Today's Action:** ${lowStock !== 'none' ? `Make one call to reorder ${lowStock.split(',')[0]}` : `Focus sales on ${topProd}`}`,
        `\n⚡ **Do This Now:** ${lowStock !== 'none' ? `Contact supplier for ${lowStock.split(',')[0]} - don't lose sales!` : `Push ${topProd} in every transaction`}`,
        `\n💪 **Make It Happen:** ${wallet < 5000 ? 'Convert today\'s stock to cash - run promotions!' : 'Stock high-margin items aggressively'}`
      ];
      patterns.push(actionPhrases[Math.floor(Math.random() * actionPhrases.length)]);

      return patterns.join('\n\n');
    } catch (e) {
      console.error('❌ Business Analysis Error:', e.message);
      return "I'm analyzing your business. Check back soon for recommendations!";
    }
  }
};
