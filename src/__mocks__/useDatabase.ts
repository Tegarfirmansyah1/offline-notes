import { vi } from 'vitest';

export const db = {
  getAllNotes: vi.fn().mockResolvedValue([]),
  getAllEdges: vi.fn().mockResolvedValue([]),
  updateNoteContent: vi.fn().mockResolvedValue(true),
  updateNodeLayout: vi.fn().mockResolvedValue(true),
  deleteNode: vi.fn().mockResolvedValue(true),
  deleteEdge: vi.fn().mockResolvedValue(true),
};