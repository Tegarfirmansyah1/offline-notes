import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


type CustomNodeData = {
  title: string;
  content: string;
  isHighlight?: boolean;
  onUpdateContent: (id: string, t: string, c: string) => void;
  onDelete: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
};

const CustomNoteNode = memo(({ data, id }: NodeProps<Node<CustomNodeData, 'note'>>) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState<string>(data.title);
  const [content, setContent] = useState<string>(data.content);
  const [original, setOriginal] = useState({ title: data.title, content: data.content });
  
  // 🔥 REFERENSI UNTUK TEXTAREA BIAR BISA MELAR
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (title !== original.title || content !== original.content) {
      data.onUpdateContent(id, title, content);
      setOriginal({ title, content });
    }
  };

  // 🔥 EFEK MELAR OTOMATIS SAAT NGETIK
  useEffect(() => {
    if (textareaRef.current && isEditMode) {
      textareaRef.current.style.height = 'auto'; // Reset dulu
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set ke tinggi konten
    }
  }, [content, isEditMode]);

  const highlightClass = data.isHighlight ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-slate-600';

  return (
    <>
      <div className={`w-full h-auto min-h-[150px] flex flex-col bg-slate-800 border rounded-lg shadow-xl group transition-all ${highlightClass}`}>
        
        {/* AREA AMAN UNTUK MENYERET CATATAN */}
        <div className="h-6 bg-slate-800/90 hover:bg-slate-700 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 border-b border-slate-700 rounded-t-lg">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-400 border-2 border-slate-800 rounded-full opacity-100 mt-1" />
        
        {/* Header */}
        <div className="bg-slate-700 p-2 border-b border-slate-600 flex justify-between items-center shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="nodrag w-full bg-transparent text-cyan-400 font-bold text-sm focus:outline-none"
            placeholder="Judul..."
            onPointerDownCapture={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={() => setIsEditMode(!isEditMode)} 
              className="text-slate-300 hover:text-cyan-400 text-xs px-1"
              title="Toggle Markdown" 
            >
              {isEditMode ? '👁️' : '📝'}
            </button>
            <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-red-400 bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer text-xs">✕</button>
          </div>
        </div>
        
        {/* Konten Textarea / Markdown */}
        <div className="p-3 flex-1 bg-slate-800 rounded-b-lg">
          {isEditMode ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              className="nodrag nowheel w-full bg-transparent text-slate-300 text-sm focus:outline-none resize-none overflow-hidden"
              placeholder="Tulis idemu..."
              onPointerDownCapture={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="nodrag nowheel prose prose-invert prose-sm max-w-none break-words text-left text-slate-300 pb-2" 
              onPointerDownCapture={(e) => e.stopPropagation()}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Catatan kosong...*'}</ReactMarkdown>
            </div>
          )}
        </div>
        
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-400 border-2 border-slate-800 rounded-full opacity-100 mb-1" />
      </div>
    </>
  );
});

export default CustomNoteNode;