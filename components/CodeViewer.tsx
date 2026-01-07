import React, { useState } from 'react';
import { FileCode, FileText, FileJson, Globe, Save, ExternalLink, Download, Menu, ChevronLeft, Archive } from 'lucide-react';
import { ProjectFiles } from '../types';

interface CodeViewerProps {
  files: ProjectFiles;
  activeFile: string;
  onFileSelect: (name: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, activeFile, onFileSelect }) => {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const fileNames = Object.keys(files);
  const currentContent = files[activeFile] || "";

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return <Globe size={16} className="text-orange-400" />;
    if (name.endsWith('.css')) return <FileText size={16} className="text-blue-400" />;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode size={16} className="text-yellow-400" />;
    if (name.endsWith('.cpp') || name.endsWith('.h')) return <FileCode size={16} className="text-blue-500" />;
    return <FileJson size={16} className="text-zinc-400" />;
  };

  const handleDownloadSingle = () => {
    if (!activeFile || !currentContent) return;
    const element = document.createElement('a');
    const file = new Blob([currentContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = activeFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAll = () => {
    if (fileNames.length === 0) return;
    
    // Create a project manifest as a JSON file for "all-in-one" download
    const projectData = JSON.stringify(files, null, 2);
    const element = document.createElement('a');
    const file = new Blob([projectData], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `project_export_${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (fileNames.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950 p-6 text-center">
        <FileCode size={48} className="mb-4 opacity-20" />
        <p className="font-medium text-zinc-400">Aucun fichier généré par les IA.</p>
        <p className="text-xs mt-2 text-zinc-500 max-w-xs">
          Activez le <strong>Mode Code</strong> et demandez-leur de créer une application (ex: "Crée un jeu de snake en HTML/JS").
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0d0d0d] relative">
      {/* Sidebar Fichiers - Responsive Overlay on Mobile */}
      <div className={`
        ${showFileSidebar ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-0'} 
        fixed md:relative z-30 h-full border-r border-zinc-800 flex flex-col bg-zinc-950 transition-all duration-300 ease-in-out
      `}>
        <div className="p-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <span>Explorateur</span>
          <button onClick={() => setShowFileSidebar(false)} className="md:hidden text-zinc-400 p-1">
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {fileNames.map(name => (
            <button
              key={name}
              onClick={() => {
                onFileSelect(name);
                if (window.innerWidth < 768) setShowFileSidebar(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm transition-all ${
                activeFile === name ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {getFileIcon(name)}
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t border-zinc-800">
           <button 
             onClick={handleDownloadAll}
             className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
           >
             <Archive size={14} />
             TOUT EXPORTER (JSON)
           </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            {!showFileSidebar && (
              <button onClick={() => setShowFileSidebar(true)} className="p-1.5 text-zinc-400 hover:text-white mr-1 bg-zinc-800 rounded-md">
                <Menu size={16} />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Fichier actif</span>
              <span className="text-xs font-mono text-zinc-100 truncate">{activeFile || 'Sélectionner...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadSingle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-[10px] font-bold transition-all border border-zinc-700 shadow-sm"
              title="Télécharger ce fichier"
            >
              <Download size={14} />
              <span className="hidden sm:inline">TÉLÉCHARGER</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-[13px] md:text-sm leading-relaxed text-zinc-300 bg-[#080808] selection:bg-blue-900/50">
          <pre className="whitespace-pre-wrap">
            <code className="block">{currentContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};