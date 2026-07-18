"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIDEO_ID = "IYt_8JVW3w8";
const VOLUME_STEP = 10;
const DEFAULT_VOLUME = 40;

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: YouTubePlayerEvent) => void;
            onStateChange?: (event: YouTubePlayerEvent) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function PestShieldFmWidget({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: VIDEO_ID,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(DEFAULT_VOLUME);
            setIsReady(true);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT?.PlayerState.PLAYING);
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  function togglePlay() {
    const player = playerRef.current;
    if (!player || !isReady) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }

  function changeVolume(delta: number) {
    const player = playerRef.current;
    if (!player || !isReady) return;
    const next = Math.min(100, Math.max(0, volume + delta));
    setVolume(next);
    player.setVolume(next);
    if (next === 0) player.mute();
    else player.unMute();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 py-1 pr-1 pl-2.5",
        className,
      )}
    >
      {/* YouTube IFrame API mounts its player here; kept off-screen so only audio is audible. */}
      <div ref={containerRef} className="fixed -top-[9999px] -left-[9999px] h-1 w-1" aria-hidden="true" />
      <Radio className="size-3.5 text-muted-foreground" />
      <span className="mr-1 ml-1.5 hidden text-xs font-medium whitespace-nowrap text-foreground sm:inline">
        PestShield FM
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 rounded-full"
        onClick={togglePlay}
        disabled={!isReady}
        aria-label={isPlaying ? "Durdur" : "Çal"}
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 rounded-full"
        onClick={() => changeVolume(-VOLUME_STEP)}
        disabled={!isReady}
        aria-label="Sesi azalt"
      >
        <Minus className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 rounded-full"
        onClick={() => changeVolume(VOLUME_STEP)}
        disabled={!isReady}
        aria-label="Sesi arttır"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
