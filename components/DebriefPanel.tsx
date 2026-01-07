import React, { useEffect, useState, useRef } from 'react';
import { Message } from '../types';
import { generateAnalysis } from '../services/analystService';
import { Activity, Radio, ChevronRight } from 'lucide-react';

interface DebriefPanelProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

interface Insight {
  id: number;
  text: string;
  timestamp: string;
}

export const DebriefPanel: React.FC<DebriefPanelProps> = ({ messages, isOpen, onClose }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastAnalyzedLengthRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-analyze when messages increase by at least 2 to avoid spamming on every single line
  // or if it's the very first message
  useEffect(() => {
    const msgCount = messages.length;
    
    // Si pas de nouveaux messages significatifs, on ne fait rien
    if (msgCount === lastAnalyzedLengthRef.current) return;
    
    // On attend qu'il y ait au moins 2 nouveaux messages ou que ce soit le début pour analyser
    // Cela permet de "débriefer" des blocs d'échange plutôt que chaque phrase
    const delta = msgCount - lastAnalyzedLengthRef.current;
    if (msgCount > 0 && (delta >= 2 || (msgCount === 1 && lastAnalyzedLengthRef.current === 0))) {
      
      // Petit délai pour laisser le temps à l'écriture de se finir visuellement
      const timer = setTimeout(async () => {
        setIsAnalyzing(true);
        const analysis = await generateAnalysis(messages);
        
        if (analysis) {
          const newInsight: Insight = {
            id: Date.now(),
            text: analysis,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setInsights(prev => [newInsight, ...prev]); // Add to top
        }
        
        setIsAnalyzing(false);
        lastAnalyzedLengthRef.current = msgCount;
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full absolute right-0 top-0 md:relative z-20 shadow-xl md:shadow-none">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2 text-amber-500">
          <Activity size={20} />
          <h2 className="font-bold text-sm tracking-wider uppercase">Débrief Live</h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white md:hidden">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" ref={scrollRef}>
        {insights.length === 0 ? (
          <div className="text-center text-gray-600 mt-10 text-sm italic">
            <Radio className="mx-auto mb-2 opacity-50" size={32} />
            En attente de données pour analyse...
          </div>
        ) : (
          insights.map(insight => (
            <div key={insight.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[10px] text-gray-500 font-mono">{insight.timestamp}</span>
              </div>
              <p className="text-sm text-gray-300 leading-snug">
                {insight.text}
              </p>
            </div>
          ))
        )}
      </div>

      {isAnalyzing && (
        <div className="p-2 bg-zinc-900 border-t border-zinc-800 text-[10px] text-amber-500 flex items-center justify-center gap-2">
           <span className="animate-pulse">●</span> Analyse en cours...
        </div>
      )}
    </div>
  );
};