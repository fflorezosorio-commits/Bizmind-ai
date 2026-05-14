import React from 'react';
import { Plus, MessageSquare, Briefcase, GraduationCap, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  onNewChat: () => void;
  chats: string[];
}

export const Sidebar = ({ onNewChat, chats }: SidebarProps) => {
  return (
    <div className="w-64 bg-white h-screen text-zinc-600 flex flex-col shrink-0 border-r border-zinc-100">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            B
          </div>
          <span className="font-display font-bold text-lg text-zinc-900 tracking-tight">BizMind-AI</span>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm font-medium mb-6 text-zinc-700"
        >
          <Plus size={16} />
          Nuevo Chat
        </button>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-3">Historial de chat</p>
          <div className="space-y-0.5">
            {chats.length > 0 ? (
              chats.map((chat, index) => (
                <NavItem key={index} icon={<MessageSquare size={16} />} label={chat} active={index === 0} />
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-zinc-400 italic">
                No hay consultas recientes
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-100 space-y-1">
        <NavItem icon={<Settings size={16} />} label="Ajustes" />
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 transition-colors text-sm text-zinc-700">
          <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
            JD
          </div>
          <span className="truncate">Consultor Invitado</span>
        </div>
        <div className="pt-2 px-3">
          <p className="text-[9px] text-zinc-400 leading-tight">
            © 2026 FFlorez. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
    active ? "bg-brand-primary/10 text-brand-primary" : "hover:bg-zinc-50 text-zinc-500"
  )}>
    {icon}
    <span className="truncate">{label}</span>
  </button>
);
