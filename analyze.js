const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to clean text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0900-\u097F.,!?'"-]/g, '')
    .trim();
}

// Extract meta tags
function extractMetaTags($) {
  const meta = {
    description: '',
    keywords: '',
    author: '',
    ogTitle: '',
    ogDescription: '',
    twitterCard: ''
  };

  $('meta').each((i, el) => {
    const name = $(el).attr('name') || $(el).attr('property') || '';
    const content = $(el).attr('content') || '';
    if (!content) return;
    if (name.includes('description')) meta.description = content;
    if (name.includes('keywords')) meta.keywords = content;
    if (name.includes('author')) meta.author = content;
    if (name === 'og:title') meta.ogTitle = content;
    if (name === 'og:description') meta.ogDescription = content;
    if (name.includes('twitter:card')) meta.twitterCard = content;
  });

  return meta;
}

// Extract contact info
function extractContactInfo($) {
  const contact = { email: null, phone: null, social: [] };
  const text = $('body').text();

  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emails) contact.email = emails[0];

  const phones = text.match(/(\+?91[-.\s]?)?[6-9]\d{9}/g);
  if (phones) contact.phone = phones[0];

  const socialLinks = [];
  $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="instagram.com"], a[href*="linkedin.com"]').each((i, el) => {
    const href = $(el).attr('href');
    if (href) socialLinks.push(href);
  });
  contact.social = [...new Set(socialLinks)].slice(0, 5);

  return contact;
}

// Generate FAQ from content
function generateDynamicFAQ(content, businessName) {
  const faqs = [];
  const lower = content.toLowerCase();

  if (lower.includes('service') || lower.includes('product')) {
    faqs.push({
      question: `What services/products does ${businessName} offer?`,
      answer: `${businessName} provides various services and products. For full details, please visit their website or contact them directly.`
    });
  }
  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) {
    faqs.push({
      question: `How can I contact ${businessName}?`,
      answer: `You can find contact info on their website's contact page — look for email, phone, or a contact form.`
    });
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('₹')) {
    faqs.push({
      question: `What are the pricing details?`,
      answer: `For pricing, please check the website or reach out to their support team directly.`
    });
  }
  if (faqs.length === 0) {
    faqs.push({
      question: `What does ${businessName} do?`,
      answer: content.slice(0, 200) + '... Visit their website for more information.'
    });
  }

  return faqs.slice(0, 4);
}

// ✅ CORRECT: Netlify functions use exports.handler directly, NOT express routing
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { url, prompt } = body;

  if (!url) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'URL is required' })
    };
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    let title = $('title').text().trim();
    if (!title || title.length < 3) title = $('h1').first().text().trim() || 'Business Website';

    const metaTags = extractMetaTags($);
    const contactInfo = extractContactInfo($);

    const paragraphs = $('p')
      .map((i, el) => cleanText($(el).text()))
      .get()
      .filter(t => t.length > 40 && t.length < 500)
      .slice(0, 15);

    const headings = $('h1, h2, h3')
      .map((i, el) => cleanText($(el).text()))
      .get()
      .filter(t => t.length > 10)
      .slice(0, 5);

    let summary = metaTags.description || metaTags.ogDescription || '';
    if (!summary || summary.length < 50) {
      summary = paragraphs.join(' ').slice(0, 500);
    }

    const allContent = paragraphs.join(' ') + ' ' + headings.join(' ');
    const dynamicFAQ = generateDynamicFAQ(allContent, title);
    const botTone = prompt || 'professional and helpful';

    const result = {
      business_name: cleanText(title),
      website_url: url,
      meta_info: metaTags,
      contact_info: contactInfo,
      summary: cleanText(summary).slice(0, 500),
      key_headings: headings,
      chatbot_name: `${title.split(' ')[0]} Assistant`,
      vibe_mode: botTone,
      faq: dynamicFAQ,
      system_prompt: `You are a friendly AI chatbot for ${title}. Tone: ${botTone}. Answer questions based on this business info: ${summary.slice(0, 300)}. Be helpful, concise, and natural. If unsure, suggest visiting the website.`,
      design: {
        theme: 'modern',
        color: '#8b5cf6',
        accent: '#3b82f6',
        borderRadius: '12px'
      },
      generated_at: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error('Scraping error:', err.message);

    let errorMessage = 'Website analyze nahi ho paaya';

    if (err.code === 'ECONNABORTED') errorMessage = 'Website response timed out. Try a faster website.';
    else if (err.response?.status === 404) errorMessage = 'Website not found (404). Please check the URL.';
    else if (err.response?.status === 403) errorMessage = 'Website is blocking access (403). Try another site.';
    else if (err.code === 'ENOTFOUND') errorMessage = 'Invalid domain name. Please check the URL.';

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: errorMessage,
        details: err.message,
        suggestion: "Try with 'https://example.com'"
      })
    };
  }
};
