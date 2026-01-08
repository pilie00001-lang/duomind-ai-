
import React, { useState, useEffect } from 'react';
import { FileCode, FileText, FileJson, Globe, Save, ExternalLink, Download, Menu, ChevronLeft, Archive, Play, Eye } from 'lucide-react';
import { ProjectFiles } from '../types';

interface CodeViewerProps {
  files: ProjectFiles;
  activeFile: string;
  onFileSelect: (name: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, activeFile, onFileSelect }) => {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileNames = Object.keys(files);
  const currentContent = files[activeFile] || "";

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return <Globe size={16} className="text-orange-400" />;
    if (name.endsWith('.css')) return <FileText size={16} className="text-blue-400" />;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode size={16} className="text-yellow-400" />;
    return <FileJson size={16} className="text-zinc-400" />;
  };

  // Generate a blob URL for the HTML preview including CSS/JS if linked locally
  const generatePreview = () => {
    const html = files['index.html'] || files[Object.keys(files).find(f => f.endsWith('.html')) || ''] || "";
    if (!html) return "data:text/html,<html><body>Aucun fichier HTML trouvé pour la prévisualisation.</body></html>";
    
    // Simple bundling: replace local references with blobs or actual content
    let bundledHtml = html;
    
    // Injects CSS
    Object.keys(files).forEach(name => {
      if (name.endsWith('.css')) {
        bundledHtml = bundledHtml.replace(
          new RegExp(`<link.*?href=["'].*?${name}["'].*?>`, 'g'),
          `<style>${files[name]}</style>`
        );
      }
      if (name.endsWith('.js')) {
        bundledHtml = bundledHtml.replace(
          new RegExp(`<script.*?src=["'].*?${name}["'].*?></script>`, 'g'),
          `<script>${files[name]}</script>`
        );
      }
    });

    const blob = new Blob([bundledHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  if (fileNames.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950 p-6 text-center">
        <FileCode size={48} className="mb-4 opacity-20" />
        <p className="font-medium text-zinc-400">Aucun fichier généré.</p>
        <p className="text-xs mt-2 text-zinc-500">Demandez à l'IA d'utiliser des images d'Internet pour son jeu.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0d0d0d] relative">
      <div className={`
        ${showFileSidebar ? 'translate-x-0 w-64' : '-translate-x-full w-0'} 
        fixed md:relative z-30 h-full border-r border-zinc-800 flex flex-col bg-zinc-950 transition-all duration-300
      `}>
        <div className="p-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 bg-zinc-900/50">Explorateur</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {fileNames.map(name => (
            <button
              key={name}
              onClick={() => { onFileSelect(name); setIsPreviewMode(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all ${
                activeFile === name && !isPreviewMode ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {getFileIcon(name)}
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-zinc-800">
           <button 
             onClick={() => setIsPreviewMode(!isPreviewMode)}
             className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${isPreviewMode ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
           >
             <Play size={14} /> {isPreviewMode ? "RETOUR AU CODE" : "VOIR LE RÉSULTAT"}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {!showFileSidebar && (
              <button onClick={() => setShowFileSidebar(true)} className="p-1.5 text-zinc-400 bg-zinc-800 rounded-md"><Menu size={16} /></button>
            )}
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-tighter">
              {isPreviewMode ? "🚀 Live Preview (Web Assets)" : `📄 ${activeFile}`}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {isPreviewMode ? (
            <iframe 
              src={generatePreview()} 
              className="w-full h-full bg-white" 
              title="Preview"
            />
          ) : (
            <div className="h-full overflow-auto p-6 font-mono text-sm leading-relaxed text-zinc-300">
              <pre className="whitespace-pre-wrap"><code>{currentContent}</code></pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
