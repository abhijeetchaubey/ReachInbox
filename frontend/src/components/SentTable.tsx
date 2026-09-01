import React from 'react';
import { EmailJob } from '../types';
import { CheckCircle2, Star, ExternalLink, Inbox } from 'lucide-react';
import { format } from 'date-fns';

interface SentTableProps {
  emails: EmailJob[];
  loading: boolean;
  onSelectEmail?: (email: EmailJob) => void;
}

export const SentTable: React.FC<SentTableProps> = ({ emails, loading, onSelectEmail }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-[#00A651] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading sent email log...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6 text-[#00A651]" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">No Sent Emails Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Once your scheduled emails are dispatched by BullMQ workers, they will appear here with live preview links.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
      {emails.map((job) => {
        const timeFormatted = job.sentAt
          ? format(new Date(job.sentAt), 'eee h:mm:ss a')
          : 'Sent';

        return (
          <div
            key={job.id}
            onClick={() => onSelectEmail && onSelectEmail(job)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/90 transition-all cursor-pointer group"
          >
            {/* Left: Recipient Label */}
            <div className="w-48 shrink-0">
              <span className="text-xs font-bold text-slate-900 truncate block">
                To: {job.recipientEmail.split('@')[0]}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {job.recipientEmail}
              </span>
            </div>

            {/* Middle: Sent Badge + Subject + Body Snippet */}
            <div className="flex-1 min-w-0 px-4 flex items-center space-x-3">
              {/* Badge */}
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[#00A651]" />
                <span>{timeFormatted}</span>
              </span>

              {/* Subject & Preview */}
              <div className="truncate text-xs">
                <span className="font-bold text-slate-900 mr-2">
                  {job.subject}
                </span>
                <span className="text-slate-500 font-normal">
                  - {job.body ? job.body.slice(0, 70) : 'No preview available'}...
                </span>
              </div>
            </div>

            {/* Right: Preview Link & Star */}
            <div className="flex items-center space-x-2 shrink-0">
              {job.etherealPreviewUrl && (
                <a
                  href={job.etherealPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#00A651] text-[11px] font-semibold border border-emerald-200 transition-all flex items-center space-x-1"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors">
                <Star className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

