import React from 'react';
import { EmailJob } from '../types';
import { Clock, Star, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledTableProps {
  emails: EmailJob[];
  loading: boolean;
  onCancelJob: (id: string) => void;
  onSelectEmail?: (email: EmailJob) => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  loading,
  onCancelJob,
  onSelectEmail,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-[#00A651] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading scheduled queue...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-[#00A651]" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">No Scheduled Emails</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You don't have any pending emails in the BullMQ queue. Click "Compose" to schedule new emails.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
      {emails.map((job) => {
        const timeFormatted = format(new Date(job.scheduledAt), 'eee h:mm:ss a');

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

            {/* Middle: Time Pill Badge + Subject + Body Snippet */}
            <div className="flex-1 min-w-0 px-4 flex items-center space-x-3">
              {/* Badge */}
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{timeFormatted}</span>
              </span>

              {/* Subject & Preview */}
              <div className="truncate text-xs">
                <span className="font-bold text-slate-900 mr-2">
                  {job.subject} - Scheduled
                </span>
                <span className="text-slate-500 font-normal">
                  - {job.body ? job.body.slice(0, 70) : 'No preview available'}...
                </span>
              </div>
            </div>

            {/* Right: Star & Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelJob(job.id);
                }}
                title="Cancel job"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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

