import React from 'react';
import Markdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "w-full py-8 flex justify-center border-b border-zinc-100",
      isUser ? "bg-white" : "bg-zinc-50"
    )}>
      <div className="w-full max-w-3xl px-6 flex gap-6">
        <div className={cn(
          "w-8 h-8 rounded shrink-0 flex items-center justify-center",
          isUser ? "bg-zinc-800 text-white" : "bg-brand-primary text-white"
        )}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold mb-1 flex items-center gap-2">
            {isUser ? "Tú" : "BizMind-AI"}
          </div>
          <div className="markdown-body">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};
