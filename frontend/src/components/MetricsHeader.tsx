import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MetricsHeaderProps {
  scheduledCount: number;
  sentCount: number;
  rateLimitedCount: number;
  hourlyLimit: number;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  scheduledCount,
  sentCount,
  rateLimitedCount,
  hourlyLimit,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Scheduled Card */}
      <div className="glass-card rounded-xl p-4 border border-zinc-800/80 hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Queued & Scheduled</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white font-['Outfit']">{scheduledCount}</span>
          <span className="text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            BullMQ Persistent
          </span>
        </div>
      </div>

      {/* Total Sent Card */}
      <div className="glass-card rounded-xl p-4 border border-zinc-800/80 hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Delivered Emails</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white font-['Outfit']">{sentCount}</span>
          <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Ethereal SMTP
          </span>
        </div>
      </div>

      {/* Rate Limited Card */}
      <div className="glass-card rounded-xl p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Rescheduled (Rate Limit)</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white font-['Outfit']">{rateLimitedCount}</span>
          <span className="text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Slack Notified
          </span>
        </div>
      </div>

      {/* Throttling Policy Card */}
      <div className="glass-card rounded-xl p-4 border border-zinc-800/80 hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Sender Rate Cap</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white font-['Outfit']">{hourlyLimit} <span className="text-xs text-zinc-400 font-normal">/ hr</span></span>
          <span className="text-[11px] text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            Sliding Window
          </span>
        </div>
      </div>
    </div>
  );
};
