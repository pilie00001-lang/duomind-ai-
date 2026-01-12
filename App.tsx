
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, StopCircle, PlayCircle, Menu, X, Zap, Code, Monitor, FileUp, ChevronDown, Bot } from 'lucide-react';
import { Message, Sender, Conversation, ProjectFiles, Agent } from './types';
import { generateNativeGeminiResponse } from './services/googleGenAIService';
import { generateLocalResponse } from './services/localAIService';
import { getCodingSystemPrompt, getDiscussionSystemPrompt, parseCodeFromResponse } from './services/codingPrompts';
import { ChatBubble } from './components/ChatBubble';
import { CodeViewer } from './components/CodeViewer';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_CONVERSATION: Conversation = {
  id: uuidv4(),
  title: 'Projet Mobile',
  messages: [],
  lastUpdated: Date.now(),
  participants: [Sender.GeminiNative, Sender.Local], 
  files: {},
  isCodeMode: true
};

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([INITIAL_CONVERSATION]);
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATION.id);
  const [inputText, setInputText] = useState('');
  const [isAutoLoop, setIsAutoLoop] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'code'>('chat');
  const [activeFile, setActiveFile] = useState<string>('');
  const [agents] = useState<Agent[]>([
    { id: 'a1', type: Sender.GeminiNative, name: 'Gemini Cloud', color: 'teal', isActive: true },
    { id: 'a2', type: Sender.Local, name: 'IA Mobile', color: 'orange', isActive: true }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0];
  const filesRef = useRef<ProjectFiles>(activeConversation.files);

  useEffect(() => {
    filesRef.current = activeConversation.files;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation.messages]);

  const handleUpdateFiles = (newFiles: ProjectFiles) => {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, files: { ...c.files, ...newFiles } } : c));
  };

  const addMessage = useCallback((text: string, sender: Sender, authorName?: string) => {
    const { updatedFiles, cleanText } = parseCodeFromResponse(text);
    if (Object.keys(updatedFiles).length > 0) handleUpdateFiles(updatedFiles);

    setConversations(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, { id: uuidv4(), sender, authorName, text: cleanText, timestamp: Date.now() }],
    } : c));
  }, [activeId]);

  const runTurn = async () => {
    if (isProcessing) return;
    const activeAgents = agents.filter(a => a.isActive);
    if (activeAgents.length === 0) return setIsAutoLoop(false);

    const lastMsg = activeConversation.messages[activeConversation.messages.length - 1];
    let nextAgent = activeAgents[0];
    if (lastMsg && lastMsg.sender !== Sender.User) {
      const idx = activeAgents.findIndex(a => a.name === lastMsg.authorName);
      nextAgent = activeAgents[(idx + 1) % activeAgents.length];
    }

    setIsProcessing(true);
    try {
      const sys = activeConversation.isCodeMode 
        ? getCodingSystemPrompt(nextAgent.type, filesRef.current)
        : getDiscussionSystemPrompt(nextAgent.type);
      
      const res = nextAgent.type === Sender.GeminiNative 
        ? await generateNativeGeminiResponse(activeConversation.messages, [], sys, nextAgent.name)
        : await generateLocalResponse(activeConversation.messages, sys, nextAgent.name);
      
      addMessage(res, nextAgent.type, nextAgent.name);
    } catch (e) {
      addMessage("⚠️ Interruption de l'essaim.", Sender.Local, "Système");
      setIsAutoLoop(false);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isAutoLoop && !isProcessing) {
      const t = setTimeout(runTurn, 2000);
      return () => clearTimeout(t);
    }
  }, [isAutoLoop, isProcessing, activeConversation.messages.length]);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = { ...activeConversation.files };
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      newFiles[f.name] = await f.text();
    }
    handleUpdateFiles(newFiles);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-zinc-300">
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={onFileUpload} />
      
      {/* Sidebar Mobile */}
      <div className={`fixed inset-y-0 left-0 z-[100] w-64 glass shadow-2xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-black italic flex items-center gap-2"><Zap size={20} className="text-orange-500 fill-orange-500"/> DUOMIND</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X/></button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase transition-all mb-4">
            <FileUp size={16}/> Importer Fichiers
          </button>
          <div className="flex-1 overflow-y-auto space-y-6">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Unités de calcul</h2>
            {agents.map(a => (
              <div key={a.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold">{a.name}</span>
                <div className={`w-2 h-2 rounded-full ${a.isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white/5 rounded-lg"><Menu size={20}/></button>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button onClick={() => setViewMode('chat')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${viewMode === 'chat' ? 'bg-white text-black' : 'text-zinc-500'}`}>DÉBAT</button>
            <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${viewMode === 'code' ? 'bg-white text-black' : 'text-zinc-500'}`}>CODE</button>
          </div>
          <button onClick={() => setIsAutoLoop(!isAutoLoop)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${isAutoLoop ? 'bg-red-500/20 text-red-500' : 'bg-orange-600 text-white'}`}>
            {isAutoLoop ? 'Stop' : 'Run'}
          </button>
        </header>

        <main className="flex-1 overflow-hidden p-2 md:p-6">
          <div className="h-full glass rounded-[2rem] overflow-hidden flex flex-col">
            {viewMode === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scroll-smooth">
                  {activeConversation.messages.map(m => <ChatBubble key={m.id} message={m} />)}
                  {isProcessing && <div className="flex gap-2 p-2 opacity-50"><Bot size={14} className="animate-spin"/><span className="text-[10px] uppercase font-bold tracking-widest">Inférence...</span></div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-black/20 border-t border-white/5">
                  <form onSubmit={e => { e.preventDefault(); if(inputText.trim()){ addMessage(inputText, Sender.User); setInputText(''); setIsAutoLoop(true); }}} className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/10">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Lancez un sujet..." className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-white" />
                    <button type="submit" className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center"><Send size={18}/></button>
                  </form>
                </div>
              </>
            ) : (
              <CodeViewer files={activeConversation.files} activeFile={activeFile} onFileSelect={setActiveFile} onUpdateFiles={handleUpdateFiles} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
