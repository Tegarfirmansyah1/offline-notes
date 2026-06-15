// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest'; // 🔥 Tambah afterEach
import { render, screen, fireEvent, cleanup } from '@testing-library/react'; // 🔥 Tambah cleanup
import KanbanZoneNode from './KanbanZoneNode';

// 🔥 KUNCI: Kita palsukan fungsi useStore milik React Flow
vi.mock('@xyflow/react', () => ({
  useStore: vi.fn(() => ({ zoneW: 400, zoneH: 300 })), // Anggap ukuran zonanya 400x300
}));

describe('KanbanZoneNode Component', () => {
 afterEach(() => {
    cleanup();
  });

  const mockData = {
    title: 'ZONA KERJA',
    content: '',
    isHighlight: false,
    onUpdateContent: vi.fn(),
    onDelete: vi.fn(),
    onResize: vi.fn(),
  };

  const defaultProps = {
    id: 'zone-1',
    data: mockData,
    selected: false,
    type: 'group',
    zIndex: -1,
    isConnectable: false,
    dragging: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  };

  it('merender input judul zona dengan benar', () => {
    render(<KanbanZoneNode {...defaultProps} />);

    // Pastikan judulnya muncul di input
    const titleInput = screen.getByDisplayValue('ZONA KERJA');
    expect(titleInput).toBeInTheDocument();
  });

  it('memanggil fungsi onDelete saat tombol silang (✕) ditekan', () => {
    render(<KanbanZoneNode {...defaultProps} />);

    // Cari tombol X dan klik
    const deleteButton = screen.getByText('✕');
    fireEvent.click(deleteButton);

    // Pastikan fungsi onDelete bawaan prop tereksekusi dengan ID yang benar
    expect(mockData.onDelete).toHaveBeenCalledWith('zone-1');
  });

  it('memanggil fungsi onUpdateContent saat judul diganti dan blur', () => {
    render(<KanbanZoneNode {...defaultProps} />);

    const titleInput = screen.getByDisplayValue('ZONA KERJA');
    
    // Simulasikan ngetik nama baru
    fireEvent.change(titleInput, { target: { value: 'ZONA SELESAI' } });
    
    // Simulasikan klik di luar input (blur) untuk nge-save
    fireEvent.blur(titleInput);

    // Pastikan database/fungsi update dipanggil
    expect(mockData.onUpdateContent).toHaveBeenCalledWith('zone-1', 'ZONA SELESAI', '');
  });
});