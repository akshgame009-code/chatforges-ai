const INTENTS = [
  { name: 'greeting', patterns: ['hello','hi','hey','namaste','namaskar','hii','helo','good morning','good evening','good afternoon','sup','howdy','kaise ho','kya haal','sat sri akal'],
    reply: (cfg) => { const n = cfg?.business_name||'us'; const g = [`👋 Hello! Welcome to **${n}**. How can I help you today?`,`😊 Hi there! Great to see you at **${n}**. What can I do for you?`,`🙏 Namaste! You've reached **${n}**'s assistant. Ask me anything!`]; return g[Math.floor(Math.random()*g.length)]; }
  },
  { name: 'farewell', patterns: ['bye','goodbye','alvida','tata','see you','cya','later','take care','good night','goodnight','ok bye'],
    reply: () => { const g = ['👋 Goodbye! Have a wonderful day!','🙏 Take care! Feel free to come back anytime.','😊 Bye bye! It was great chatting with you!']; return g[Math.floor(Math.random()*g.length)]; }
  },
  { name: 'thanks', patterns: ['thank','thanks','thankyou','thank you','shukriya','dhanyawad','appreciated','helpful','great help','bahut accha'],
    reply: () => { const g = ["🙏 You're welcome! Happy to help anytime.",'😊 Glad I could help! Is there anything else?','✨ My pleasure! Feel free to ask more questions.']; return g[Math.floor(Math.random()*g.length)]; }
  },
  { name: 'services', patterns: ['service','services','product','products','offer','provide','kya karte','kya bechte','kya milta','what do you do','what do you sell','offerings','solutions','work','business'],
    reply: (cfg) => { if (cfg?.summary && cfg.summary.length > 30) return `🏢 **About ${cfg.business_name||'us'}:**\n\n${cfg.summary.slice(0,300)}${cfg.summary.length>300?'...':''}\n\nWant to know more? Check our website or ask me anything specific!`; return `🏢 We offer a range of quality services. Visit our website for the full list, or ask me something specific!`; }
  },
  { name: 'contact', patterns: ['contact','phone','call','email','mail','reach','whatsapp','address','location','where are you','office','helpline','support','number','sampark','baat karna','milna'],
    reply: (cfg) => { const c = cfg?.contact_info; const parts = []; if (c?.email) parts.push(`📧 Email: ${c.email}`); if (c?.phone) parts.push(`📞 Phone: ${c.phone}`); if (c?.social?.length) parts.push(`🔗 Social: ${c.social.slice(0,2).join(', ')}`); if (parts.length) return `📬 **Contact Information:**\n\n${parts.join('\n')}\n\nFeel free to reach out!`; return `📬 Contact details are available on our website. Visit the **Contact Us** page for email, phone, and location info!`; }
  },
  { name: 'pricing', patterns: ['price','prices','pricing','cost','costs','charge','fee','fees','rate','rates','kitna','kitne','paisa','rupee','rupees','rs','budget','affordable','cheap','expensive','how much','kharcha','daam'],
    reply: (cfg) => `💰 For detailed pricing at **${cfg?.business_name||'our business'}**, please:\n\n• 🌐 Visit our website's pricing page\n• 📞 Call or email us directly\n• 💬 Ask for a custom quote\n\nWe offer competitive rates for all budgets!`
  },
  { name: 'hours', patterns: ['hours','timing','timings','open','close','time','schedule','when','kab','kitne baje','working hours','business hours','sunday','saturday','holiday','weekend'],
    reply: (cfg) => `🕐 **Business Hours:**\n\n${cfg?.business_name||'We'} is typically open during regular business hours.\n\nFor exact timings, please check the website or contact us directly!`
  },
  { name: 'location', patterns: ['location','address','where','kahan','city','state','area','near me','direction','map','situated','based','branch','office','store','shop','showroom'],
    reply: (cfg) => `📍 **Location:**\n\nAddress and location details are available on the website.\n\nSearch **"${cfg?.business_name||'us'}"** on Google Maps for directions!`
  },
  { name: 'about', patterns: ['about','who are you','tell me about','history','founded','company','team','founder','since when','background','kaun ho','kya hai','describe','information','info'],
    reply: (cfg) => { const n = cfg?.business_name||'This business'; const s = cfg?.summary?.slice(0,250)||''; if (s) return `ℹ️ **About ${n}:**\n\n${s}${s.length===250?'...':''}\n\nVisit the website to learn more!`; return `ℹ️ **About ${n}:**\n\nWe're a dedicated business focused on delivering quality. Visit our website for the full story!`; }
  },
  { name: 'website', patterns: ['website','link','url','site','webpage','online','portal','web address','visit','check out'],
    reply: (cfg) => { const url = cfg?.website_url; const n = cfg?.business_name||'our website'; if (url) return `🌐 **Visit us online:**\n\n${url}\n\nYou'll find all details about ${n} there!`; return `🌐 Visit our website for complete information, products, and contact details!`; }
  },
  { name: 'help', patterns: ['help','assist','support','guide','how to','problem','issue','trouble','madad','sahayata','kaise','samajh nahi','confused','explain'],
    reply: (cfg) => `🤝 I'm here to help! You can ask me about:\n\n• 🏢 **Services & Products**\n• 💰 **Pricing**\n• 📞 **Contact**\n• 🕐 **Hours**\n• ℹ️ **About us**\n\nWhat would you like to know about **${cfg?.business_name||'us'}**?`
  }
];

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g,' ').replace(/\s+/g,' ').trim();
}

function scoreIntent(msg, patterns) {
  const words = msg.split(' ');
  let score = 0;
  for (const p of patterns) {
    if (msg.includes(p)) { score += p.includes(' ') ? 3 : 2; }
    else { for (const w of words) { if (w.length > 3 && p.startsWith(w)) score += 1; } }
  }
  return score;
}

function matchFAQ(msg, faqs=[]) {
  if (!faqs.length) return null;
  const msgWords = new Set(normalize(msg).split(' ').filter(w=>w.length>3));
  let best=null, bestScore=0;
  for (const faq of faqs) {
    const qWords = normalize(faq.question).split(' ').filter(w=>w.length>3);
    let overlap=0;
    for (const w of qWords) { if (msgWords.has(w)) overlap++; }
    const score = qWords.length>0 ? overlap/qWords.length : 0;
    if (score>bestScore) { bestScore=score; best=faq; }
  }
  return bestScore>=0.4 ? best : null;
}

function generateReply(message, botConfig, history=[]) {
  const msg = normalize(message);
  const cfg = botConfig||{};

  const faqMatch = matchFAQ(msg, cfg.faq||[]);
  if (faqMatch) return `💡 **${faqMatch.question}**\n\n${faqMatch.answer}`;

  let bestIntent=null, bestScore=0;
  for (const intent of INTENTS) {
    const score = scoreIntent(msg, intent.patterns);
    if (score>bestScore) { bestScore=score; bestIntent=intent; }
  }
  if (bestIntent && bestScore>=2) return bestIntent.reply(cfg);

  const lastBot = history.filter(h=>h.role==='assistant').slice(-1)[0];
  if (lastBot) {
    const last = normalize(lastBot.content);
    const positive = msg.includes('yes')||msg.includes('ok')||msg.includes('haan')||msg.includes('sure');
    if (last.includes('contact') && positive) return INTENTS.find(i=>i.name==='contact').reply(cfg);
    if (last.includes('service') && (positive||msg.includes('more')||msg.includes('aur'))) return INTENTS.find(i=>i.name==='services').reply(cfg);
  }

  const name = cfg.business_name||'this business';
  const suggestions = (cfg.faq||[]).slice(0,2).map(f=>`• "${f.question}"`).join('\n') || '• "What services do you offer?"\n• "How can I contact you?"';
  return `🤔 I'm not sure about that, but I can help with many things!\n\nTry asking:\n${suggestions}\n\nOr type **"help"** to see what I can answer about **${name}**!`;
}

exports.handler = async (event) => {
  const headers = { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' };
  if (event.httpMethod==='OPTIONS') return { statusCode:200, headers, body:'' };
  if (event.httpMethod!=='POST') return { statusCode:405, headers, body:JSON.stringify({error:'Method Not Allowed'}) };

  let body;
  try { body=JSON.parse(event.body||'{}'); }
  catch { return { statusCode:400, headers, body:JSON.stringify({error:'Invalid JSON'}) }; }

  const { message, botConfig, history=[] } = body;
  if (!message) return { statusCode:400, headers, body:JSON.stringify({error:'Message is required'}) };

  const reply = generateReply(message, botConfig, history);
  return { statusCode:200, headers, body:JSON.stringify({ reply, timestamp:new Date().toISOString() }) };
};
