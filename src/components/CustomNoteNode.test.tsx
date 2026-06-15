// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
// Ganti import jest-dom yang lama dengan yang khusus untuk vitest di bawah ini:
import '@testing-library/jest-dom/vitest'; 

import { render, screen, fireEvent } from '@testing-library/react';
import CustomNoteNode from './CustomNoteNode';

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="mock-handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

describe('CustomNoteNode Component', () => {
  const mockData = {
    title: 'Catatan Pengujian',
    content: 'Ini adalah **teks tebal**',
    isHighlight: false,
    onUpdateContent: vi.fn(),
    onDelete: vi.fn(),
    onResize: vi.fn(),
  };

  it('merender judul dan konten markdown dengan benar', () => {
    render(
      <CustomNoteNode 
        id="note-1"
        data={mockData}
        selected={false}
        type="note"
        zIndex={1}
        isConnectable={true}
        dragging={false}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    // Memastikan judul masuk ke dalam input
    const titleInput = screen.getByDisplayValue('Catatan Pengujian');
    expect(titleInput).toBeInTheDocument();

    // Memastikan markdown dirender
    const markdownContent = screen.getByText('teks tebal');
    expect(markdownContent).toBeInTheDocument();
  });

  it('mengubah mode ke textarea saat tombol edit ditekan', () => {
    render(
      <CustomNoteNode
        id="note-1"
        data={mockData}
        selected={false}
        type="note"
        zIndex={1}
        isConnectable={true}
        dragging={false}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    screen.debug();

    // 🔥 BIDIK LANGSUNG EMOJINYA
    const editButton = screen.getAllByText('📝')[0];
    
    fireEvent.click(editButton);

    // Memastikan textarea muncul dengan konten mentah
    const textarea = screen.getByDisplayValue('Ini adalah **teks tebal**');
    expect(textarea).toBeInTheDocument();
  });
  
});