import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Crop, Move } from 'lucide-react';
import { TARGET_WIDTH, TARGET_HEIGHT } from '../services/db';

interface ImageCropModalProps {
  imageFile: File | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageFile,
  isOpen,
  onClose,
  onCropComplete
}) => {
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number }>({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageFile || !isOpen) {
      setImageBitmap(null);
      return;
    }

    createImageBitmap(imageFile).then(bmp => {
      setImageBitmap(bmp);
      // Center image and fit
      const cropRatio = 2 / 3;
      const imgRatio = bmp.width / bmp.height;

      let initScale = 1;
      if (imgRatio > cropRatio) {
        // Image is wider than 2:3: height matches crop height
        initScale = 1;
      } else {
        // Image is taller or equal
        initScale = 1;
      }

      setScale(initScale);
      setOffsetX(0);
      setOffsetY(0);
    });
  }, [imageFile, isOpen]);

  // Render interactive preview in modal
  useEffect(() => {
    if (!imageBitmap || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = canvas.width;
    const previewH = canvas.height;

    ctx.clearRect(0, 0, previewW, previewH);

    // Draw background guide grid
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, previewW, previewH);

    // Calculate image render scale & pos
    const baseScale = Math.max(previewW / imageBitmap.width, previewH / imageBitmap.height) * scale;
    const drawW = imageBitmap.width * baseScale;
    const drawH = imageBitmap.height * baseScale;
    const drawX = (previewW - drawW) / 2 + offsetX;
    const drawY = (previewH - drawH) / 2 + offsetY;

    ctx.drawImage(imageBitmap, drawX, drawY, drawW, drawH);

    // Draw subtle 2:3 rule of thirds grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    // vertical thirds
    ctx.beginPath();
    ctx.moveTo(previewW / 3, 0);
    ctx.lineTo(previewW / 3, previewH);
    ctx.moveTo((previewW * 2) / 3, 0);
    ctx.lineTo((previewW * 2) / 3, previewH);
    // horizontal thirds
    ctx.moveTo(0, previewH / 3);
    ctx.lineTo(previewW, previewH / 3);
    ctx.moveTo(0, (previewH * 2) / 3);
    ctx.lineTo(previewW, (previewH * 2) / 3);
    ctx.stroke();

    // Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, previewW - 2, previewH - 2);
  }, [imageBitmap, scale, offsetX, offsetY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: offsetX,
      originY: offsetY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.originX + dx);
    setOffsetY(dragStartRef.current.originY + dy);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      originX: offsetX,
      originY: offsetY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.originX + dx);
    setOffsetY(dragStartRef.current.originY + dy);
  };

  const handleApplyCrop = () => {
    if (!imageBitmap) return;

    // Off-screen canvas at TARGET_WIDTH (1024) x TARGET_HEIGHT (1536)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = TARGET_WIDTH;
    exportCanvas.height = TARGET_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const previewW = previewCanvasRef.current?.width || 280;
    const previewH = previewCanvasRef.current?.height || 420;

    const factor = TARGET_WIDTH / previewW;
    const baseScale = Math.max(previewW / imageBitmap.width, previewH / imageBitmap.height) * scale;
    const drawW = imageBitmap.width * baseScale * factor;
    const drawH = imageBitmap.height * baseScale * factor;
    const drawX = ((previewW - imageBitmap.width * baseScale) / 2 + offsetX) * factor;
    const drawY = ((previewH - imageBitmap.height * baseScale) / 2 + offsetY) * factor;

    ctx.drawImage(imageBitmap, drawX, drawY, drawW, drawH);

    exportCanvas.toBlob(
      blob => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in"
      onMouseUp={handleMouseUp}
    >
      <div className="relative bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Potong Foto ke Rasio 2:3
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-950 select-none">
          <div
            className="relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden shadow-xl touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          >
            <canvas
              ref={previewCanvasRef}
              width={260}
              height={390}
              className="block rounded-xl"
            />
            <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>Geser & Atur Posisi</span>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-3 mt-4 w-full max-w-xs">
            <ZoomOut className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-stone-400 shrink-0" />
          </div>
          <span className="text-[11px] text-stone-500 mt-1">
            Skala: {(scale * 100).toFixed(0)}% · Target Output: 1024 × 1536 px
          </span>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Potongan 2:3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
