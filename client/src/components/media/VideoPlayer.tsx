import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Box, Typography } from '@mui/material';

interface Props { url: string; title?: string; }

export default function VideoPlayer({ url, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (Hls.isSupported() && url.includes('.m3u8')) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      // MP4 / native playable
      video.src = url;
      video.load();
    }
  }, [url]);

  return (
    <Box sx={{ bgcolor: '#000', borderRadius: 2, overflow: 'hidden' }}>
      <video ref={videoRef} controls style={{ width: '100%', maxHeight: 480, display: 'block' }} />
      {title && <Box sx={{ p: 1, bgcolor: '#111', color: '#fff' }}><Typography variant="body2">{title}</Typography></Box>}
    </Box>
  );
}
