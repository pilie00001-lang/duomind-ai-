
import { FileCode, FileText, Globe, Menu, ChevronDown, ChevronRight, Cpu, Database, Folder, Plus, UploadCloud, Loader2, Trash2, FileImage, FileBox } from 'lucide-react';
import React, { useState, useRef, useMemo } from 'react';
import { ProjectFiles } from '../types';

interface CodeViewerProps {
  files: ProjectFiles;
  activeFile: string;
  onFileSelect: (name: string) => void;
  onUpdateFiles: (files: ProjectFiles) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, activeFile, onFileSelect, onUpdateFiles }) => {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const fileNames = Object.keys(files);
  const currentContent = files[activeFile] || "";

  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'xpm', 'ico', 'svg', 'webp'];
  const isImage = (path: string) => IMAGE_EXTENSIONS.includes(path.split('.').pop()?.toLowerCase() || '');

  const processFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsImporting(true);
    const newFiles: ProjectFiles = { ...files };
    const allFiles = Array.from(fileList);
    setImportProgress({ current: 0, total: allFiles.length });

    const BATCH_SIZE = 15;
    
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(file => {
        return new Promise<void>((resolve) => {
          const path = (file as any).webkitRelativePath || file.name;
          const ext = path.split('.').pop()?.toLowerCase() || '';

          if (path.includes('node_modules/') || path.includes('.git/')) {
            resolve();
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (path && content) {
              newFiles[path] = content;
            }
            resolve();
          };
          reader.onerror = () => resolve();

          // Lecture adaptée : DataURL pour les images, Text pour le reste
          if (IMAGE_EXTENSIONS.includes(ext)) {
            reader.readAsDataURL(file);
          } else if (file.size < 2000000) { // Max 2MB pour le texte
            reader.readAsText(file);
          } else {
            newFiles[path] = `[Fichier trop volumineux pour l'aperçu textuel: ${(file.size / 1024).toFixed(2)} KB]`;
            resolve();
          }
        });
      }));

      setImportProgress({ current: Math.min(i + BATCH_SIZE, allFiles.length), total: allFiles.length });
      await new Promise(r => setTimeout(r, 10));
    }

    onUpdateFiles(newFiles);
    setIsImporting(false);
    
    const firstKey = Object.keys(newFiles).find(k => k.includes(allFiles[0].name)) || Object.keys(newFiles)[0];
    if (firstKey && !activeFile) onFileSelect(firstKey);
  };

  const clearProject = () => {
    if (confirm("Voulez-vous vraiment vider tous les fichiers ?")) {
      onUpdateFiles({});
      onFileSelect('');
    }
  };

  const fileTree = useMemo(() => {
    const root: any = {};
    fileNames.forEach(name => {
      const parts = name.split('/').filter(Boolean);
      let current = root;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { __isFile: true, fullPath: name };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    return root;
  }, [fileNames]);

  const renderNodes = (node: any, path = "") => {
    if (!node) return null;
    const entries = Object.entries(node).sort(([a, valA], [b, valB]) => {
      const aIsFile = (valA as any).__isFile;
      const bIsFile = (valB as any).__isFile;
      if (!aIsFile && bIsFile) return -1;
      if (aIsFile && !bIsFile) return 1;
      return a.localeCompare(b);
    });

    return entries.map(([key, value]: [string, any]) => {
      if (key === "__isFile" || key === "fullPath") return null;
      const currentPath = path ? `${path}/${key}` : key;
      
      if (value && value.__isFile) {
        const isImg = isImage(value.fullPath);
        return (
          <button
            key={value.fullPath}
            onClick={() => onFileSelect(value.fullPath)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] truncate group transition-colors ${
              activeFile === value.fullPath ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-white/5'
            }`}
          >
            {isImg ? <FileImage size={12} className="text-blue-400" /> : <FileText size={12} />}
            <span className="truncate">{key}</span>
          </button>
        );
      } else {
        const isOpen = expandedFolders[currentPath];
        return (
          <div key={currentPath} className="flex flex-col">
            <button
              onClick={() => setExpandedFolders(p => ({ ...p, [currentPath]: !isOpen }))}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-zinc-500 hover:bg-white/5 font-bold"
            >
              {isOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              <Folder size={12} className={isOpen ? "text-orange-500" : ""}/>
              <span className="truncate">{key}</span>
            </button>
            {isOpen && <div className="pl-3 ml-2 border-l border-white/5">{renderNodes(value, currentPath)}</div>}
          </div>
        );
      }
    });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-zinc-950">
      {isImporting && (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
          <Loader2 size={48} className="text-orange-500 animate-spin mb-6" />
          <h2 className="text-xl font-black text-white mb-2 uppercase italic">Synchro en cours</h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] mb-4">
            Traitement de {importProgress.current} / {importProgress.total} ressources
          </p>
          <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      <input type="file" multiple ref={fileInputRef} onChange={(e) => processFiles(e.target.files!)} className="hidden" />
      <input type="file" {...({ webkitdirectory: "", directory: "" } as any)} ref={folderInputRef} onChange={(e) => processFiles(e.target.files!)} className="hidden" />
      
      <div className={`${showFileSidebar ? 'w-64' : 'w-0'} h-full border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden bg-black`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Project Workspace</span>
          <div className="flex gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400" title="Ajouter fichier">
              <Plus size={16} />
            </button>
            <button onClick={() => folderInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg text-orange-500" title="Importer dossier">
              <UploadCloud size={16} />
            </button>
            {fileNames.length > 0 && (
              <button onClick={clearProject} className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {fileNames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-10">
              <FileBox size={48} className="mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-tighter">Glissez vos sources ici</p>
            </div>
          ) : renderNodes(fileTree)}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 flex items-center px-4 border-b border-white/5 gap-4 shrink-0 bg-black/20">
          <button onClick={() => setShowFileSidebar(!showFileSidebar)} className="text-zinc-600 hover:text-white transition-colors">
            <Menu size={16} />
          </button>
          <span className="text-[10px] font-mono text-zinc-500 truncate uppercase tracking-widest italic">{activeFile || 'Ready to Inspect'}</span>
        </div>
        
        <div className="flex-1 overflow-hidden bg-zinc-900/20">
          {activeFile ? (
            <div className="h-full flex flex-col">
              {isImage(activeFile) ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  <div className="relative group">
                    <img src={currentContent} alt={activeFile} className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-white/10" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                       <span className="text-[10px] font-bold text-white bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest">Image Preview</span>
                    </div>
                  </div>
                </div>
              ) : (
                <textarea 
                  readOnly 
                  value={currentContent}
                  spellCheck={false}
                  className="flex-1 w-full p-8 bg-transparent text-zinc-400 font-mono text-[11px] leading-relaxed outline-none resize-none scrollbar-hide"
                />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-900">
              <Cpu size={80} className="mb-6 opacity-20 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700">Select source to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
