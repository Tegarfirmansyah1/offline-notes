// src/App.tsx
import { useEffect, useState, useCallback, memo } from 'react';
import { db, type NoteRecord, type EdgeRecord } from './hooks/useDatabase';
import { 
  ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange, type Node, type Edge, Handle, Position, type NodeProps, type Connection,
  BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, NodeResizer, type ReactFlowInstance
} from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@xyflow/react/dist/style.css';

// =========================================
// 📌 BAGIAN 1: TYPES & INTERFACES
// =========================================
interface NodeData extends Record<string, unknown> {
  title: string;
  content: string;
  isHighlight?: boolean;
  onUpdateContent: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onResize: (id: string, width: number, height: number) => void;
}
type CustomNode = Node<NodeData>;

// =========================================
// 🛠️ FITUR 1: KONEKSI GARIS MANUAL (CustomEdge)
// Tombol 'X' merah untuk memutus garis antar catatan
// =========================================
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} className="nodrag nopan">
          <button onClick={(e) => { e.stopPropagation(); if (data?.onDelete) (data.onDelete as (id:string)=>void)(id); }} className="bg-slate-800 text-red-400 border border-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition-colors" title="Hapus">✕</button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// =========================================
// 📝 FITUR 2: EDITOR CATATAN & MARKDOWN (CustomNoteNode)
// Kartu catatan yang bisa di-resize, drag, dan edit teks
// =========================================
const CustomNoteNode = memo(({ data, id, selected }: NodeProps<CustomNode>) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState<string>(data.title);
  const [content, setContent] = useState<string>(data.content);
  const [original, setOriginal] = useState({ title: data.title, content: data.content });

  const handleSave = () => {
    if (title !== original.title || content !== original.content) {
      data.onUpdateContent(id, title, content);
      setOriginal({ title, content });
    }
  };

  const highlightClass = data.isHighlight ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-slate-600';

  return (
    <>
      <NodeResizer minWidth={250} minHeight={150} isVisible={selected} onResizeEnd={(_e, params) => data.onResize(id, params.width, params.height)} />
      
      <div className={`w-full h-full flex flex-col bg-slate-800 border rounded-lg shadow-xl overflow-hidden group transition-all ${highlightClass}`}>
        
        {/* 🔥 AREA AMAN UNTUK MENYERET CATATAN (DRAG HANDLE) 🔥 */}
        <div className="h-6 bg-slate-800/90 hover:bg-slate-700 cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0 border-b border-slate-700">
          {/* Garis kecil visual biar user tahu ini bisa ditarik */}
          <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-400 border-2 border-slate-800 rounded-full opacity-100 mt-1" />
        
        {/* Header (Input & Tombol) */}
        <div className="bg-slate-700 p-2 border-b border-slate-600 flex justify-between items-center shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            // nodrag bikin area ini nggak bisa diseret
            className="nodrag w-full bg-transparent text-cyan-400 font-bold text-sm focus:outline-none"
            placeholder="Judul..."
            onPointerDownCapture={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setIsEditMode(!isEditMode)} className="text-slate-300 hover:text-cyan-400 text-xs px-1" title="Toggle Markdown">
              {isEditMode ? '👁️' : '📝'}
            </button>
            <button onClick={() => data.onDelete(id)} className="text-slate-400 hover:text-red-400 bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer text-xs" title="Hapus">✕</button>
          </div>
        </div>
        
        {/* Konten Textarea / Markdown */}
        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar bg-slate-800">
          {isEditMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              // nodrag dan nowheel bikin area ini nggak bisa diseret
              className="nodrag nowheel w-full h-full bg-transparent text-slate-300 text-sm focus:outline-none resize-none"
              placeholder="Tulis idemu (mendukung Markdown)..."
              onPointerDownCapture={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="nodrag nowheel prose prose-invert prose-sm max-w-none break-words text-left text-slate-300 min-h-[50px]" 
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

// KOMPONEN ZONA KANBAN
// =========================================
// FITUR 3: ZONA KANBAN (SEKARANG BISA NYALA KALAU DICARI)
// =========================================
const KanbanZoneNode = memo(({ data, id, selected }: NodeProps<CustomNode>) => {
  const [title, setTitle] = useState<string>(data.title);
  const handleSave = () => data.onUpdateContent(id, title, data.content);

  // 🔥 TAMBAHKAN LOGIKA NEON UNTUK ZONA
  const highlightClass = data.isHighlight 
    ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.3)] bg-yellow-900/20' 
    : 'border-slate-500 bg-slate-900/30';

  return (
    <>
      <NodeResizer minWidth={300} minHeight={300} isVisible={selected} onResizeEnd={(_e, params) => data.onResize(id, params.width, params.height)} />
      
      {/* 🔥 TERAPKAN HIGHLIGHT CLASS DI KOTAK UTAMA */}
      <div className={`w-full h-full border-2 border-dashed rounded-xl relative transition-all ${highlightClass}`}>
        
        <div className="absolute top-0 left-0 bg-slate-800 rounded-br-lg rounded-tl-xl p-2 border-b border-r border-slate-600 flex gap-2 z-10">
           <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="bg-transparent text-emerald-400 font-black text-sm focus:outline-none w-28 uppercase tracking-wider"
            placeholder="ZONA"
          />
          <button onClick={() => data.onDelete(id)} className="text-slate-500 hover:text-red-400 text-xs">✕</button>
        </div>
        
      </div>
    </>
  );
});

// =========================================
// 🚀 BAGIAN 2: REGISTRASI KOMPONEN (Wajib untuk React Flow)
// =========================================
const nodeTypes = { note: CustomNoteNode, group: KanbanZoneNode };
const edgeTypes = { custom: CustomEdge };

// =========================================
// 🧠 BAGIAN 3: KOMPONEN UTAMA (App)
// Tempat semua logika otak aplikasi, database, dan UI disatukan
// =========================================
function App() {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const loadWorkspace = useCallback(async (highlightIds: string[] = []) => {
    const notesData = (await db.getAllNotes()) as NoteRecord[];
    const edgesData = (await db.getAllEdges()) as EdgeRecord[];
    
    // 🔥 KUNCI ANTI-MENTAL: Urutkan array agar 'group' (Zona) SELALU berada di urutan pertama!
    // Ini hukum wajib React Flow agar Parent Node selalu ada sebelum Child Node dirender.
    const sortedNotesData = [...notesData].sort((a, b) => a.type === 'group' ? -1 : 1);
    
    const formattedNodes: CustomNode[] = sortedNotesData.map((note) => ({
      id: note.id,
      position: { x: note.position_x, y: note.position_y },
      type: note.type,
      parentId: note.parent_id || undefined, 
      style: { 
        width: note.width, 
        height: note.height, 
        zIndex: note.type === 'group' ? -1 : 1 
      },
      data: { 
        title: note.title, 
        content: note.content,
        isHighlight: highlightIds.includes(note.id),
        onUpdateContent: async (id: string, t: string, c: string) => await db.updateNoteContent(id, t, c),
        onDelete: async (id: string) => { await db.deleteNode(id); loadWorkspace(); },
        onResize: async (id: string, w: number, h: number) => {
          const n = sortedNotesData.find(x => x.id === id);
          if (n) await db.updateNodeLayout(id, n.position_x, n.position_y, w, h, n.parent_id);
        }
      },
    }));

    const formattedEdges: Edge[] = edgesData.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom',
      animated: true,
      style: { stroke: '#06b6d4', strokeWidth: 2 },
      data: { onDelete: async (id: string) => { await db.deleteEdge(id); loadWorkspace(); } }
    }));

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, []);

  useEffect(() => {
    const setup = async () => {
      await db.initDb();
      setIsDbReady(true);
    };
    setup();
  }, []);

  useEffect(() => {
    if (isDbReady) loadWorkspace();
  }, [isDbReady, loadWorkspace]);

// =========================================
  // 🔍 FITUR 4: PENCARIAN KILAT (FTS5) & AUTO-FOCUS KAMERA
  // =========================================
  useEffect(() => {
    const executeSearch = async () => {
      if (!isDbReady) return;
      if (searchQuery.trim().length === 0) {
        loadWorkspace([]);
        return;
      }
      try {
        const results = await db.searchNotes(searchQuery);
        const resultIds = (results as NoteRecord[]).map(r => r.id);
        loadWorkspace(resultIds);

        // 🔥 TERBANG KE LOKASI CATATAN YANG KETEMU
        if (resultIds.length > 0 && rfInstance) {
          // Kasih delay 100ms agar React selesai me-render state highlight-nya dulu
          setTimeout(() => {
            rfInstance.fitView({
              nodes: resultIds.map(id => ({ id })), // Targetkan kamera ke node-node ini
              duration: 800, // Animasi kamera terbang mulus (800 milidetik)
              padding: 0.3,  // Jarak aman biar catatannya nggak terlalu mepet pinggir layar
              maxZoom: 1.2   // Batas zoom maksimal biar nggak terlalu besar
            });
          }, 100);
        }
      } catch (err) { /* ignore */ }
    };
    const timeoutId = setTimeout(executeSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isDbReady, loadWorkspace, rfInstance]);

  const onNodesChange = useCallback((changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes as NodeChange<CustomNode>[], nds)), []);

 // =========================================
  // 🔍 FITUR 1: PENCARIAN KILAT (FTS5) & AUTO-FOCUS KAMERA
  // =========================================

  const onNodeDragStop = async (_event: React.MouseEvent, node: CustomNode) => {
    const notesData = (await db.getAllNotes()) as NoteRecord[];
    const currentNodeDB = notesData.find(n => n.id === node.id);
    
    // Ambil ukuran asli dari DB
    const currentW = currentNodeDB?.width || (node.type === 'group' ? 450 : 300);
    const currentH = currentNodeDB?.height || (node.type === 'group' ? 500 : 200);

    if (node.type === 'note') {
      const currentParent = node.parentId ? notesData.find(n => n.id === node.parentId) : null;
      
      const absX = node.parentId ? node.position.x + (currentParent?.position_x || 0) : node.position.x;
      const absY = node.parentId ? node.position.y + (currentParent?.position_y || 0) : node.position.y;
      
      let newParentId: string | null = null;
      let finalX = absX;
      let finalY = absY;
      let targetGroup: NoteRecord | null = null; // Menyimpan data zona yang ditabrak
      
      const noteCenterX = absX + (currentW / 2);
      const noteCenterY = absY + (currentH / 2);
      
      // 1. Cek apakah catatan masuk ke dalam area zona
      const groups = notesData.filter(n => n.type === 'group');
      for (const group of groups) {
        if (
          noteCenterX >= group.position_x &&
          noteCenterX <= group.position_x + group.width &&
          noteCenterY >= group.position_y &&
          noteCenterY <= group.position_y + group.height
        ) {
          newParentId = group.id;
          targetGroup = group;
          finalX = absX - group.position_x;
          finalY = absY - group.position_y;
          break;
        }
      }
      
      // 2. Simpan posisi baru catatan
      await db.updateNodeLayout(node.id, finalX, finalY, currentW, currentH, newParentId);

      // 🔥 3. KEAJAIBAN AUTO-EXPAND ZONA KANBAN 🔥
      if (newParentId && targetGroup) {
        // Kasih ruang nafas (padding) biar catatan nggak nempel persis di garis batas zona
        const PADDING_RIGHT = 32; 
        const PADDING_BOTTOM = 32;

        // Hitung jarak ujung kanan dan bawah catatan lu
        const requiredWidth = finalX + currentW + PADDING_RIGHT;
        const requiredHeight = finalY + currentH + PADDING_BOTTOM;

        let newZoneW = targetGroup.width;
        let newZoneH = targetGroup.height;
        let isExpandNeeded = false;

        // Kalau melebih batas lebar zona, besarkan lebarnya!
        if (requiredWidth > targetGroup.width) {
          newZoneW = requiredWidth;
          isExpandNeeded = true;
        }
        
        // Kalau melebihi batas tinggi zona, besarkan tingginya!
        if (requiredHeight > targetGroup.height) {
          newZoneH = requiredHeight;
          isExpandNeeded = true;
        }

        // Kalau zona butuh melar, update ukurannya ke database!
        if (isExpandNeeded) {
          await db.updateNodeLayout(
            targetGroup.id, 
            targetGroup.position_x, 
            targetGroup.position_y, 
            newZoneW, 
            newZoneH, 
            null
          );
        }
      }

    } else if (node.type === 'group') {
      // Jika yang digeser adalah zonanya, update koordinatnya saja
      await db.updateNodeLayout(node.id, node.position.x, node.position.y, currentW, currentH, null);
    }
    
    // Refresh layar
    loadWorkspace();
  };

  const onConnect = useCallback(async (connection: Connection) => {
    if (connection.source && connection.target) {
      const edgeId = `edge-${crypto.randomUUID()}`;
      await db.insertEdge(edgeId, connection.source, connection.target);
      loadWorkspace();
    }
  }, [loadWorkspace]);

  const onEdgesChange = useCallback(async (changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    for (const change of changes) {
      if (change.type === 'remove') await db.deleteEdge(change.id);
    }
  }, []);

// =========================================
  // 📍 LOGIKA SPAWN CERDAS (Munculin Note Tepat di Depan Layar)
  // =========================================
  const addNode = async (type: 'note' | 'group') => {
    // Koordinat cadangan kalau kamera belum siap
    let spawnX = window.innerWidth / 2 - 150;
    let spawnY = window.innerHeight / 2 - 100;

    // Kalau instance React Flow sudah nyala, kita bajak koordinatnya!
    if (rfInstance) {
      // 1. Cari titik tengah persis dari layar browser lu
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      // 2. MAGIC: Konversi titik layar itu ke dalam dunia Kanvas (mengatasi efek pan & zoom)
      const flowPos = rfInstance.screenToFlowPosition({ x: screenCenterX, y: screenCenterY });
      
      // 3. Offset posisinya ke kiri-atas sedikit biar jatuh pas di tengah, plus random tipis biar nggak numpuk
      spawnX = flowPos.x - (type === 'group' ? 150 : 150) + (Math.random() * 40);
      spawnY = flowPos.y - (type === 'group' ? 150 : 100) + (Math.random() * 40);
    }

    await db.insertNode({
      id: crypto.randomUUID(),
      type,
      title: type === 'group' ? 'ZONA BARU' : 'Catatan Baru',
      content: type === 'group' ? '' : '### Judul Kode\n```ts\nconsole.log("Halo Wok");\n```',
      position_x: spawnX,
      position_y: spawnY
    });
    
    await loadWorkspace();
  };

  if (!isDbReady) return <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-cyan-400">Memuat Sistem V3...</div>;

  // =========================================
  // 🎨 RENDER UI (Responsive Sidebar + Mobile Floating Dock)
  // =========================================
  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-900 touch-none relative">
      
      {/* 🔥 BACKDROP GELAP (Muncul di HP saat menu dibuka) */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 📌 SIDEBAR (Di HP jadi drawer, di PC jadi sidebar permanen) */}
      <div className={`
        absolute md:relative z-30 h-full w-80 bg-[#0b1120] border-r border-slate-700 p-6 flex flex-col gap-6 shrink-0 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-red-400 md:hidden text-xl">✕</button>
        
        {/* Header Logo */}
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-md">AM Notes</h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">Developer Edition</p>
        </div>

        {/* Kontrol Menu (Hanya terlihat penuh di PC) */}
        <div className="hidden md:flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => addNode('note')} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-sm shadow transition-transform active:scale-95">+ Catatan</button>
            <button onClick={() => addNode('group')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm shadow transition-transform active:scale-95">+ Zona</button>
          </div>
        </div>

        {/* 🔥 KONTEN BARU: NAVIGASI & MANAJEMEN (Terlihat di PC & HP) 🔥 */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1 pb-4">
          
          {/* 1. Navigasi Cepat (Otomatis melist semua node bertipe 'group') */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">📍 Lompat ke Zona</h3>
            <div className="flex flex-col gap-2">
              {nodes.filter(n => n.type === 'group').length === 0 ? (
                <p className="text-xs text-slate-600 italic">Belum ada zona yang dibuat.</p>
              ) : (
                nodes.filter(n => n.type === 'group').map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      // Kamera terbang ke Zona yang dipilih
                      rfInstance?.fitView({ nodes: [{ id: zone.id }], duration: 800, maxZoom: 1 });
                      setIsSidebarOpen(false); // Otomatis tutup sidebar di HP
                    }}
                    className="text-left text-sm text-emerald-400 hover:text-emerald-300 bg-slate-800/40 hover:bg-slate-700/60 p-2.5 rounded-lg border border-slate-700/50 transition-colors truncate font-semibold"
                  >
                    {zone.data.title || 'ZONA TANPA NAMA'}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bantuan / Info */}
        <div className="mt-auto hidden md:block">
          <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            💡 <b>Tips:</b><br/>- Tarik ujung note untuk resize.<br/>- Masukkan note ke Zona untuk group.<br/>- Tap tanda ✕ di tengah garis untuk putus koneksi.
          </p>
        </div>
      </div>

      {/* 🗺️ AREA KANVAS UTAMA */}
      <div className="flex-1 relative bg-[#0f172a] w-full h-full">
        
        {/* 📱 MOBILE UI: HAMBURGER & SEARCH (Hanya di HP) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-slate-800/90 backdrop-blur border border-slate-600 text-cyan-400 p-2.5 rounded-xl shadow-xl hover:bg-slate-700 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cepat..."
              className="w-full bg-slate-800/90 backdrop-blur border border-slate-600 text-slate-200 text-sm rounded-xl pl-9 pr-3 py-2.5 shadow-xl focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 📱 MOBILE UI: FLOATING ACTION DOCK (Hanya di HP) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 md:hidden flex gap-2 bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-slate-600/50 shadow-2xl">
          <button 
            onClick={() => addNode('note')} 
            className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-xl text-[10px] md:text-sm shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg md:text-lg leading-none mb-1">+</span> NOTE
          </button>
          <button 
            onClick={() => addNode('group')} 
            className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-[10px] md:text-sm shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg md:text-lg leading-none mb-1">+</span> ZONE
          </button>
        </div>

        {/* KANVAS REACT FLOW */}
        <ReactFlow 
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={onNodeDragStop}
          onInit={setRfInstance} fitView minZoom={0.1}
        >
          <Background color="#334155" gap={24} size={2} />
          <Controls className="bg-slate-800 border-slate-600 fill-cyan-400 mb-24 md:mb-4 mr-4" />
        </ReactFlow>
      </div>

    </div>
  );
}

export default App;