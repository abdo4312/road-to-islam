import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useMentorChat } from '../hooks/useMentorChat';

interface Props {
  requestId: string;
  otherPersonName: string;
  goBack: () => void;
}

export const MentorChat: React.FC<Props> = ({ requestId, otherPersonName, goBack }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { messages, loading, sending, sendMessage, chatError } = useMentorChat(requestId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll للأسفل لما تجي رسالة جديدة
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // position:fixed عشان يغطي كل حاجة فوق BottomNav
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ── Header ── */}
      <div className="bg-primary text-white px-4 pt-12 pb-4 flex items-center gap-3 shadow-md flex-shrink-0">
        <button
          onClick={goBack}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition tap-bounce"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white leading-tight truncate">{otherPersonName}</p>
          <p className="text-xs text-emerald-200 opacity-80">{t('mentorChat.privateConversation')}</p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : chatError ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-center px-8">
            <AlertCircle size={40} className="text-amber-400" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{chatError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary dark:text-accent text-sm font-bold underline"
            >
              {t('mentorChat.tryAgain')}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-2">
            <p className="text-gray-400 text-sm">{t('mentorChat.noMessages')}</p>
            <p className="text-2xl">👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (
                      <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-3 py-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t('mentorChat.inputPlaceholder')}
          rows={1}
          maxLength={2000}
          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm
            text-gray-900 dark:text-white placeholder-gray-400
            resize-none focus:outline-none focus:ring-2 focus:ring-primary/40
            dark:focus:ring-accent/40 border-0"
          style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-11 h-11 bg-primary hover:bg-primary/90
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white rounded-full flex items-center justify-center
            transition shadow-md flex-shrink-0 tap-bounce"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
};
