import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft,
  X,
  Upload,
  Clock,
  Send,
  Paperclip,
  Check,
  AlertCircle,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  Quote,
  RotateCcw,
  RotateCw,
  AlignLeft,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  });
  const [delayBetweenSec, setDelayBetweenSec] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSendLaterDrawer, setShowSendLaterDrawer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
  };

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setRecipientsInput(text);
    const emails = extractEmails(text);
    setParsedEmails(emails);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const emails = extractEmails(content);
      setParsedEmails(emails);
    };
    reader.readAsText(file);
  };

  const removeTag = (emailToRemove: string) => {
    const updated = parsedEmails.filter((e) => e !== emailToRemove);
    setParsedEmails(updated);
    setRecipientsInput(updated.join(', '));
  };

  const applyPresetTime = (hoursFromNow: number) => {
    const target = new Date();
    target.setHours(target.getHours() + hoursFromNow);
    setStartTime(target.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Please enter email body content.');
      return;
    }
    if (parsedEmails.length === 0) {
      setErrorMessage('Please enter or upload at least one valid recipient email address.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('startTime', new Date(startTime).toISOString());
      formData.append('delayBetweenSec', delayBetweenSec.toString());
      formData.append('hourlyLimit', hourlyLimit.toString());

      if (csvFile) {
        formData.append('csvFile', csvFile);
      } else {
        formData.append('recipients', parsedEmails.join(','));
      }

      await api.post('/emails/schedule', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
      onClose();
      // Reset form
      setSubject('');
      setBody('');
      setRecipientsInput('');
      setCsvFile(null);
      setParsedEmails([]);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || err.response?.data?.details || 'Failed to schedule campaign'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto font-['Inter',sans-serif]">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              Compose New Email
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSendLaterDrawer(true)}
              className="p-1.5 text-slate-400 hover:text-[#00A651] transition-colors"
              title="Schedule send time"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 rounded-full bg-[#00A651] hover:bg-[#009247] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>{submitting ? 'Scheduling...' : 'Send Later'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* From Selector */}
          <div className="flex items-center py-1 border-b border-slate-100">
            <span className="w-16 text-xs font-medium text-slate-400 shrink-0">From</span>
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
              <span>{user?.email || 'oliver.brown@domain.io'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* To Field with Email Pills & Upload List button */}
          <div className="flex items-center py-1 border-b border-slate-100">
            <span className="w-16 text-xs font-medium text-slate-400 shrink-0">To</span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
              {parsedEmails.slice(0, 4).map((email, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00A651] border border-emerald-200 text-xs font-medium"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(email)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {parsedEmails.length > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00A651] border border-emerald-200 text-xs font-bold">
                  +{parsedEmails.length - 4}
                </span>
              )}

              <input
                type="text"
                placeholder={parsedEmails.length === 0 ? 'recipient@example.com' : 'Add email...'}
                value={recipientsInput}
                onChange={handleRecipientsChange}
                className="flex-1 min-w-[180px] bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none py-1"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 text-xs font-semibold text-[#00A651] hover:underline shrink-0 ml-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload List</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Subject Field */}
          <div className="flex items-center py-1 border-b border-slate-100">
            <span className="w-16 text-xs font-medium text-slate-400 shrink-0">Subject</span>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none py-1 font-medium"
              required
            />
          </div>

          {/* Delay & Hourly Limit Controls */}
          <div className="flex items-center space-x-6 py-2 border-b border-slate-100 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Delay between 2 emails:</span>
              <input
                type="number"
                min="0"
                value={delayBetweenSec}
                onChange={(e) => setDelayBetweenSec(parseInt(e.target.value) || 0)}
                className="w-14 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-center font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00A651]"
              />
              <span className="text-slate-400">sec</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Hourly Limit:</span>
              <input
                type="number"
                min="1"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-center font-bold text-slate-800 text-xs focus:outline-none focus:border-[#00A651]"
              />
            </div>
          </div>

          {/* Editor Body */}
          <div className="pt-2">
            <textarea
              rows={6}
              placeholder="Type Your Reply..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Editor Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center space-x-3">
              <button type="button" className="hover:text-slate-700">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <span className="h-3 border-r border-slate-200" />
              <button type="button" className="font-bold text-slate-700">
                Tt
              </button>
              <button type="button" className="hover:text-slate-700">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <Underline className="w-3.5 h-3.5" />
              </button>
              <span className="h-3 border-r border-slate-200" />
              <button type="button" className="hover:text-slate-700">
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <List className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-700">
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Send Later Presets Drawer Overlay */}
        {showSendLaterDrawer && (
          <div className="absolute top-16 right-6 z-20 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">Send Later</h4>
              <button
                onClick={() => setShowSendLaterDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Pick date & time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#00A651]"
                />
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Quick Presets
                </span>
                <button
                  type="button"
                  onClick={() => applyPresetTime(24)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#00A651] transition-all"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime(16)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#00A651] transition-all"
                >
                  Tomorrow, 10:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime(17)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#00A651] transition-all"
                >
                  Tomorrow, 11:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime(21)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#00A651] transition-all"
                >
                  Tomorrow, 3:00 PM
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSendLaterDrawer(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowSendLaterDrawer(false)}
                className="px-4 py-1.5 rounded-xl bg-[#00A651] hover:bg-[#009247] text-white text-xs font-semibold shadow"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

