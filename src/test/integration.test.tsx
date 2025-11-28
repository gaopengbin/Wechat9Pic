/**
 * Integration tests for 3D Layer Effect feature
 * Validates: All requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock services
vi.mock('../services/MattingService', () => ({
  MattingService: vi.fn().mockImplementation(() => ({
    loadModel: vi.fn().mockResolvedValue(true),
    removeBackground: vi.fn().mockResolvedValue({
      success: true,
      imageData: 'data:image/png;base64,mock',
    }),
    isAvailable: vi.fn().mockReturnValue(true),
  })),
}));

vi.mock('../services/GridGenerator', () => ({
  GridGenerator: vi.fn().mockImplementation(() => ({
    generateGridBackground: vi.fn().mockResolvedValue({
      success: true,
      imageData: 'data:image/png;base64,mockgrid',
    }),
    setImages: vi.fn(),
    setBorderWidth: vi.fn(),
    setBorderColor: vi.fn(),
    generate: vi.fn().mockResolvedValue('data:image/png;base64,mockgrid'),
  })),
}));

vi.mock('../services/ExportService', () => ({
  ExportService: vi.fn().mockImplementation(() => ({
    exportLayerComposition: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    generateLayerPreview: vi.fn().mockResolvedValue('data:image/png;base64,preview'),
    exportSingle: vi.fn(),
    exportAll: vi.fn(),
    downloadSingle: vi.fn(),
    downloadAll: vi.fn(),
    generatePreview: vi.fn(),
  })),
  exportService: {
    exportSingle: vi.fn(),
    exportAll: vi.fn(),
    downloadSingle: vi.fn(),
    downloadAll: vi.fn(),
    generatePreview: vi.fn(),
  },
}));

describe('3D Layer Effect Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('App Mode Switching', () => {
    it('should display normal mode by default', () => {
      render(<App />);
      
      expect(screen.getByText('九宫格编辑器')).toBeInTheDocument();
      expect(screen.getByText('3D效果')).toBeInTheDocument();
    });

    it('should have disabled 3D button when no images', () => {
      render(<App />);
      
      const button3D = screen.getByText('3D效果');
      expect(button3D).toBeDisabled();
    });

    it('should have disabled export button when no images', () => {
      render(<App />);
      
      const exportButton = screen.getByText('导出');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('UI Elements', () => {
    it('should display grid editor', () => {
      render(<App />);
      
      expect(screen.getByText(/原图/)).toBeInTheDocument();
    });

    it('should display upload hint when no images', () => {
      render(<App />);
      
      expect(screen.getByText('点击格子上传图片')).toBeInTheDocument();
    });
  });
});

describe('Layer Editor Integration', () => {
  it('should render LayerEditor component', async () => {
    const { LayerEditor } = await import('../components/LayerEditor');
    const mockExport = vi.fn();
    const mockClose = vi.fn();

    render(
      <LayerEditor
        backgroundImage="data:image/png;base64,test"
        onExport={mockExport}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('3D图层编辑')).toBeInTheDocument();
    expect(screen.getByText('← 返回')).toBeInTheDocument();
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('should display layer panel', async () => {
    const { LayerEditor } = await import('../components/LayerEditor');
    const mockExport = vi.fn();
    const mockClose = vi.fn();

    render(
      <LayerEditor
        backgroundImage="data:image/png;base64,test"
        onExport={mockExport}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('图层')).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', async () => {
    const { LayerEditor } = await import('../components/LayerEditor');
    const mockExport = vi.fn();
    const mockClose = vi.fn();

    render(
      <LayerEditor
        backgroundImage="data:image/png;base64,test"
        onExport={mockExport}
        onClose={mockClose}
      />
    );

    const backButton = screen.getByText('← 返回');
    fireEvent.click(backButton);

    expect(mockClose).toHaveBeenCalled();
  });
});

describe('Component Integration', () => {
  it('should render TransformControls with correct props', async () => {
    const { TransformControls } = await import('../components/TransformControls');
    const mockChange = vi.fn();

    render(
      <TransformControls
        transform={{ x: 0, y: 0, scale: 100, rotation: 0 }}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('位置与变换')).toBeInTheDocument();
    expect(screen.getByText('缩放')).toBeInTheDocument();
    expect(screen.getByText('旋转')).toBeInTheDocument();
  });

  it('should render ShadowControls with correct props', async () => {
    const { ShadowControls } = await import('../components/ShadowControls');
    const mockChange = vi.fn();

    render(
      <ShadowControls
        shadow={{
          enabled: true,
          blur: 10,
          offsetX: 5,
          offsetY: 5,
          opacity: 50,
          color: '#000000',
        }}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('阴影')).toBeInTheDocument();
    expect(screen.getByText('模糊度')).toBeInTheDocument();
  });

  it('should render OpacityControl with correct props', async () => {
    const { OpacityControl } = await import('../components/OpacityControl');
    const mockChange = vi.fn();

    render(<OpacityControl opacity={75} onChange={mockChange} />);

    expect(screen.getByText('透明度')).toBeInTheDocument();
    // Use getAllByText since there are multiple elements with 75%
    const elements = screen.getAllByText('75%');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render GridConfigPanel with correct props', async () => {
    const { GridConfigPanel } = await import('../components/GridConfigPanel');
    const mockChange = vi.fn();

    render(
      <GridConfigPanel
        config={{ borderWidth: 2, borderColor: '#FFFFFF' }}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('底图配置')).toBeInTheDocument();
    expect(screen.getByText('边框宽度')).toBeInTheDocument();
    expect(screen.getByText('边框颜色')).toBeInTheDocument();
  });
});

describe('Service Integration', () => {
  it('should create LayerManager instance', async () => {
    const { LayerManager } = await import('../services/LayerManager');
    const manager = new LayerManager();

    expect(manager).toBeDefined();
    expect(manager.getLayers()).toEqual([]);
  });

  it('should create LayerRenderer instance', async () => {
    const { LayerRenderer } = await import('../services/LayerRenderer');
    const renderer = new LayerRenderer();

    expect(renderer).toBeDefined();
    expect(renderer.getCanvas()).toBeInstanceOf(HTMLCanvasElement);
  });

  it('should create GridGenerator instance', async () => {
    // Use the real GridGenerator, not the mock
    vi.unmock('../services/GridGenerator');
    const { GridGenerator: RealGridGenerator } = await vi.importActual<typeof import('../services/GridGenerator')>('../services/GridGenerator');
    const generator = new RealGridGenerator();

    expect(generator).toBeDefined();
    expect(generator.getConfig()).toBeDefined();
  });
});
