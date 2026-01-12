
import { FileCode, FileText, FileJson, Globe, Download, Menu, ChevronLeft, ChevronDown, ChevronRight, Play, Eye, Plus, Terminal, Trash2, FolderUp, UploadCloud, Folder, FolderOpen, Zap, FileUp } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFiles } from '../types';

interface CodeViewerProps {
  files: ProjectFiles;
  activeFile: string;
  onFileSelect: (name: string) => void;
  onUpdateFiles: (files: ProjectFiles) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, activeFile, onFileSelect, onUpdateFiles }) => {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  
  const fileNames = Object.keys(files);
  const currentContent = files[activeFile] || "";

  const addToTerminal = (source: string, text: string) => {
    setTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}][${source}] ${text}`]);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return <Globe size={14} className="text-orange-400" />;
    if (name.endsWith('.css')) return <FileText size={14} className="text-blue-400" />;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode size={14} className="text-yellow-400" />;
    return <FileJson size={14} className="text-zinc-400" />;
  };

  const handleMobileFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const newFiles: ProjectFiles = { ...files };
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const content = await file.text();
      newFiles[file.name] = content;
      addToTerminal("System", `Fichier ${file.name} importé.`);
    }
    onUpdateFiles(newFiles);
  };

  const renderTree = () => {
    const tree: any = {};
    fileNames.forEach(name => {
      const parts = name.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { __isFile: true, fullPath: name };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });

    const buildNodes = (obj: any, path = "") => {
      return Object.entries(obj).sort(([a, valA], [b, valB]) => {
        const aIsFile = (valA as any).__isFile;
        const bIsFile = (valB as any).__isFile;
        if (!aIsFile && bIsFile) return -1;
        return aIsFile && !bIsFile ? 1 : a.localeCompare(b);
      }).map(([key, value]: [string, any]) => {
        const currentPath = path + key;
        if (value.__isFile) {
          return (
            <button
              key={currentPath}
              onClick={() => { onFileSelect(value.fullPath); setIsPreviewMode(false); }}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-[11px] transition-all truncate group ${
                activeFile === value.fullPath && !isPreviewMode ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:bg-white/5'
              }`}
            >
              {getFileIcon(value.fullPath)}
              <span className="truncate">{key}</span>
            </button>
          );
        } else {
          const isExpanded = expandedFolders[currentPath];
          return (
            <div key={currentPath} className="mb-1">
              <button
                onClick={() => setExpandedFolders(p => ({...p, [currentPath]: !p[currentPath]}))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-white/5 font-bold"
              >
                {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                <Folder size={14} className={isExpanded ? "text-orange-500" : "text-zinc-600"}/>
                <span className="truncate uppercase">{key}</span>
              </button>
              {isExpanded && <div className="pl-3 ml-2 border-l border-white/5 mt-1 space-y-1">{buildNodes(value, currentPath + "/")}</div>}
            </div>
          );
        }
      });
    };
    return buildNodes(tree);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-transparent rounded-[2.5rem]">
      <input type="file" multiple ref={mobileFileInputRef} onChange={handleMobileFileImport} className="hidden" />
      
      <div className={`${showFileSidebar ? 'w-64' : 'w-0'} h-full border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Explorateur</span>
          <div className="flex gap-2">
            <button onClick={() => mobileFileInputRef.current?.click()} className="text-zinc-500 hover:text-orange-500"><FileUp size={16}/></button>
            <button onClick={() => {const n = prompt("Nom :"); if(n) onUpdateFiles({...files, [n]:""})}} className="text-zinc-500 hover:text-white"><Plus size={16}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">{renderTree()}</div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-3 truncate">
            {!showFileSidebar && <button onClick={() => setShowFileSidebar(true)} className="p-1.5 text-zinc-500"><Menu size={16} /></button>}
            <span className="text-[10px] font-mono text-zinc-500 truncate">{activeFile || "AUCUN FICHIER"}</span>
          </div>
          <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isPreviewMode ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}>
            {isPreviewMode ? "Code" : "Aperçu"}
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {isPreviewMode ? (
            <iframe srcDoc={files['index.html'] || "<h1>index.html manquant</h1>"} className="w-full h-full bg-white" title="Preview" />
          ) : (
            <div className="h-full overflow-auto p-6 font-mono text-[13px] text-zinc-300 selection:bg-orange-500/30">
              {activeFile ? <pre className="whitespace-pre-wrap"><code>{currentContent}</code></pre> : <div className="h-full flex flex-col items-center justify-center opacity-10"><Zap size={48} /><p className="mt-4 text-[10px] uppercase font-black tracking-widest">DuoMind OS</p></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
