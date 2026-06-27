// src/hooks/useDatabase.ts
import { SQLocal } from 'sqlocal';

// Migrasi ke V3 untuk mendukung Parent-Child binding
const { sql } = new SQLocal('am_notes_v3.sqlite3');
const client = new SQLocal('am_notes_v3.sqlite3');

export interface NoteRecord {
  id: string;
  type: 'note' | 'group';
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  parent_id: string | null; // Kolom pengikat hierarki zona
  created_at: string;
  updated_at: string;
}

export interface EdgeRecord {
  id: string;
  source: string;
  target: string;
}

export const getDatabaseFile = client.getDatabaseFile;
export const overwriteDatabaseFile = client.overwriteDatabaseFile;

export const db = {
  initDb: async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        type TEXT DEFAULT 'note',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        width REAL DEFAULT 300,
        height REAL DEFAULT 200,
        parent_id TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL
      )
    `;

    await sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(id UNINDEXED, title, content);
    `;

    console.log(' Database V3 (Hierarchical Spatial) Siap Tempur!');
  },
  
  getAllNotes: async () => {
    return await sql`SELECT * FROM notes`;
  },

  getAllEdges: async () => {
    return await sql`SELECT * FROM edges`;
  },
  
  searchNotes: async (keyword: string) => {
    return await sql`
      SELECT notes.* FROM notes 
      JOIN notes_fts ON notes.id = notes_fts.id 
      WHERE notes_fts MATCH ${keyword + '*'}
    `;
  },

  insertNode: async (node: { id: string; type: 'note' | 'group'; title: string; content: string; position_x: number; position_y: number; width?: number; height?: number }) => {
    const w = node.width || (node.type === 'group' ? 450 : 300);
    const h = node.height || (node.type === 'group' ? 500 : 200);
    
    await sql`
      INSERT INTO notes (id, type, title, content, position_x, position_y, width, height, parent_id) 
      VALUES (${node.id}, ${node.type}, ${node.title}, ${node.content}, ${node.position_x}, ${node.position_y}, ${w}, ${h}, NULL)
    `;
    
    await sql`INSERT INTO notes_fts (id, title, content) VALUES (${node.id}, ${node.title}, ${node.content})`;
  },

  insertEdge: async (id: string, source: string, target: string) => {
    await sql`INSERT INTO edges (id, source, target) VALUES (${id}, ${source}, ${target})`;
  },
  
  updateNoteContent: async (id: string, title: string, content: string) => {
    await sql`UPDATE notes SET title = ${title}, content = ${content}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    await sql`UPDATE notes_fts SET title = ${title}, content = ${content} WHERE id = ${id}`;
  },
  
  // Sekarang layouting mendukung update parent_id secara dinamis
  updateNodeLayout: async (id: string, x: number, y: number, w: number, h: number, parentId: string | null) => {
    await sql`UPDATE notes SET position_x = ${x}, position_y = ${y}, width = ${w}, height = ${h}, parent_id = ${parentId} WHERE id = ${id}`;
  },
  
  deleteNode: async (id: string) => {
    await sql`DELETE FROM notes WHERE id = ${id}`;
    await sql`DELETE FROM notes_fts WHERE id = ${id}`;
    await sql`DELETE FROM edges WHERE source = ${id} OR target = ${id}`;
    // Jika zona dihapus, lepaskan anak-anaknya dari ikatan parent
    await sql`UPDATE notes SET parent_id = NULL WHERE parent_id = ${id}`;
  },

  deleteEdge: async (id: string) => {
    await sql`DELETE FROM edges WHERE id = ${id}`;
  }
  
};
export const backupDatabase = async () => {
  try {
    // Panggil fungsinya langsung tanpa 'db.'
    const blob = await getDatabaseFile(); 
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const date = new Date().toISOString().split('T')[0];
    a.download = `kanban-backup-${date}.sqlite`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Gagal mem-backup database:", error);
    alert("Gagal melakukan backup data!");
  }
};

export const restoreDatabase = async (file: File) => {
  try {
    // Panggil fungsinya langsung tanpa 'db.'
    await overwriteDatabaseFile(file);
    window.location.reload(); 
  } catch (error) {
    console.error("Gagal me-restore database:", error);
    alert("File korup atau gagal me-restore data!");
  }
};

