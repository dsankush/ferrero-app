/**
 * Gemini Vision Service
 * Uses the Gemini 2.0 Flash model to extract structured invoice data from images/PDFs.
 * Key read from import.meta.env.VITE_GEMINI_KEY
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const INVOICE_EXTRACTION_PROMPT = `You are an expert invoice OCR system for an Indian wholesale/retail business.

Carefully extract ALL information from this invoice image and return it as a valid JSON object with EXACTLY this structure:

{
  "wholesaler_name": "Name of the wholesaler/supplier/seller company",
  "retailer_name": "Name of the retailer/buyer/bill-to party",
  "invoice_number": "Invoice or bill number if visible",
  "purchase_date": "Date in YYYY-MM-DD format (convert from any Indian date format)",
  "products": [
    {
      "name": "Full product name as written on invoice",
      "qty": 1,
      "unit": "Box/Piece/Pack/Kg/etc",
      "price": 0.0,
      "total": 0.0
    }
  ],
  "total_amount": 0.0,
  "gst_amount": 0.0,
  "confidence": "high/medium/low"
}

Rules:
- qty and price must be numbers (not strings)
- If a field is not visible, use null
- Extract ALL line items as separate products
- confidence = "high" if all fields clearly visible, "medium" if some unclear, "low" if mostly unreadable
- Return ONLY the JSON object, no markdown, no explanation`;

/**
 * Convert a File object to base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract the pure base64 string and mime type from a data URL
 */
const parseDataUrl = (dataUrl) => {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)[1];
  return { mimeType, data };
};

/**
 * Main invoice scan function
 * @param {File} file - Image or PDF file
 * @returns {Promise<Object>} - Extracted invoice data
 */
export const scanInvoice = async (file) => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_KEY is not set in .env');
  }

  // Convert file to base64
  const dataUrl = await fileToBase64(file);
  const { mimeType, data } = parseDataUrl(dataUrl);

  // Build Gemini request
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: INVOICE_EXTRACTION_PROMPT
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} — ${errorText}`);
  }

  const result = await response.json();

  // Extract text from response
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!rawText) {
    throw new Error('Gemini returned empty response');
  }

  // Clean and parse JSON (Gemini sometimes wraps in markdown)
  let jsonText = rawText.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonText);
    return {
      ...parsed,
      raw_ocr_text: rawText
    };
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON:', jsonText);
    throw new Error('Could not parse invoice data from AI response. Please try again or enter manually.');
  }
};

/**
 * Fallback mock scanner for development / when key is invalid
 */
export const mockScanInvoice = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        wholesaler_name: 'Gupta Ferrero Rocher Distributors',
        retailer_name: 'Kumar Sweet House',
        invoice_number: 'INV-2026-0847',
        purchase_date: new Date().toISOString().split('T')[0],
        products: [
          { name: 'Ferrero Rocher 48 pieces', qty: 10, unit: 'Box', price: 300, total: 3000 },
          { name: 'Ferrero Rocher 16 pieces', qty: 5, unit: 'Box', price: 110, total: 550 },
          { name: 'Raffaello 20 pieces', qty: 3, unit: 'Box', price: 145, total: 435 }
        ],
        total_amount: 3985,
        gst_amount: 717.30,
        confidence: 'high',
        raw_ocr_text: '[MOCK SCAN - AI key not active]'
      });
    }, 2000);
  });
};
