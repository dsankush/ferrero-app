import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Intelligence } from '../../services/intelligence';
import { ErrorLogger } from '../../services/errorLogger';

export const BusinessBuddy = React.memo(() => {
    const { user, inventory, walletBalance } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: `Hey ${user.name.split(' ')[0]}! I'm your CounterOS Buddy. How can I help you with your business today? 💼` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const getFullContext = useCallback(() => {
        const lowStock = inventory.filter(p => p.qty < 10).map(p => p.name).join(', ');
        return `Persona: You are "CounterOS Buddy", a friendly, proactive, and witty business assistant. 
Current State:
- Retailer: ${user.name}
- Wallet: ₹${walletBalance}
- Inventory: ${inventory.length} items
- Low Stock items: ${lowStock || 'None'}
- Shop Category: ${user.cat}

Keep responses short, actionable, and encouraging. Use emojis!`;
    }, [user.name, walletBalance, inventory, user.cat]);

    const handleSend = useCallback(async () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);
        setError(null);

        try {
            // Set a timeout for the AI response
            const timeoutPromise = new Promise((_, reject) =>
                timeoutRef.current = setTimeout(
                    () => reject(new Error('Advisor response took too long. Please try again.')),
                    12000 // 12 second timeout
                )
            );

            const responsePromise = Intelligence.ask(userMsg, getFullContext());
            const response = await Promise.race([responsePromise, timeoutPromise]);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            setIsTyping(false);
            
            if (response && response.trim()) {
                setMessages(prev => [...prev, { role: 'ai', text: response }]);
            } else {
                throw new Error('Empty response from Advisor');
            }
        } catch (error) {
            setIsTyping(false);
            
            // Log the error
            ErrorLogger.logAIError('BusinessBuddy', error, userMsg);

            // Show error message to user
            const errorMsg = error.message.includes('timeout')
                ? "🌐 Slow connection! I'm thinking... Please try again in a moment."
                : error.message.includes('API')
                ? "⚡ I need to recharge my brain. Try again soon!"
                : "😅 That request stumped me. Ask me something else!";

            setError(errorMsg);
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: errorMsg,
                isError: true
            }]);
        }
    }, [input, getFullContext]);

    // Handle Enter key
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    return (
        <>
            {/* The Floating Bubble */}
            <button 
                className="buddy-fab" 
                onClick={() => setIsOpen(true)}
                aria-label="Open Chat with Business Buddy"
                title="Chat with Business Buddy"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>auto_awesome</span>
            </button>

            {/* The Chat Panel */}
            {isOpen && (
                <div 
                    className="buddy-panel" 
                    onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                    role="dialog"
                    aria-label="Business Buddy Chat"
                >
                    <div className="buddy-content">
                        {/* Header */}
                        <div style={{ 
                            padding: '1.25rem', 
                            borderBottom: '1px solid var(--bdr)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: 'var(--bg2)', 
                            borderRadius: '1.5rem 1.5rem 0 0' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                                <div style={{ 
                                    width: '2.5rem', 
                                    height: '2.5rem', 
                                    background: 'linear-gradient(135deg, var(--g4), var(--g6))', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: '#000', fontSize: '1.4rem' }}>face</span>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>Business Buddy</p>
                                    <p style={{ fontSize: '.7rem', color: 'var(--g4)', fontWeight: 700 }}>
                                        {isTyping ? '✍️ Typing...' : '✅ Online & Ready'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                style={{ 
                                    background: 'var(--bg3)', 
                                    border: 'none', 
                                    color: 'var(--t2)', 
                                    width: '2.2rem', 
                                    height: '2.2rem', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                aria-label="Close chat"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Messages */}
                        <div 
                            ref={scrollRef} 
                            style={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                padding: '1.25rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '1rem' 
                            }}
                        >
                            {messages.map((m, i) => (
                                <div 
                                    key={i} 
                                    className={m.role === 'ai' ? 'msg-ai' : 'msg-user'}
                                    style={{
                                        opacity: m.isError ? 0.8 : 1,
                                        background: m.isError ? 'rgba(239, 68, 68, 0.1)' : undefined
                                    }}
                                    dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }}
                                />
                            ))}
                            {isTyping && (
                                <div className="msg-ai">
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <div className="tdot" style={{ background: 'var(--g4)' }}></div>
                                        <div className="tdot" style={{ background: 'var(--g4)', animationDelay: '0.2s' }}></div>
                                        <div className="tdot" style={{ background: 'var(--g4)', animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1rem', background: 'var(--bg2)', borderTop: '1px solid var(--bdr)' }}>
                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--t2)',
                                    marginBottom: '0.75rem'
                                }}>
                                    ⚠️ {error}
                                </div>
                            )}
                            <div style={{ 
                                display: 'flex', 
                                gap: '.5rem', 
                                background: 'var(--bg1)', 
                                padding: '.4rem', 
                                borderRadius: 'var(--r12)', 
                                border: '1px solid var(--bdr)' 
                            }}>
                                <input 
                                    className="ifield" 
                                    style={{ border: 'none', background: 'transparent' }}
                                    placeholder="Ask anything..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isTyping}
                                    aria-label="Message input"
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={isTyping || !input.trim()}
                                    style={{
                                        background: 'var(--g4)',
                                        border: 'none',
                                        color: '#000',
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: 'var(--r8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isTyping || !input.trim() ? 0.5 : 1,
                                        fontWeight: 800
                                    }}
                                    aria-label="Send message"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

BusinessBuddy.displayName = 'BusinessBuddy';
