import { memo, useState } from 'react';
import { type NodeProps, type Node, useStore , useReactFlow } from '@xyflow/react';

type ZoneNodeData = {
  title: string;
  content: string; // Walaupun zona mungkin nggak ada konten, fungsi save lu butuh parameter ini
  isHighlight?: boolean;
  onUpdateContent: (id: string, t: string, c: string) => void;
  onDelete: (id: string) => void;
};

const KanbanZoneNode = memo(({ data, id }: NodeProps<Node<ZoneNodeData, 'group'>>) => {
  const [title, setTitle] = useState<string>(data.title);
  
  // 🔥 1. Panggil useReactFlow buat dapetin akses ke memori state
  const { updateNodeData } = useReactFlow();

  const handleSave = () => {
    // 2. Simpan ke Database
    data.onUpdateContent(id, title, data.content);
    
    // 🔥 3. Sinkronisasi real-time ke sidebar tanpa perlu refresh!
    updateNodeData(id, { ...data, title: title });
  };

  const { zoneW, zoneH } = useStore((state) => {
    const children = state.nodes.filter((n) => n.parentId === id);
    
    let maxX = 350;
    let maxY = 300;

    children.forEach((c) => {
      const w = c.measured?.width || 320;
      const h = c.measured?.height || 200;
      
      const rightEdge = c.position.x + w;
      const bottomEdge = c.position.y + h;

      if (rightEdge > maxX) maxX = rightEdge;
      if (bottomEdge > maxY) maxY = bottomEdge;
    });

    return { zoneW: maxX + 40, zoneH: maxY + 40 };
  }, (prev, next) => prev.zoneW === next.zoneW && prev.zoneH === next.zoneH);

  const highlightClass = data.isHighlight 
    ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.3)] bg-yellow-900/20' 
    : 'border-slate-500 bg-slate-900/30';

  return (
    <div 
      className={`border-2 border-dashed rounded-xl flex flex-col overflow-hidden transition-all ${highlightClass}`}
      style={{ width: zoneW, height: zoneH }}
    >
      {/* 🔥 STRIP KHUSUS DRAG: Area ini yang akan menangkap sentuhan untuk menggeser zona */}
      <div className="h-6 bg-slate-800/90 hover:bg-slate-700 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 border-b border-slate-700 pointer-events-auto">
        <div className="w-16 h-1.5 bg-slate-500 rounded-full"></div>
      </div>

      {/* HEADER JUDUL ZONA: Ditambahkan 'nodrag' agar saat mengetik, zona tidak ikut tergeser */}
      <div className="bg-slate-800 p-2 border-b border-slate-600 flex justify-between items-center shrink-0 z-10 pointer-events-auto nodrag">
         <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()} // 🔥 Biar enter juga otomatis nge-save
          className="bg-transparent text-emerald-400 font-black text-sm focus:outline-none w-full uppercase tracking-wider"
          placeholder="NAMA ZONA"
          onPointerDownCapture={(e) => e.stopPropagation()}
        />
        <button onClick={() => data.onDelete(id)} className="text-slate-500 hover:text-red-400 font-bold text-sm px-2 ml-2">✕</button>
      </div>

      <div className="flex-1 w-full h-full"></div>
    </div>
  );
});

export default KanbanZoneNode;