import React from 'react';
import { X, Activity, ExternalLink } from 'lucide-react';

interface QueueBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueBoardModal: React.FC<QueueBoardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="glass-card w-full max-w-6xl h-[90vh] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">BullMQ Live Queue Monitor</h3>
              <p className="text-xs text-zinc-400">Real-time Redis job queue state & worker performance metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/admin/queues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 flex items-center space-x-1.5"
            >
              <span>Open in Full Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 w-full bg-zinc-950">
          <iframe
            src="/admin/queues"
            title="BullMQ Dashboard"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
