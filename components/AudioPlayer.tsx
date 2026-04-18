import React, { useState, useRef, useEffect } from 'react';

// SVG Icons
const PlayIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
);
const PauseIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
);
const SquareIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

interface AudioPlayerProps {
  url: string;
  index: number;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return "00:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, index }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => { setDuration(audio.duration); };
    const setAudioTime = () => { setCurrentTime(audio.currentTime); };
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnd);
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 w-full max-w-xl shadow-sm">
      <audio ref={audioRef} src={url} preload="metadata" />
      <span className="text-xs font-bold text-muted w-6">#{index + 1}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={togglePlay}
          className="p-2 hover:bg-surface-hover rounded-full text-primary transition-colors cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={stop}
          className="p-2 hover:bg-surface-hover rounded-full text-destructive transition-colors cursor-pointer"
          title="Stop"
        >
          <SquareIcon />
        </button>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <span className="text-[10px] text-muted font-mono w-8 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-[10px] text-muted font-mono w-8">{formatTime(duration)}</span>
      </div>
      <div className="w-px h-6 bg-border mx-1"></div>
      <a
        href={url}
        download={`tts-copy-${index + 1}.wav`}
        className="p-2 hover:bg-surface-hover rounded-full text-muted hover:text-foreground transition-colors cursor-pointer"
        title="Download Audio"
      >
        <DownloadIcon />
      </a>
    </div>
  );
};

export default AudioPlayer;
