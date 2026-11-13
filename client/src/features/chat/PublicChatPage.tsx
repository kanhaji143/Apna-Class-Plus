import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Avatar, CircularProgress, Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { db, FB_MODE, doc, getDoc, setDoc, updateDoc, collection, getDocs, nextId } from '../../firebase/fb';

interface Msg { id: number | string; sender: 'teacher' | 'student'; text: string; created_at: string; }

/**
 * PUBLIC student chat — teacher "Chat" page se share link (/chat/:token).
 * Login ki zaroorat nahi: random token hi capability URL hai.
 * (Spark plan: Cloud Functions nahi — chat client-side Firestore pe chalta hai.)
 */
export default function PublicChatPage() {
  const { token } = useParams();
  const [chat, setChat] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!token) return;
    try {
      const snap = await getDoc(doc(db(), 'chats', token));
      if (!snap.exists()) {
        setErr('Ye chat link valid nahi hai. Teacher se naya link maango.');
        setLoading(false);
        return;
      }
      setChat(snap.data());
      const ms = await getDocs(collection(db(), 'chats', token, 'messages'));
      const list = ms.docs.map((d) => d.data() as Msg)
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      setMsgs(list);
      setLoading(false);
    } catch {
      setErr('Chat load nahi hua. Internet check karke dobara try karo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!FB_MODE) { setErr('Chat live app mein available hai.'); setLoading(false); return; }
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [token]);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || !token || !chat || sending) return;
    setSending(true);
    try {
      const id = await nextId(db(), 'chatMessages');
      const now = new Date().toISOString();
      await setDoc(doc(db(), 'chats', token, 'messages', String(id)), {
        id, sender: 'student', text, readAt: null, created_at: now,
      });
      await updateDoc(doc(db(), 'chats', token), {
        lastMessage: text, lastMessageAt: now, lastSender: 'student',
        teacherUnread: (Number(chat.teacherUnread) || 0) + 1,
      });
      setInput('');
      await load();
    } finally { setSending(false); }
  };

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  if (err) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'grey.100' }}>
        <Paper sx={{ p: 4, maxWidth: 420, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Chat</Typography>
          <Typography color="text.secondary">{err}</Typography>
        </Paper>
      </Box>
    );
  }

  const teacherName = chat?.teacherName || 'Teacher';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 800 }}>
          {String(teacherName)[0]}
        </Avatar>
        <Box>
          <Typography fontWeight={800} lineHeight={1.2}>{teacherName}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>Teacher · Apna Class Plus</Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, maxWidth: 760, width: '100%', mx: 'auto', boxSizing: 'border-box' }}>
        {msgs.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography color="text.secondary">Abhi koi message nahi. Neeche se apna sawaal bhejo.</Typography>
          </Box>
        ) : msgs.map((m) => {
          const mine = m.sender === 'student';
          return (
            <Box key={String(m.id)} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Box sx={{
                maxWidth: '78%', px: 1.75, py: 1.25, borderRadius: 2.5,
                bgcolor: mine ? 'primary.main' : 'background.paper',
                color: mine ? '#fff' : 'text.primary',
                boxShadow: mine ? 2 : 0,
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                  {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={endRef} />
      </Box>

      <Paper square elevation={4} sx={{ p: 1.5, position: 'sticky', bottom: 0 }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', display: 'flex', gap: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Apna message likho…" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button variant="contained" onClick={send} disabled={!input.trim() || sending} sx={{ minWidth: 56 }}>
            <SendIcon />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
