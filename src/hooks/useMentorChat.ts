import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const useMentorChat = (requestId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = async () => {
    if (!requestId) { setLoading(false); return; }
    try {
      setChatError(null);
      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      // لو الجدول مش موجود — اعرض رسالة واضحة بدل crash
      if (error) {
        if (error.code === '42P01') {
          setChatError('Chat system is being set up. Please try again later.');
        } else {
          setChatError('Could not load messages. Please try again.');
        }
        return;
      }

      setMessages(data || []);

      if (user && data && data.length > 0) {
        const unreadIds = data
          .filter(m => m.sender_id !== user.id && !m.is_read)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('mentor_messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    } catch (err) {
      console.error('useMentorChat: fetchMessages error', err);
      setChatError('Could not load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (body: string): Promise<boolean> => {
    if (!user || !body.trim() || sending) return false;
    setSending(true);
    try {
      const { error } = await supabase
        .from('mentor_messages')
        .insert({
          request_id: requestId,
          sender_id: user.id,
          body: body.trim(),
        });
      if (error) {
        console.error('useMentorChat: sendMessage error', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('useMentorChat: sendMessage error', err);
      return false;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!requestId || !user) {
      setLoading(false);
      return;
    }

    fetchMessages();

    try {
      channelRef.current = supabase
        .channel(`mentor_chat_${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mentor_messages',
            filter: `request_id=eq.${requestId}`,
          },
          async (payload) => {
            const newMsg = payload.new as ChatMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_id !== user.id) {
              try {
                await supabase
                  .from('mentor_messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id);
              } catch (e) {
                // Ignore mark as read errors
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('useMentorChat: Realtime channel error');
          }
        });
    } catch (err) {
      console.warn('useMentorChat: Realtime setup failed', err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {}).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [requestId, user?.id]);

  return { messages, loading, sending, sendMessage, chatError };
};
