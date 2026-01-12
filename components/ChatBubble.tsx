
import React from 'react';
import { Message, Sender } from '../types';
import { Bot, User, Zap, Monitor } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  
  let alignClass = "justify-start";
  let bgClass = "bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-100 shadow-xl";
  let Icon = Bot;
  let iconColor = "text-zinc-400";

  if (isUser) {
    alignClass = "justify-end";
    bgClass = "bg-orange-600/20 backdrop-blur-xl border border-orange-500/30 text-white shadow-lg shadow-orange-900/10";
    Icon = User;
    iconColor = "text-orange-400";
  } else if (message.sender === Sender.Local) {
    bgClass = "bg-zinc-900/40 backdrop-blur-2xl border border-white/5 text-orange-200";
    Icon = Monitor;
    iconColor = "text-orange-500";
  } else if (message.sender === Sender.GeminiNative) {
    bgClass = "bg-teal-950/20 backdrop-blur-2xl border border-teal-500/20 text-teal-100";
    Icon = Zap;
    iconColor = "text-teal-400";
  }

  const displayName = message.authorName || (isUser ? "Vous" : "Assistant");

  return (
    <div className={`flex w-full mb-8 ${alignClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-2 px-2">
          {!isUser && <Icon size={14} className={`${iconColor} animate-pulse`} />}
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{displayName}</span>
          {isUser && <Icon size={14} className={iconColor} />}
        </div>
        
        <div className={`px-6 py-5 rounded-[2rem] text-[15px] leading-relaxed whitespace-pre-wrap ${bgClass} ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          {message.text}
        </div>
      </div>
    </div>
  );
};
