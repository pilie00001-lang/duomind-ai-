
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, StopCircle, PlayCircle, Menu, X, Zap, Users, Code, Layout, Download, Save, FolderDown, CheckCircle2, Circle } from 'lucide-react';
import { Message, Sender, Conversation, ProjectFiles } from './types';
import { generateGeminiResponse } from './services/geminiService';
import { generatePuterResponse } from './services/puterService';
import { generateClaudeResponse } from './services/claudeService';
import { generateNativeGeminiResponse } from './services/googleGenAIService';
import { getCodingSystemPrompt, parseCodeFromResponse } from './services/codingPrompts';
import { ChatBubble } from './components/ChatBubble';
import { CodeViewer } from './components/CodeViewer';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_CONVERSATION: Conversation = {
  id: 'init-1',
  title: 'Projet Essaim Collaborative',
  messages: [],
  lastUpdated: Date.now(),
  participants: [Sender.Gemini, Sender.Puter, Sender.Claude], // Default
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
  const [apiError, setApiError] = useState<string | null>(null);

  // Sélection des agents actifs
  const [activeAgents, setActiveAgents] = useState<Sender[]>([Sender.GeminiNative, Sender.Puter]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0];
  const filesRef = useRef<ProjectFiles>(activeConversation.files);

  useEffect(() => {
    filesRef.current = activeConversation.files;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation.messages, activeConversation.files]);

  const toggleAgent = (agent: Sender) => {
    setActiveAgents(prev => {
      if (prev.includes(agent)) {
        // Empêcher de désactiver tous les agents (au moins 1 requis)
        if (prev.length === 1) return prev; 
        return prev.filter(a => a !== agent);
      }
      return [...prev, agent];
    });
  };

  const addMessage = useCallback((text: string, sender: Sender) => {
    let cleanMsg = text;
    const { updatedFiles, cleanText } = parseCodeFromResponse(text);
    
    if (Object.keys(updatedFiles).length > 0) {
      setConversations(prev => prev.map(conv => conv.id === activeId ? { 
        ...conv, 
        files: { ...conv.files, ...updatedFiles } 
      } : conv));
      cleanMsg = cleanText;
      if (!activeFile) setActiveFile(Object.keys(updatedFiles)[0]);
    }

    setConversations(prev => prev.map(conv => conv.id === activeId ? {
      ...conv,
      messages: [...conv.messages, { id: uuidv4(), sender, text: cleanMsg, timestamp: Date.now() }],
      lastUpdated: Date.now()
    } : conv));
  }, [activeId, activeFile]);

  const exportAllFiles = () => {
    const files = activeConversation.files;
    const fileNames = Object.keys(files);
    
    if (fileNames.length === 0) {
      alert("Aucun fichier à exporter.");
      return;
    }

    fileNames.forEach((name, index) => {
      setTimeout(() => {
        const content = files[name];
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, index * 200); 
    });
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const runLoop = async () => {
      if (!isAutoLoop || isProcessing || apiError) return;
      if (activeAgents.length === 0) return;

      const lastMsg = activeConversation.messages[activeConversation.messages.length - 1];
      
      // Déterminer le prochain expéditeur
      let nextSender: Sender = activeAgents[0];

      if (lastMsg && lastMsg.sender !== Sender.User) {
        // Trouver l'index de l'expéditeur précédent dans la liste ACTUELLE des agents actifs
        const lastIndex = activeAgents.indexOf(lastMsg.sender);
        
        if (lastIndex !== -1) {
           // On passe au suivant dans la liste active
           nextSender = activeAgents[(lastIndex + 1) % activeAgents.length];
        } else {
           // Si l'expéditeur précédent n'est plus actif, on recommence au début
           nextSender = activeAgents[0];
        }
      }

      setIsProcessing(true);
      try {
        const systemInstruction = getCodingSystemPrompt(nextSender, filesRef.current);
        let response = "";
        
        // Routage vers le bon service
        if (nextSender === Sender.GeminiNative) {
          response = await generateNativeGeminiResponse(activeConversation.messages, activeAgents, systemInstruction);
        } else if (nextSender === Sender.Gemini) {
          response = await generateGeminiResponse(activeConversation.messages, activeAgents, systemInstruction);
        } else if (nextSender === Sender.Puter) {
          response = await generatePuterResponse(activeConversation.messages, activeAgents, systemInstruction);
        } else if (nextSender === Sender.Claude) {
          response = await generateClaudeResponse(activeConversation.messages, activeAgents);
        }

        if (response.toLowerCase().includes("quota") || response.length < 2) {
          setApiError(`Limite atteinte pour ${nextSender}.`);
          // On ne coupe pas forcément la boucle si on a d'autres agents, mais ici c'est plus sûr
          setIsAutoLoop(false);
        } else {
          addMessage(response, nextSender);
        }
      } catch (err) {
        console.error("Loop error", err);
        setIsAutoLoop(false);
      } finally {
        setIsProcessing(false);
      }
    };

    if (isAutoLoop && !isProcessing) {
      // Si un seul agent est actif, il peut enchaîner plus vite
      const delay = activeAgents.length === 1 ? 2000 : 3500;
      timeoutId = setTimeout(runLoop, delay); 
    }
    return () => clearTimeout(timeoutId);
  }, [isAutoLoop, isProcessing, apiError, activeConversation.messages, activeAgents, addMessage]);

  const AgentToggle = ({ sender, label, color }: { sender: Sender, label: string, color: string }) => (
    <button 
      onClick={() => toggleAgent(sender)}
      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs mb-1 transition-all border ${
        activeAgents.includes(sender) 
          ? `bg-zinc-900 border-${color}-500/50 text-white` 
          : 'bg-transparent border-transparent text-zinc-600 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-${color}-500 ${activeAgents.includes(sender) ? 'animate-pulse' : 'opacity-20'}`} />
        {label}
      </div>
      {activeAgents.includes(sender) ? <CheckCircle2 size={14} className={`text-${color}-500`} /> : <Circle size={14} />}
    </button>
  );

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-zinc-900">
             <div className="flex items-center gap-2 font-black italic text-zinc-200">
               <Zap size={18} className="text-yellow-500 fill-yellow-500" /> DUOMIND <span className="text-[10px] bg-teal-900 text-teal-300 px-1 rounded">ULTRA</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 pl-2">Agents Actifs</div>
              <AgentToggle sender={Sender.GeminiNative} label="Gemini Flash Lite (Native)" color="teal" />
              <AgentToggle sender={Sender.Puter} label="GPT-4o (Puter)" color="purple" />
              <AgentToggle sender={Sender.Gemini} label="Gemini (Puter)" color="blue" />
              <AgentToggle sender={Sender.Claude} label="Claude 3" color="amber" />
            </div>

            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 pl-2">Projets</div>
            <button onClick={() => {
              const newId = uuidv4();
              setConversations(prev => [{...INITIAL_CONVERSATION, id: newId, title: `Nouveau Projet`}, ...prev]);
              setActiveId(newId);
            }} className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500 hover:text-white transition-colors mb-4">
              <Plus size={14}/> Créer Projet
            </button>
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => setActiveId(conv.id)} className={`p-3 rounded-xl cursor-pointer truncate text-sm transition-all border ${activeId === conv.id ? 'bg-zinc-900 border-zinc-700' : 'border-transparent text-zinc-600'}`}>
                {conv.title}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-zinc-900 space-y-2">
            <button onClick={exportAllFiles} className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all">
              <FolderDown size={16} className="text-blue-500"/> Installer le Projet
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-black z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><Menu size={20}/></button>
            <div className="flex bg-zinc-900 p-1 rounded-xl">
               <button onClick={() => setViewMode('chat')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>DISCUSSION</button>
               <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>ÉDITEUR CODE</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {Object.keys(activeConversation.files).length > 0 && viewMode === 'code' && (
              <span className="hidden sm:flex text-[10px] font-mono text-green-500 items-center gap-1">
                <Save size={10}/> {Object.keys(activeConversation.files).length} fichiers
              </span>
            )}
            <button 
              onClick={() => { setIsAutoLoop(!isAutoLoop); setApiError(null); }} 
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black transition-all ${isAutoLoop ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-blue-600 text-white'}`}
            >
              {isAutoLoop ? <><StopCircle size={16} /> STOP ESSAIM</> : <><PlayCircle size={16} /> LANCER ESSAIM</>}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {viewMode === 'chat' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeConversation.messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isProcessing && <div className="text-xs text-zinc-600 italic animate-pulse px-2">
                  {activeAgents.find(a => a === Sender.GeminiNative) && activeAgents.length === 1 ? 'Gemini Flash pense...' : 'Essaim actif...'}
                </div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-6 border-t border-zinc-900 bg-black">
                <form onSubmit={(e) => { e.preventDefault(); if(inputText.trim()){ addMessage(inputText, Sender.User); setInputText(''); } }} className="max-w-4xl mx-auto flex gap-3">
                  <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder={`Parler à ${activeAgents.length} agents...`} className="flex-1 bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl outline-none text-sm focus:border-zinc-600 transition-colors" />
                  <button type="submit" className="p-3 bg-white text-black rounded-2xl hover:scale-105 transition-transform"><Send size={20} /></button>
                </form>
              </div>
            </div>
          ) : (
            <CodeViewer files={activeConversation.files} activeFile={activeFile} onFileSelect={setActiveFile} />
          )}
        </main>
      </div>
    </div>
  );
}
