import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Slack, CheckCircle, AlertCircle, Send, Link, ShieldCheck } from 'lucide-react';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleConnectWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setSubmitting(true);

    try {
      await api.post('/slack/connect-webhook', { webhookUrl });
      setStatusMessage({ type: 'success', text: 'Slack Incoming Webhook connected! Test message sent to your Slack channel.' });
      await refreshUser();
      setWebhookUrl('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to connect Slack webhook',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      await api.post('/slack/test-notification');
      setStatusMessage({ type: 'success', text: 'Live test notification dispatched to your Slack channel!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Failed to dispatch Slack notification' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    try {
      await api.post('/slack/disconnect');
      setStatusMessage({ type: 'success', text: 'Slack notification integration disconnected.' });
      await refreshUser();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Failed to disconnect Slack' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Slack className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Slack Real-time Alerts</h3>
              <p className="text-xs text-zinc-400">Get notified the instant a sender reaches hourly rate limit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="glass-card rounded-xl p-4 border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">Current Status:</span>
              </div>
              {user?.slackConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Connected & Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400">
                  Not Connected
                </span>
              )}
            </div>

            {user?.slackConnected && (
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  onClick={handleTestNotification}
                  disabled={testing}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-medium transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testing ? 'Sending...' : 'Send Live Test Alert'}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all"
                >
                  Disconnect Slack
                </button>
              </div>
            )}
          </div>

          {/* Webhook Form */}
          <form onSubmit={handleConnectWebhook} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center space-x-1">
                <Link className="w-3.5 h-3.5 text-zinc-400" />
                <span>Slack Incoming Webhook URL</span>
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Paste your Slack App Incoming Webhook URL to receive instant alerts when sender rate limits are triggered.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !webhookUrl}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Slack className="w-4 h-4" />
              <span>Connect Slack Webhook</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
