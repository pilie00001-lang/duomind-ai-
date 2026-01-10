
import React from 'react';
import { Message, Sender } from '../types';
import { Bot, User, Cpu, Sparkles, Zap } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  
  // Configuration par défaut
  let alignClass = "justify-start";
  let bgClass = "bg-blue-900/30 border border-blue-800 text-blue-100";
  let Icon = Bot;
  let name = "Gemini (Puter)";
  let iconColor = "text-blue-400";

  if (isUser) {
    alignClass = "justify-end";
    bgClass = "bg-white text-black";
    Icon = User;
    name = "Vous";
    iconColor = "text-gray-400";
  } else if (message.sender === Sender.Puter) {
    bgClass = "bg-gray-800 border border-gray-700 text-gray-100";
    Icon = Cpu;
    name = "GPT-4o (Puter)";
    iconColor = "text-purple-400";
  } else if (message.sender === Sender.Claude) {
    bgClass = "bg-amber-900/20 border border-amber-800/50 text-amber-100";
    Icon = Sparkles;
    name = "Claude 3";
    iconColor = "text-amber-400";
  } else if (message.sender === Sender.GeminiNative) {
    // Nouveau style pour Gemini Native
    bgClass = "bg-teal-900/30 border border-teal-700/50 text-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.1)]";
    Icon = Zap;
    name = "Gemini Flash Lite";
    iconColor = "text-teal-400";
  }

  return (
    <div className={`flex w-full mb-4 ${alignClass}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          {!isUser && <Icon size={14} className={iconColor} />}
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{name}</span>
          {isUser && <Icon size={14} className={iconColor} />}
        </div>
        
        <div className={`px-4 py-3 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap ${bgClass} ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          {message.text}
        </div>
      </div>
    </div>
  );
};
