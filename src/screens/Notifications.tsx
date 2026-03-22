import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronLeft, CheckCheck, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Screen } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationsProps {
  setScreen: (s: Screen) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ setScreen }) => {
  const { t } = useTranslation();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { user } = useAuth();

  // Handle notification click - navigate based on action_type
  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    // Mark as read
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    // Check if there's an action to take
    if (notif.action_type === 'open_chat' && notif.action_id) {
      // Get the request details to find the other person's name
      const { data: request } = await supabase
        .from('mentor_requests')
        .select('mentor_id, student_id, status')
        .eq('id', notif.action_id)
        .single();

      if (request && user) {
        // Get the other person's profile
        const otherUserId = request.mentor_id === user.id ? request.student_id : request.mentor_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', otherUserId)
          .single();

        const otherPersonName = profile?.full_name || (request.mentor_id === user.id ? 'Student' : 'Mentor');
        
        // Store chat params in localStorage for the MainScreens to pick up
        localStorage.setItem('pending_chat', JSON.stringify({
          requestId: notif.action_id,
          otherPersonName
        }));
        
        setScreen('MENTOR_CHAT');
      }
    } else if (notif.action_type === 'open_request' && notif.action_id) {
      // Navigate to mentor dashboard to see the request
      setScreen('MENTOR_DASHBOARD');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-bg-light dark:bg-bg-dark pb-32 overflow-y-auto islamic-pattern"
    >
      {/* Header */}
      <div className="bg-primary text-white p-6 pt-12 pb-6 rounded-b-3xl shadow-lg relative overflow-hidden sticky top-0 z-30">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <Bell size={160} />
        </div>
        
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setScreen('HOME')}
              className="p-1.5 bg-white/10 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20 tap-bounce"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold font-serif text-accent">{t('notifications.title')}</h2>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="p-2 bg-white/10 hover:bg-white/20 transition rounded-xl backdrop-blur-sm border border-white/20 text-xs font-bold flex items-center gap-1.5 tap-bounce"
            >
              <CheckCheck size={16} /> {t('notifications.markAllRead')}
            </button>
          )}
        </div>
        
        <p className="text-emerald-100 text-sm font-medium relative z-10">
          {unreadCount > 0 
            ? t('notifications.unreadCount', { count: unreadCount })
            : t('notifications.caughtUp')}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-500">{t('notifications.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center px-10"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('notifications.emptyTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {t('notifications.emptyDesc')}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition relative overflow-hidden cursor-pointer active:scale-95 ${
                  notif.is_read 
                    ? 'bg-white/50 dark:bg-black/30 border-gray-100 dark:border-gray-800' 
                    : 'bg-white dark:bg-black border-primary/20 dark:border-accent/20 shadow-md ring-1 ring-primary/5'
                }`}
              >
                {!notif.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary dark:bg-accent" />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                    notif.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  }`}>
                    {notif.type === 'success' ? <CheckCircle2 size={24} /> :
                     notif.type === 'warning' ? <AlertTriangle size={24} /> :
                     <Info size={24} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold truncate ${notif.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 whitespace-nowrap ml-2">
                        <Clock size={10} /> {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {notif.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
