'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_REPLIES = [
  'Que faire à Djerba ?',
  'Meilleurs restaurants à Tunis ?',
  'Conseils pour le désert',
  'Météo en Tunisie',
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Marhba ! 👋 Je suis **Hayet**, votre guide touristique IA pour la Tunisie. Comment puis-je vous aider à planifier votre voyage parfait ?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [degradedMode, setDegradedMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const data = await res.json();
      setDegradedMode(Boolean(data.degraded));
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Je suis là pour vous aider à planifier votre voyage en Tunisie.' }]);
    } catch {
      setDegradedMode(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Désolée, connexion perdue. Réessayez ! 🌐',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl shadow-xl flex items-center justify-center transition-colors"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-olive-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-4xl shadow-2xl border border-sand-100 overflow-hidden flex flex-col"
            style={{ maxHeight: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-body font-semibold text-white">Hayet ✨</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-olive-300 rounded-full animate-pulse" />
                  <span className="text-white/70 text-xs font-body">Guide touristique IA</span>
                </div>
                {degradedMode && (
                  <p className="text-[11px] text-white/80 font-body mt-1">Mode secours actif (service Gemini temporairement limité)</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '380px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'assistant' ? 'bg-terracotta-100' : 'bg-sand-200'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot size={16} className="text-terracotta-500" />
                      : <User size={16} className="text-midnight/60" />
                    }
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-sand-50 text-midnight border border-sand-100 rounded-tl-sm'
                        : 'bg-terracotta-500 text-white rounded-tr-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-terracotta-100 flex items-center justify-center">
                    <Bot size={16} className="text-terracotta-500" />
                  </div>
                  <div className="bg-sand-50 border border-sand-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                          className="w-2 h-2 bg-terracotta-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-midnight/40 font-body mb-2">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-sand-100 hover:bg-sand-200 text-midnight px-3 py-1.5 rounded-xl font-body transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-sand-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Posez votre question…"
                  className="flex-1 bg-sand-50 border border-sand-200 rounded-2xl px-4 py-3 text-sm font-body text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-300 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
