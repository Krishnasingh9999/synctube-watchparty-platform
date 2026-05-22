import { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import toast from 'react-hot-toast';

export default function VideoPlayer({ videoId, role }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const remoteUpdateTimeoutRef = useRef(null);
  const lastTimeRef = useRef(0);
  const pollIntervalRef = useRef(null);
  
  const { playVideo, pauseVideo, seekVideo, videoAction } = useRoomStore();
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const canControl = role === 'HOST' || role === 'MODERATOR';
  const canControlRef = useRef(canControl);

  useEffect(() => {
    canControlRef.current = canControl;
  }, [canControl]);

  // Helper to set remote update flag for a 1-second duration
  const setRemoteUpdateFlag = () => {
    isRemoteUpdateRef.current = true;
    if (remoteUpdateTimeoutRef.current) {
      clearTimeout(remoteUpdateTimeoutRef.current);
    }
    remoteUpdateTimeoutRef.current = setTimeout(() => {
      isRemoteUpdateRef.current = false;
      remoteUpdateTimeoutRef.current = null;
    }, 1000);
  };

  // Poll current time to detect seeking (YouTube API has no native seek listener)
  const startPolling = (player) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(() => {
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const currentTime = player.getCurrentTime();
      const state = player.getPlayerState();

      // Only evaluate if playing or paused (ignore unstarted/buffering states)
      if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.PAUSED) {
        const delta = Math.abs(currentTime - lastTimeRef.current);

        // A jump of > 1.8 seconds usually represents a manual seek
        if (delta > 1.8) {
          if (!isRemoteUpdateRef.current) {
            if (!canControlRef.current) {
              // Revert participant back to host's timestamp
              setRemoteUpdateFlag();
              player.seekTo(lastTimeRef.current, true);
              toast.error('Playback scrubbing is restricted to room hosts/moderators.');
            } else {
              seekVideo(currentTime);
            }
          }
        }
      }
      lastTimeRef.current = currentTime;
    }, 500);
  };

  // Handle local state changes (Play / Pause clicks)
  const handlePlayerStateChange = (event) => {
    const player = playerRef.current;
    const state = event.data;

    // If change was driven by a remote socket sync signal, ignore to avoid feedback loop
    if (isRemoteUpdateRef.current) {
      return;
    }

    if (state === window.YT.PlayerState.PLAYING) {
      if (!canControlRef.current) {
        // Participant unauthorized attempt to play: revert state programmatically
        setRemoteUpdateFlag();
        player.pauseVideo();
        toast.error('Only the Host or Moderators can play the video.');
      } else {
        playVideo(player.getCurrentTime());
      }
    } else if (state === window.YT.PlayerState.PAUSED) {
      if (!canControlRef.current) {
        // Participant unauthorized attempt to pause: revert state programmatically
        setRemoteUpdateFlag();
        player.playVideo();
        toast.error('Only the Host or Moderators can pause the video.');
      } else {
        pauseVideo(player.getCurrentTime());
      }
    }
  };

  // Initialize YT Player
  const initPlayer = () => {
    if (playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId || 'dQw4w9WgXcQ',
      playerVars: {
        autoplay: 0,
        controls: 1, // Always render controls natively
        disablekb: 0, // Keep keyboard shortcuts active
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          setIsPlayerReady(true);
          startPolling(event.target);
        },
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (remoteUpdateTimeoutRef.current) {
        clearTimeout(remoteUpdateTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle videoId prop updates
  useEffect(() => {
    if (playerRef.current && isPlayerReady && videoId) {
      const currentLoadedId = playerRef.current.getVideoData()?.video_id;
      if (currentLoadedId !== videoId) {
        setRemoteUpdateFlag();
        playerRef.current.cueVideoById(videoId, 0);
      }
    }
  }, [videoId, isPlayerReady]);

  // Watch remote socket video actions
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !videoAction) return;

    // Check if this action is fresh (within last 2.5 seconds) to avoid playing back stale actions on join
    const isActionFresh = Date.now() - videoAction.timestamp < 2500;
    if (!isActionFresh) return;

    const player = playerRef.current;
    
    // Ignore events triggered programmatically by this socket action
    setRemoteUpdateFlag();

    switch (videoAction.type) {
      case 'play':
        player.seekTo(videoAction.time, true);
        player.playVideo();
        break;
      case 'pause':
        player.pauseVideo();
        player.seekTo(videoAction.time, true);
        break;
      case 'seek':
        player.seekTo(videoAction.time, true);
        break;
      case 'change':
        player.cueVideoById(videoAction.videoId, videoAction.time || 0);
        if (videoAction.isPlaying) {
          player.playVideo();
        }
        break;
      default:
        break;
    }
  }, [videoAction, isPlayerReady]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-white/5 shadow-2xl">
      {/* Target element for YT Player */}
      <div ref={containerRef} className="h-full w-full pointer-events-auto" />

      {/* Transparent Overlay to block direct playback clicking for participants */}
      {!canControl && (
        <div className="absolute inset-0 z-10 cursor-not-allowed bg-transparent" />
      )}

      {/* Loading overlay */}
      {!isPlayerReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-red-600 mb-3" />
          <p className="text-sm font-medium tracking-wide">Syncing Watch Party Player...</p>
        </div>
      )}
    </div>
  );
}
