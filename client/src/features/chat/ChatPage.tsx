import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Avatar, Chip, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { get, post } from '../../api/client';

interface ChatUser { id: number; name: string; phone: string; role: string; }
interface Message { id: number; sender_id: number; receiver_id: number; message: string; read_at: string | null; created_at: string; }
interface Conversation { id: number; name: string; phone: string; role: string; lastMessage: string; lastMessageAt: string; unreadCount: number; isMine: boolean; token?: string; }

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSince, setLastSince] = useState<string>('1970-01-01');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = useCallback(() => {
    get<Conversation[]>('/v2/chat/conversations').then(setConversations).catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    get<ChatUser[]>('/v2/chat/users?role=student').then(setUsers).catch(() => {});
  }, []);

  const loadMessages = useCallback((userId: number, since?: string) => {
    const s = since || '1970-01-01';
    get<Message[]>(`/v2/chat/messages?with=${userId}&since=${encodeURIComponent(s)}`).then((msgs) => {
      if (msgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newMsgs = msgs.filter((m) => !ids.has(m.id));
          return [...prev, ...newMsgs];
        });
        setLastSince(msgs[msgs.length - 1].created_at);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, [loadConversations, loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      setMessages([]);
      setLastSince('1970-01-01');
      loadMessages(selectedUser.id);
    }
  }, [selectedUser, loadMessages]);

  // Polling every 3s
  useEffect(() => {
    if (!selectedUser) return;
    pollRef.current = setInterval(() => {
      loadMessages(selectedUser.id, lastSince);
      loadConversations();
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedUser, lastSince, loadMessages, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !selectedUser) return;
    setSending(true);
    try {
      await post('/v2/chat/send', { receiverId: selectedUser.id, message: input.trim() });
      setInput('');
      loadMessages(selectedUser.id, lastSince);
      loadConversations();
    } finally { setSending(false); }
  };

  const startChat = async (u: ChatUser) => {
    setSelectedUser(u);
    // FB mode: chat doc (shareable token) ensure karo
    if ((window as any).runConfig?.FIREBASE_MODE === true) {
      try {
        const res = await post<{ token: string }>('/v2/chat/start', { contactId: u.id });
        setChatToken(res.token);
      } catch { setChatToken(null); }
    }
  };

  const shareLink = chatToken ? `${window.location.origin}/chat/${chatToken}` : '';

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      window.alert('Chat link copy ho gaya — student ko bhej do:\n' + shareLink);
    } catch {
      window.prompt('Chat link (copy karo):', shareLink);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 2, height: '70vh' }}>
      {/* Left: conversations + users */}
      <Card elevation={3} sx={{ overflow: 'auto' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Chats</Typography>
          {conversations.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>RECENT</Typography>
              <List dense>
                {conversations.map((c) => (
                  <ListItem key={c.id} button selected={selectedUser?.id === c.id} onClick={() => {
                    const u = users.find((u) => u.id === c.id) || { id: c.id, name: c.name, phone: c.phone, role: c.role };
                    setSelectedUser(u);
                    setChatToken(c.token || null);
                  }}>
                    <ListItemAvatar><Avatar>{c.name?.[0]}</Avatar></ListItemAvatar>
                    <ListItemText
                      primary={c.name}
                      secondary={c.lastMessage}
                      primaryTypographyProps={{ fontWeight: c.unreadCount > 0 ? 800 : 400 }}
                    />
                    {c.unreadCount > 0 && <Chip size="small" label={c.unreadCount} color="error" />}
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
            </>
          )}
          <Typography variant="caption" color="text.secondary" fontWeight={700}>STUDENTS</Typography>
          <List dense>
            {users.map((u) => (
              <ListItem key={u.id} button selected={selectedUser?.id === u.id} onClick={() => startChat(u)}>
                <ListItemAvatar><Avatar>{u.name?.[0]}</Avatar></ListItemAvatar>
                <ListItemText primary={u.name} secondary={u.phone} />
              </ListItem>
            ))}
            {users.length === 0 && <Typography variant="body2" color="text.secondary">No students yet.</Typography>}
          </List>
        </CardContent>
      </Card>

      {/* Right: message thread */}
      <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <CardContent sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800}>{selectedUser.name}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedUser.phone}</Typography>
                {shareLink && (
                  <Typography variant="caption" color="primary" sx={{ display: 'block', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shareLink}
                  </Typography>
                )}
              </Box>
              {shareLink && (
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  <IconButton size="small" title="Copy chat link" onClick={copyLink}><ContentCopyIcon fontSize="small" /></IconButton>
                  <IconButton size="small" title="Open student view" onClick={() => window.open(shareLink, '_blank')}><OpenInNewIcon fontSize="small" /></IconButton>
                </Box>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((m) => {
                const mine = m.sender_id !== selectedUser.id;
                return (
                  <Box key={m.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1 }}>
                    <Box sx={{
                      maxWidth: '70%', p: 1.5, borderRadius: 2,
                      bgcolor: mine ? 'primary.main' : 'grey.200',
                      color: mine ? '#fff' : 'text.primary',
                    }}>
                      <Typography variant="body2">{m.message}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField
                size="small" fullWidth placeholder="Type a message…" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <Button variant="contained" onClick={send} disabled={!input.trim() || sending}>
                <SendIcon />
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'grid', placeItems: 'center', flexGrow: 1 }}>
            <Typography color="text.secondary">Left se ek student select karo chat shuru karne ke liye.</Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
