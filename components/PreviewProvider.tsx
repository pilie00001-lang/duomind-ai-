
import React, { useMemo, useState, useEffect } from 'react';
import { ProjectFiles } from '../types';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface PreviewProviderProps {
  files: ProjectFiles;
}

export const PreviewProvider: React.FC<PreviewProviderProps> = ({ files }) => {
  const [isLoading, setIsLoading] = useState(true);

  const mainHtmlFile = useMemo(() => {
    return Object.keys(files).find(f => f.endsWith('index.html')) || 
           Object.keys(files).find(f => f.endsWith('.html')) || 
           null;
  }, [files]);

  const generateSource = useMemo(() => {
    if (!mainHtmlFile || !files[mainHtmlFile]) return null;

    let html = files[mainHtmlFile];

    // On utilise un cache simple pour éviter de re-parser tout le projet inutilement
    const fileKeys = Object.keys(files);
    
    // Injection optimisée
    html = html.replace(/<script\s+src=["']\.\/([^"']+)["']\s*><\/script>/g, (match, fileName) => {
      const content = files[fileKeys.find(f => f.endsWith(fileName)) || ''];
      return content ? `<script>${content}</script>` : match;
    });

    html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\.\/([^"']+)["']\s*\/?>/g, (match, fileName) => {
      const content = files[fileKeys.find(f => f.endsWith(fileName)) || ''];
      return content ? `<style>${content}</style>` : match;
    });

    return html;
  }, [files, mainHtmlFile]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [generateSource]);

  if (!mainHtmlFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-zinc-950">
        <AlertCircle size={48} className="text-zinc-800 mb-4" />
        <h3 className="text-zinc-400 font-bold uppercase mb-2">Pas de HTML</h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
      <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-black text-zinc-500 uppercase">Live</span>
        </div>
      </div>
      
      <div className="flex-1 relative bg-white m-4 shadow-2xl rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-zinc-900 flex items-center justify-center">
            <Loader2 size={32} className="text-orange-500 animate-spin" />
          </div>
        )}
        <iframe
          title="Preview"
          srcDoc={generateSource || ''}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};
