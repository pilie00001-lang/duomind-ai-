
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, StopCircle, PlayCircle, MessageSquare, Menu, X, Sidebar, CheckCircle2, AlertTriangle, Code, Layout, BookOpen, Bell, Download, Archive, FolderDown, Globe, Cpu } from 'lucide-react';
import { Message, Sender, Conversation, ProjectFiles } from './types';
import { generateGeminiResponse } from './services/geminiService';
import { generatePuterResponse } from './services/puterService';
import { generateClaudeResponse } from './services/claudeService';
import { getCodingSystemPrompt, parseCodeFromResponse } from './services/codingPrompts';
import { ChatBubble } from './components/ChatBubble';
import { CodeViewer } from './components/CodeViewer';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_CONVERSATION: Conversation = {
  id: 'init-1',
  title: 'Projet Collaboratif Connecté',
  messages: [],
  lastUpdated: Date.now(),
  participants: [Sender.Gemini, Sender.Puter],
  files: {},
  isCodeMode: true
};

const getParticipantLabel = (sender: Sender): string => {
  switch (sender) {
    case Sender.Gemini: return 'Gemini 2.5 Flash (Web)';
    case Sender.Puter: return 'GPT-5.2 (Brain)';
    case Sender.Claude: return 'Claude 3.5 (Logic)';
    case Sender.User: return 'Utilisateur';
    default: return 'IA Inconnue';
  }
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
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Sender[]>([Sender.Gemini, Sender.Puter]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0];
  
  const filesRef = useRef<ProjectFiles>(activeConversation.files);
  useEffect(() => {
    filesRef.current = activeConversation.files;
  }, [activeConversation.files]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation.messages, isProcessing]);

  const updateFiles = useCallback((newFiles: ProjectFiles) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeId) {
        return { ...conv, files: { ...conv.files, ...newFiles } };
      }
      return conv;
    }));
  }, [activeId]);

  const addMessage = useCallback((text: string, sender: Sender) => {
    let cleanMsg = text;
    if (activeConversation.isCodeMode) {
      const { updatedFiles, cleanText } = parseCodeFromResponse(text);
      if (Object.keys(updatedFiles).length > 0) {
        updateFiles(updatedFiles);
        cleanMsg = cleanText;
      }
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeId) {
        return {
          ...conv,
          messages: [...conv.messages, { id: uuidv4(), sender, text: cleanMsg, timestamp: Date.now() }],
          lastUpdated: Date.now()
        };
      }
      return conv;
    }));
  }, [activeId, activeConversation.isCodeMode, updateFiles]);

  const getAIResponse = async (sender: Sender, history: Message[]): Promise<string> => {
    const systemInstruction = activeConversation.isCodeMode 
      ? getCodingSystemPrompt(sender, filesRef.current)
      : undefined;

    const participants = activeConversation.participants;

    switch (sender) {
      case Sender.Gemini: return await generateGeminiResponse(history, participants, systemInstruction);
      case Sender.Puter: return await generatePuterResponse(history, participants, systemInstruction);
      case Sender.Claude: return await generateClaudeResponse(history, participants);
      default: return "Erreur : IA inconnue";
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const runLoop = async () => {
      if (!isAutoLoop || isProcessing || apiError) return;
      
      const lastMsg = activeConversation.messages[activeConversation.messages.length - 1];
      const participants = activeConversation.participants;
      let nextSender: Sender = participants[0];

      if (lastMsg && lastMsg.sender !== Sender.User) {
        const lastIndex = participants.indexOf(lastMsg.sender);
        nextSender = participants[(lastIndex + 1) % participants.length];
      }

      setIsProcessing(true);
      try {
        const response = await getAIResponse(nextSender, activeConversation.messages);
        addMessage(response, nextSender);
      } catch (err) {
        setApiError("Boucle interrompue.");
        setIsAutoLoop(false);
      } finally {
        setIsProcessing(false);
      }
    };

    if (isAutoLoop && !isProcessing && !apiError) {
      timeoutId = setTimeout(runLoop, 1500); 
    }
    return () => clearTimeout(timeoutId);
  }, [isAutoLoop, isProcessing, apiError, activeConversation.messages, activeConversation.participants, addMessage]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setApiError(null);
    addMessage(inputText, Sender.User);
    setInputText('');
  };

  const handleInstallProject = async () => {
    const files = activeConversation.files;
    const fileNames = Object.keys(files);
    if (fileNames.length === 0) return;

    for (const name of fileNames) {
      const content = files[name];
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await new Promise(r => setTimeout(r, 200));
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h1 className="font-bold flex items-center gap-2 italic text-zinc-100 uppercase tracking-tighter">
              <Cpu className="text-blue-500 animate-pulse" size={18} /> DuoMind <span className="text-[8px] bg-zinc-800 px-1 rounded text-zinc-500">v2.1</span>
            </h1>
            <button onClick={() => setIsNewChatModalOpen(true)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"><Plus size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map(conv => (
              <div key={conv.id} onClick={() => setActiveId(conv.id)} className={`p-3 rounded-lg cursor-pointer truncate text-sm transition-all ${activeId === conv.id ? 'bg-zinc-900 border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {conv.title}
                {conv.isCodeMode && <span className="ml-2 text-[8px] bg-blue-600 px-1 rounded font-black text-white">LIVE</span>}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-zinc-900 bg-zinc-950 space-y-2">
             <div className="flex items-center gap-2 text-[10px] text-zinc-600 mb-2 px-1">
               <Globe size={12} className="text-green-500" /> Grounding Web Activé
             </div>
             <button 
              onClick={handleInstallProject} 
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-black transition-all shadow-lg"
             >
               <FolderDown size={16} /> INSTALLER LE PROJET
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-zinc-400"><Menu size={20} /></button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Swarm Intelligence</span>
              <div className="flex gap-4">
                 <button onClick={() => setViewMode('chat')} className={`text-xs font-black tracking-tight ${viewMode === 'chat' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>FLUX DE DONNÉES</button>
                 <button onClick={() => setViewMode('code')} className={`text-xs font-black tracking-tight ${viewMode === 'code' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>TERMINAL CODE</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAutoLoop(!isAutoLoop)} 
              className={`px-4 py-2 rounded-xl border text-[10px] font-black transition-all ${isAutoLoop ? 'bg-red-600 border-red-400 animate-pulse text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
            >
              {isAutoLoop ? 'SESSION ACTIVE' : 'DÉMARRER BOUCLE'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {viewMode === 'chat' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {activeConversation.messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-zinc-500 italic text-[10px] font-bold px-4">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce delay-100"></div>
                    </div>
                    SYNCHRONISATION INTER-UNITÉS...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                    placeholder="Envoyez un ordre de mission..." 
                    className="flex-1 bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-800 outline-none focus:border-blue-500 transition-all text-sm placeholder:text-zinc-700" 
                  />
                  <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <CodeViewer files={activeConversation.files} activeFile={activeFile} onFileSelect={setActiveFile} />
          )}
        </main>
      </div>

      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-2 tracking-tighter">CONFIGURER L'ESSAIM</h2>
            <p className="text-zinc-500 text-xs mb-6 font-medium">Sélectionnez les unités IA pour cette mission.</p>
            <div className="space-y-3 mb-8">
              {[Sender.Gemini, Sender.Puter, Sender.Claude].map((sender) => (
                <button key={sender} onClick={() => {
                  if (selectedParticipants.includes(sender)) setSelectedParticipants(prev => prev.filter(p => p !== sender));
                  else setSelectedParticipants(prev => [...prev, sender]);
                }} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedParticipants.includes(sender) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 opacity-60'}`}>
                  <span className="font-bold flex items-center gap-2">
                    {sender === Sender.Gemini && <Globe size={14} />}
                    {getParticipantLabel(sender)}
                  </span>
                  {selectedParticipants.includes(sender) && <CheckCircle2 size={20} />}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsNewChatModalOpen(false)} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold hover:bg-zinc-700 transition-all">ANNULER</button>
              <button onClick={() => {
                const newConv: Conversation = { id: uuidv4(), title: 'Opération ' + uuidv4().slice(0,4), messages: [], lastUpdated: Date.now(), participants: [...selectedParticipants], files: {}, isCodeMode: true };
                setConversations(prev => [newConv, ...prev]);
                setActiveId(newConv.id);
                setIsNewChatModalOpen(false);
              }} className="flex-1 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all">LANCER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
