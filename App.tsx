
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, StopCircle, PlayCircle, Menu, X, Zap, Bot, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Message, Sender, Conversation, Agent, ProjectFiles } from './types';
import { generateNativeGeminiResponse } from './services/googleGenAIService';
import { getCodingSystemPrompt, parseCodeFromResponse } from './services/codingPrompts';
import { ChatBubble } from './components/ChatBubble';
import { CodeViewer } from './components/CodeViewer';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_AGENTS: Agent[] = [
  { id: 'g1', type: Sender.GeminiNative, name: 'Gemini Alpha', color: 'teal', isActive: true },
  { id: 'g2', type: Sender.GeminiNative, name: 'Gemini Omega', color: 'orange', isActive: true }
];

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('dm_lite_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse conversations", e);
      }
    }
    return [{
      id: uuidv4(),
      title: 'Discussion Alpha',
      messages: [],
      lastUpdated: Date.now(),
      participants: ['g1', 'g2'],
      files: {},
      isCodeMode: true
    }];
  });
  
  const [activeId, setActiveId] = useState<string>(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isAutoLoop, setIsAutoLoop] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'code'>('chat');
  const [activeFile, setActiveFile] = useState<string>('');

  const activeChat = conversations.find(c => c.id === activeId) || conversations[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dm_lite_v1', JSON.stringify(conversations));
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, viewMode]);

  const updateActiveChat = useCallback((updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      return { ...c, ...updates, lastUpdated: Date.now() };
    }));
  }, [activeId]);

  const createNewChat = () => {
    const newId = uuidv4();
    const newChat: Conversation = {
      id: newId,
      title: `Projet ${conversations.length + 1}`,
      messages: [],
      lastUpdated: Date.now(),
      participants: ['g1', 'g2'],
      files: {},
      isCodeMode: true
    };
    setConversations([newChat, ...conversations]);
    setActiveId(newId);
    setIsSidebarOpen(false);
    setIsAutoLoop(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      // Si c'est la dernière conversation, on la réinitialise juste au lieu de la supprimer
      updateActiveChat({ messages: [], files: {}, title: 'Discussion Alpha' });
      return;
    }
    const newConversations = conversations.filter(c => c.id !== id);
    setConversations(newConversations);
    if (activeId === id) {
      setActiveId(newConversations[0].id);
    }
  };

  const addMessage = useCallback((text: string, sender: Sender, authorName?: string) => {
    const { updatedFiles, cleanText } = parseCodeFromResponse(text);
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      return {
        ...c,
        files: { ...c.files, ...updatedFiles },
        messages: [...c.messages, { id: uuidv4(), sender, authorName, text: cleanText, timestamp: Date.now() }]
      };
    }));
  }, [activeId]);

  const runTurn = async () => {
    if (isProcessing || !activeChat) return;
    const lastMsg = activeChat.messages[activeChat.messages.length - 1];
    const nextAgent = lastMsg?.authorName === INITIAL_AGENTS[0].name ? INITIAL_AGENTS[1] : INITIAL_AGENTS[0];

    setIsProcessing(true);
    try {
      const sys = getCodingSystemPrompt(nextAgent.type, activeChat.files);
      const res = await generateNativeGeminiResponse(activeChat.messages, INITIAL_AGENTS.map(a => a.name), sys, nextAgent.name);
      addMessage(res, nextAgent.type, nextAgent.name);
    } catch (e) {
      setIsAutoLoop(false);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isAutoLoop && !isProcessing) {
      const timer = setTimeout(runTurn, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAutoLoop, isProcessing, activeChat?.messages.length]);

  return (
    <div className="flex h-screen w-full bg-black text-zinc-300 overflow-hidden font-sans">
      {/* Sidebar de Gestion des Discussions */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 glass transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold flex items-center gap-2 text-white">
              <Zap size={18} className="text-orange-500 fill-orange-500"/> DUOMIND
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500"><X/></button>
          </div>

          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 p-3 mb-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
          >
            <Plus size={16}/> NOUVELLE SESSION
          </button>

          <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-2 mb-2">Tes Discussions</h2>
            {conversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setActiveId(c.id); setIsSidebarOpen(false); }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeId === c.id ? 'bg-orange-600/20 border border-orange-500/30 text-white' : 'text-zinc-500 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={14} className={activeId === c.id ? 'text-orange-500' : 'text-zinc-600'} />
                  <span className="text-xs truncate font-medium">{c.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteChat(e, c.id)}
                  className="p-2 text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                  title="Fermer cette discussion"
                >
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 px-2 py-2 bg-zinc-900/50 rounded-lg">
              <Bot size={14} className="text-orange-500 animate-pulse"/>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">IA Duo Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-black/40 backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-zinc-400"><Menu/></button>
          
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button onClick={() => setViewMode('chat')} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'chat' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>CHAT</button>
            <button onClick={() => setViewMode('code')} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'code' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>CODE</button>
          </div>

          <button 
            onClick={() => setIsAutoLoop(!isAutoLoop)} 
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${isAutoLoop ? 'bg-red-500 text-white shadow-lg' : 'bg-green-500/10 text-green-500 border border-green-500/20 active:scale-95'}`}
          >
            {isAutoLoop ? <StopCircle size={14}/> : <PlayCircle size={14}/>}
            <span className="hidden sm:inline uppercase">{isAutoLoop ? 'Pause' : 'Play'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-hidden">
          {viewMode === 'chat' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {activeChat?.messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                    <Zap size={40} className="mb-4 opacity-20" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-center">Tapez une consigne pour lancer le duo</p>
                  </div>
                )}
                {activeChat?.messages.map(m => <ChatBubble key={m.id} message={m} />)}
                {isProcessing && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl w-fit animate-pulse border border-white/5">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                    <span className="text-[10px] font-bold text-zinc-500">IA en cours...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-zinc-950/80 border-t border-white/5 backdrop-blur-xl">
                <form 
                  onSubmit={e => { e.preventDefault(); if(inputText.trim()){ addMessage(inputText, Sender.User); setInputText(''); setIsAutoLoop(true); }}} 
                  className="max-w-3xl mx-auto flex gap-2 glass p-1.5 rounded-2xl border border-white/10"
                >
                  <input 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                    placeholder="Un bug ? Une idée ?" 
                    className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-white placeholder:text-zinc-600" 
                  />
                  <button type="submit" className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-xl">
                    <Send size={18}/>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <CodeViewer 
              files={activeChat.files} 
              activeFile={activeFile} 
              onFileSelect={setActiveFile} 
              onUpdateFiles={(f: ProjectFiles) => updateActiveChat({ files: f })} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
