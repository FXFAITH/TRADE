import React from 'react';
import { X, Download } from 'lucide-react';

interface ScreenshotLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ScreenshotLightbox: React.FC<ScreenshotLightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header toolbar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Chart Screenshot Inspection</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="chart-screenshot.png"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Close image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
          <img
            src={imageUrl}
            alt="Chart Screenshot Full"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-xl"
          />
        </div>

      </div>
    </div>
  );
};
