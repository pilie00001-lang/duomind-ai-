
import { FileCode, FileText, Globe, Menu, ChevronDown, ChevronRight, FileUp, Cpu, Database, Folder, Plus, UploadCloud } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { ProjectFiles } from '../types';

interface CodeViewerProps {
  files: ProjectFiles;
  activeFile: string;
  onFileSelect: (name: string) => void;
  onUpdateFiles: (files: ProjectFiles) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, activeFile, onFileSelect, onUpdateFiles }) => {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({'src': true});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const fileNames = Object.keys(files);
  const currentContent = files[activeFile] || "";

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'html') return <Globe size={14} className="text-orange-400" />;
    if (ext === 'css') return <FileText size={14} className="text-blue-400" />;
    if (ext === 'js' || ext === 'ts' || ext === 'tsx') return <FileCode size={14} className="text-yellow-400" />;
    if (ext === 'json') return <Database size={14} className="text-zinc-400" />;
    return <FileText size={14} className="text-zinc-500" />;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const newFiles: ProjectFiles = { ...files };
    const readers = Array.from(fileList).map((file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          // Priorité au chemin relatif pour garder la structure des dossiers
          const path = (file as any).webkitRelativePath || file.name;
          newFiles[path] = content;
          resolve();
        };
        reader.readAsText(file);
      });
    });

    await Promise.all(readers);
    onUpdateFiles(newFiles);
    
    if (fileList.length > 0) {
      const firstPath = (fileList[0] as any).webkitRelativePath || fileList[0].name;
      onFileSelect(firstPath);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
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
              onClick={() => onFileSelect(value.fullPath)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-[11px] transition-all truncate group ${
                activeFile === value.fullPath ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-400 hover:bg-white/5 border border-transparent'
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
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-zinc-500 hover:bg-white/5 font-bold transition-all"
              >
                {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                <Folder size={14} className={isExpanded ? "text-orange-500" : "text-zinc-600"}/>
                <span className="truncate uppercase tracking-tight">{key}</span>
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
    <div 
      className={`flex-1 flex h-full overflow-hidden transition-colors ${isDragging ? 'bg-orange-500/5' : 'bg-transparent'}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Input pour fichiers multiples */}
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      {/* Input pour dossiers (PC seulement) */}
      <input type="file" {...{webkitdirectory: "", directory: ""}} ref={folderInputRef} onChange={handleFileChange} className="hidden" />
      
      <div className={`${showFileSidebar ? 'w-64' : 'w-0'} h-full border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden bg-zinc-950/50 backdrop-blur-sm`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Projet</span>
          <div className="flex gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white" title="Fichiers">
              <Plus size={14} />
            </button>
            <button onClick={() => folderInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white" title="Dossier">
              <UploadCloud size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          {fileNames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-800 p-4">
              <FileUp size={32} className="mb-2 opacity-10" />
              <p className="text-[9px] uppercase font-bold text-center opacity-40">Glisse tes fichiers ici</p>
            </div>
          ) : renderTree()}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-black/20">
        <div className="h-10 flex items-center px-4 border-b border-white/5 gap-4 overflow-x-auto scrollbar-hide shrink-0">
          <button onClick={() => setShowFileSidebar(!showFileSidebar)} className="text-zinc-500 hover:text-white shrink-0">
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 truncate">
             {activeFile ? (
               <>
                {getFileIcon(activeFile)}
                <span className="text-zinc-300 truncate">{activeFile}</span>
               </>
             ) : (
               <span>Aucun fichier ouvert</span>
             )}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-orange-500/50 m-4 rounded-3xl">
              <UploadCloud size={48} className="text-orange-500 animate-bounce mb-4" />
              <p className="text-xl font-bold text-white">Lâchez pour importer</p>
              <p className="text-zinc-500 text-sm mt-2">Dossiers et fichiers multiples acceptés</p>
            </div>
          )}
          
          {activeFile ? (
            <div className="h-full p-4 overflow-hidden flex flex-col">
              <pre className="flex-1 overflow-auto text-[13px] font-mono p-6 rounded-3xl bg-zinc-900/30 border border-white/5 text-zinc-300 scrollbar-hide selection:bg-orange-500/30">
                <code>{currentContent}</code>
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800">
              <Cpu size={64} className="mb-6 opacity-5 animate-pulse" />
              <div className="text-center space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">DuoMind IDE</p>
                <p className="text-[10px] text-zinc-700">Sélectionnez un fichier pour commencer l'édition</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
