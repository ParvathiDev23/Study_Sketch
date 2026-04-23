import { useState, useRef, useEffect } from 'react';
import './CanvasPage.css';

const COLORS = ['#2D2D2D', '#E57373', '#6C7CE8', '#81C784', '#FFD54F'];

export default function CanvasPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pencil'); // pencil | eraser

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle resize
    const handleResize = () => {
      // Save current drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

      const newRect = container.getBoundingClientRect();
      canvas.width = newRect.width;
      canvas.height = newRect.height;

      // Restore drawing
      const newCtx = canvas.getContext('2d');
      newCtx.lineCap = 'round';
      newCtx.lineJoin = 'round';
      newCtx.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get correct coordinates considering scale and scroll
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    // Prevent scrolling when drawing on touch devices
    if (e.touches) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 4; // Eraser is bigger
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="canvas-page">
      <div className="canvas-header">
        <h1 className="page-title">🎨 Sketchpad</h1>
        
        <div className="canvas-toolbar sticker-card">
          <div className="tool-group">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c && tool === 'pencil' ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => { setColor(c); setTool('pencil'); }}
                title="Color"
              />
            ))}
          </div>
          
          <div className="tool-group" style={{ margin: '0 12px' }}>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="sketch-range size-slider"
              title="Brush Size"
            />
          </div>

          <div className="tool-group">
            <button 
              className={`sketch-btn action-btn ${tool === 'eraser' ? 'primary' : ''}`}
              onClick={() => setTool('eraser')}
            >
              Eraser
            </button>
            <button 
              className="sketch-btn action-btn danger"
              onClick={clearCanvas}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="canvas-container sticker-card" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="sketch-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
}
