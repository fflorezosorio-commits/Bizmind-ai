import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Building2, BookOpen, Lightbulb, TrendingUp, Bot, LogIn } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AuthModal } from './AuthModal';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAreaProps {
  onFirstMessage?: (title: string) => void;
}

export const ChatArea = ({ onFirstMessage }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Automatically trigger auth modal after 3 user messages if not logged in
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if (userMessageCount >= 3 && !user && !isLoading && !isAuthModalOpen) {
      setIsAuthModalOpen(true);
    }
  }, [messages, user, isLoading, isAuthModalOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    
    // Notify parent if this is the first message
    if (messages.length === 0 && onFirstMessage) {
      onFirstMessage(input.slice(0, 30) + (input.length > 30 ? '...' : ''));
    }

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok) throw new Error('Error de red');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantMsg: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { value, done } = await reader?.read() || { value: undefined, done: true };
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantContent;
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative bg-white">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto text-brand-primary">
                <Sparkles size={32} />
              </div>
              <h1 className="text-4xl font-display font-bold text-zinc-900">¿En qué puedo asistirte hoy?</h1>
              <p className="text-zinc-500 max-w-md mx-auto">Tu experto en negocios de BizMind está listo para analizar, planificar y resolver tus desafíos corporativos.</p>
            </motion.div>
          </div>
        ) : (
          <div className="pb-32">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && messages[messages.length - 1].role === 'user' && (
              <div className="w-full py-8 flex justify-center bg-zinc-50">
                <div className="w-full max-w-3xl px-6 flex gap-6">
                  <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-brand-primary text-white animate-pulse">
                    <Bot size={18} />
                  </div>
                  <div className="animate-pulse flex space-x-2 items-center text-zinc-400">
                    <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Haz una consulta sobre negocios..."
              rows={1}
              className={cn(
                "w-full bg-white border border-zinc-200 rounded-xl px-4 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-lg resize-none min-h-[56px] max-h-48 overflow-y-auto"
              )}
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-3 bottom-3 p-2 rounded-lg transition-all",
                input.trim() && !isLoading ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center mt-3">
            BizMind puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

const SuggestionCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-brand-primary/30 hover:shadow-md transition-all text-left group"
  >
    <div className="text-brand-primary mb-2 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="font-semibold text-sm mb-1">{title}</div>
    <div className="text-zinc-500 text-xs line-clamp-1">{description}</div>
  </button>
);
