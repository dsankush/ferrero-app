import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { Intelligence } from '../services/intelligence';

export const Assistant = () => {
  const navigate = useNavigate();
  const { user, inventory, walletBalance } = useAppContext();
  
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Namaste ${user.name.split(' ')[0]}! 👋 Your wallet balance is **₹${walletBalance.toLocaleString('en-IN')}**.\n\nI am CounterOS AI, your personal business advisor. I can see you have **${inventory.length}** products in stock currently. How can I help you grow today?` }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getSystemContext = () => {
    const invCount = inventory.length;
    const invData = inventory.slice(0, 5).map(p => `- ${p.name}: ${p.qty} ${p.unit} remaining (Buy: ₹${p.buy}, Sell: ₹${p.sell}, Profit: ₹${p.earn})`).join('\n');
    const lowStock = inventory.filter(p => p.qty < 6).map(p => p.name.split(' ').slice(0,2).join(' ')).join(', ') || 'none';
    const topProd = [...inventory].sort((a,b) => b.earn - a.earn)[0]?.name || 'N/A';
    
    return `You are CounterOS, a highly intelligent AI business advisor embedded directly into the user's point-of-sale interface in India.
Current User Context:
Retailer: ${user.name} | Shop: ${user.shop} | Location: ${user.loc}
Business Category: ${user.cat}
Wallet Balance: ₹${walletBalance}
Inventory Count: ${invCount} products
Low Stock Alerts: ${lowStock}
Highest Margin Product: ${topProd}

Sample Current Inventory Data:
${invData}

Rules:
1. Act exclusively as their strategic advisor. Do not mention that you're an AI model or a language model.
2. Structure responses cleanly with line-breaks and bold text where helpful.
3. Your responses MUST be concise, practical, and highly specific to the provided inventory metrics and their specific business vertical. No generic filler.
4. Calculate possible profits or restock suggestions using the data provided.`;
  };

  const handleSend = async (overrideMsg) => {
    const msgOut = (overrideMsg || inputMsg).trim();
    if (!msgOut) return;
    
    setInputMsg('');
    setShowQuick(false);
    
    setMessages(prev => [...prev, { role: 'user', text: msgOut }]);
    setIsTyping(true);

    const systemCtx = getSystemContext();
    const promptText = messages.length === 1 ? `${systemCtx}\n\nUser question: ${msgOut}` : msgOut;
    
    // Use OpenAI directly for dynamic responses
    console.log('📡 Processing:', msgOut);
    const reply = await Intelligence.askOpenAIText(promptText, systemCtx);
    
    setIsTyping(false);
    if (reply) {
      console.log('✅ Got dynamic AI response from OpenAI API');
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } else {
      console.log('⚠️ OpenAI unavailable - Using smart fallback (varied)');
      console.log('💡 TIP: To enable OpenAI, add VITE_OPENAI_API_KEY=sk-... in .env file');
      // Fallback generates VARIED responses based on data patterns
      const fallback = Intelligence.analyzeBusinessData(systemCtx);
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
    }
  };



  return (
    <div className="screen active" style={{ background: 'var(--bg1)' }}>
      <Header title="CounterOS Store Business Advisor" subtitle="Smart Business Advisor" backTo="/home" />
      
      <div className="scroller" ref={scrollRef} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
           <div className="chip chip-g" style={{ background: 'var(--bg2)', color: 'var(--t3)', border: '1px solid var(--bdr)' }}>Today</div>
        </div>

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp .28s both' }}>
            <div className={m.role === 'ai' ? 'cbubble-ai' : 'cbubble-user'} dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>') }}>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', animation: 'fadeUp .25s both' }}>
            <div className="cbubble-ai">
              <div style={{ display: 'flex', gap: '4px' }}>
                <div className="tdot"></div><div className="tdot"></div><div className="tdot"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg2)', padding: '.75rem 1rem', borderTop: '1px solid var(--bdr)' }}>
        {showQuick && (
          <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', marginBottom: '.75rem', paddingBottom: '4px', scrollbarWidth: 'none' }}>
             <button onClick={() => handleSend('What should I reorder?')} className="ifbtn">What should I reorder?</button>
             <button onClick={() => handleSend('How to reach Diamond tier?')} className="ifbtn">How to reach Diamond tier?</button>
             <button onClick={() => handleSend('Top performing products?')} className="ifbtn">Top performing products?</button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '.5rem' }}>
           <input 
             className="ifield" 
             placeholder="Ask CounterOS AI..." 
             value={inputMsg}
             onChange={e => setInputMsg(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             style={{ padding: '.7rem 1rem', borderRadius: 'var(--r12)' }}
           />
           <button 
             onClick={() => handleSend()}
             style={{ width: '2.8rem', height: '2.8rem', borderRadius: 'var(--r12)', background: 'linear-gradient(135deg, var(--g4), var(--g6))', border: 'none', color: '#021302', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
           >
              <span className="material-symbols-outlined fi">send</span>
           </button>
        </div>
      </div>
    </div>
  );
};
