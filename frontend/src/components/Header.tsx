import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Slack, Activity, ChevronDown, CheckCircle2, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
  onOpenQueueModal: () => void;
  activeTab: 'scheduled' | 'sent';
  setActiveTab: (tab: 'scheduled' | 'sent') => void;
  scheduledCount: number;
  sentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompose,
  onOpenSlackModal,
  onOpenQueueModal,
  activeTab,
  setActiveTab,
  scheduledCount,
  sentCount,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Top Brand & Profile */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-2xl text-slate-900 tracking-tight font-['Outfit']">
              ONE<span className="text-[#00A651]">.</span>
            </span>
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all text-left"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-[#00A651]/30 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#00A651] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user?.name?.charAt(0) || 'O'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {user?.name || 'Oliver Brown'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {user?.email || 'oliverbrown@domain.io'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl py-1 border border-slate-200 z-50 divide-y divide-slate-100">
                <div className="px-3.5 py-2">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Signed in as</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSlackModal();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Slack className="w-3.5 h-3.5 text-slate-500" />
                    <span>Slack Alerts</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={onOpenCompose}
            className="w-full py-2.5 rounded-full border-2 border-[#00A651] text-[#00A651] hover:bg-[#00A651] hover:text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 group"
          >
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>

        {/* CORE Section */}
        <div className="px-4 py-2">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 px-2">
            CORE
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-emerald-50 text-[#00A651]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                  ⏱
                </span>
                <span>Scheduled</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-bold">
                {scheduledCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sent'
                  ? 'bg-emerald-50 text-[#00A651]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-4 h-4 flex items-center justify-center text-xs">
                  ✈️
                </span>
                <span>Sent</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-bold">
                {sentCount}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Quick Tools */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onOpenQueueModal}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all border border-slate-200/80"
        >
          <Activity className="w-3.5 h-3.5 text-[#00A651] animate-pulse" />
          <span>BullMQ Live Monitor</span>
        </button>

        <button
          onClick={onOpenSlackModal}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all border border-slate-200/80"
        >
          <Slack className="w-3.5 h-3.5 text-emerald-600" />
          <span>Slack Alert Status</span>
          {user?.slackConnected && (
            <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto" />
          )}
        </button>
      </div>
    </aside>
  );
};

