import React, { useRef, useState, useEffect, useCallback } from "react";
import "./ReelPlayer.css";

const PlayIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const PauseIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);
const MuteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);
const UnmuteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const FullscreenIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function ReelPlayer({ src, poster, isActive, onEnded }) {
  const videoRef  = useRef(null);
  const wrapRef   = useRef(null);
  const hideTimer = useRef(null);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showCtrl, setShowCtrl] = useState(false);

  /* ── Parent-controlled (ReelsPage) ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isActive === undefined) return;
    if (isActive) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else          { v.pause(); }
  }, [isActive]);

  /* ── IntersectionObserver autoplay (feed / homepage) ── */
  useEffect(() => {
    if (isActive !== undefined) return;
    const v    = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          v.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, [isActive]);

  const flashControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 2200);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else          { v.pause(); setPlaying(false); }
    flashControls();
  }, [flashControls]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleScrub = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v?.duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
    setCurrent(ratio * v.duration);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v?.duration) return;
    setCurrent(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
    if (v.buffered.length) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    }
  };

  const handleEnded = () => {
    setPlaying(false); setProgress(0); setCurrent(0);
    onEnded?.();
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();
    const el = wrapRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen().catch(() => {});
  };

  return (
    <div
      className="reel-player"
      ref={wrapRef}
      onClick={togglePlay}
      onMouseMove={flashControls}
      onTouchStart={flashControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        muted={muted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => { const v = videoRef.current; if (v) setDuration(v.duration); }}
        onEnded={handleEnded}
        className="reel-player-video"
      />

      <div className={`reel-center-icon ${showCtrl ? "vis" : ""}`}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </div>

      <div className={`reel-controls ${showCtrl ? "vis" : ""}`}>
        <div className="reel-controls-top">
          <button className="reel-ctrl-btn" onClick={toggleMute}>
            {muted ? <MuteIcon /> : <UnmuteIcon />}
          </button>
          <button className="reel-ctrl-btn" onClick={handleFullscreen}>
            <FullscreenIcon />
          </button>
        </div>
        <div className="reel-controls-bottom">
          <span className="reel-time">{formatTime(current)} / {formatTime(duration)}</span>
          <div className="reel-scrubber" onClick={handleScrub}>
            <div className="reel-scrubber-track">
              <div className="reel-buf"  style={{ width: `${buffered}%` }} />
              <div className="reel-fill" style={{ width: `${progress}%` }} />
              <div className="reel-thumb" style={{ left: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="reel-grad-top" />
      <div className="reel-grad-bot" />
    </div>
  );
}