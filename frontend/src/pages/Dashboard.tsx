import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmailJob } from '../types';
import { Header } from '../components/Header';
import { ScheduledTable } from '../components/ScheduledTable';
import { SentTable } from '../components/SentTable';
import { ComposeModal } from '../components/ComposeModal';
import { SlackModal } from '../components/SlackModal';
import { QueueBoardModal } from '../components/QueueBoardModal';
import { EmailDetailModal } from '../components/EmailDetailModal';
import { Search, Filter, RefreshCcw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [searchResults, setSearchResults] = useState<EmailJob[] | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoadingScheduled(true);
      const resSched = await api.get('/emails/scheduled');
      setScheduledEmails(resSched.data);
    } catch (err) {
      console.error('Failed to fetch scheduled emails:', err);
    } finally {
      setLoadingScheduled(false);
    }

    try {
      setLoadingSent(true);
      const resSent = await api.get('/emails/sent');
      setSentEmails(resSent.data);
    } catch (err) {
      console.error('Failed to fetch sent emails:', err);
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000); // Poll every 5s for live job state updates
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get('/emails/search', {
        params: { q: query },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Elasticsearch search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await api.delete(`/emails/${id}`);
      fetchEmails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel job');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-slate-800 font-['Inter',sans-serif]">
      {/* Left Sidebar */}
      <Header
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenSlackModal={() => setIsSlackModalOpen(true)}
        onOpenQueueModal={() => setIsQueueModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSearchResults(null);
          setSearchQuery('');
        }}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Search Bar */}
        <header className="p-4 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search email subject, body, or leads via Elasticsearch..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A651] focus:outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-[#00A651] rounded-full animate-spin" />
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => fetchEmails()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200/80"
              title="Refresh queue data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200/80"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 flex-1">
          {searchResults ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Search Query Results for "{searchQuery}": ({searchResults.length} match)
                </span>
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#00A651] hover:underline font-medium"
                >
                  Clear Search
                </button>
              </div>
              <ScheduledTable
                emails={searchResults}
                loading={false}
                onCancelJob={handleCancelJob}
                onSelectEmail={(email) => setSelectedEmail(email)}
              />
            </div>
          ) : activeTab === 'scheduled' ? (
            <ScheduledTable
              emails={scheduledEmails}
              loading={loadingScheduled}
              onCancelJob={handleCancelJob}
              onSelectEmail={(email) => setSelectedEmail(email)}
            />
          ) : (
            <SentTable
              emails={sentEmails}
              loading={loadingSent}
              onSelectEmail={(email) => setSelectedEmail(email)}
            />
          )}
        </div>
      </main>

      {/* Modals & Detail Viewer */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchEmails}
      />

      <SlackModal
        isOpen={isSlackModalOpen}
        onClose={() => setIsSlackModalOpen(false)}
      />

      <QueueBoardModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
      />

      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  );
};

