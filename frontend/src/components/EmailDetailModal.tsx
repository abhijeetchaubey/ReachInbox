import React from 'react';
import { EmailJob } from '../types';
import { ArrowLeft, Star, Trash2, Archive, ExternalLink, Mail, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface EmailDetailModalProps {
  email: EmailJob | null;
  onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  const displayDate = email.sentAt || email.scheduledAt;
  const formattedDate = displayDate
    ? format(new Date(displayDate), 'MMM d, yyyy, h:mm a')
    : 'Unknown date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-slate-900 text-base truncate max-w-md">
                {email.subject || 'No Subject'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">| MJWYT44 BM#52W01</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
              <Archive className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender Info & Timestamp */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#00A651] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
              {email.senderEmail ? email.senderEmail.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm">
                  {email.senderEmail || 'Sender'}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  &lt;{email.senderEmail}&gt;
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                to <span className="font-medium text-slate-700">{email.recipientEmail}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">{formattedDate}</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  email.status === 'SENT'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : email.status === 'RATE_LIMITED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {email.status === 'SENT' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>{email.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="prose max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {email.body}
          </div>

          {/* Ethereal Mail Live Preview Link */}
          {email.etherealPreviewUrl && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#00A651] text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs">
                    Live SMTP Ethereal Mail Preview
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dispatched email can be inspected on fake SMTP server
                  </div>
                </div>
              </div>

              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-[#00A651] hover:bg-[#009247] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>View Ethereal Mail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-all"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
