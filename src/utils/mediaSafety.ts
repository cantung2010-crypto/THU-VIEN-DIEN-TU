/**
 * Media playback and camera stream safety utility.
 * Prevents unhandled DOMException AbortError when HTMLMediaElement (video/audio)
 * elements are removed, stopped, or unmounted while .play() is pending.
 * Reference: https://goo.gl/LdLk22
 */

// Synchronously stop all media tracks, pause video, and detach srcObject from video elements
export function safelyStopMediaTracks(container?: HTMLElement | null): void {
  try {
    const parent = container || (typeof document !== 'undefined' ? document : null);
    if (!parent) return;

    const videos = parent.querySelectorAll ? parent.querySelectorAll('video') : [];
    videos.forEach((video) => {
      try {
        video.pause();
      } catch {}

      try {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {}
            });
          }
          video.srcObject = null;
        }
      } catch {}

      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
    });
  } catch {}
}

// Global safeguard for HTMLMediaElement.prototype.play and unhandled rejections
export function initMediaSafety(): void {
  if (typeof window === 'undefined') return;

  const w = window as any;
  if (w.__mediaSafetyInitialized) return;
  w.__mediaSafetyInitialized = true;

  // 1. Monkey-patch HTMLMediaElement.prototype.play to catch AbortError and media removal interruptions
  if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype) {
    const originalPlay = HTMLMediaElement.prototype.play;
    if (typeof originalPlay === 'function') {
      HTMLMediaElement.prototype.play = function (...args: any[]): Promise<void> {
        try {
          const promise = originalPlay.apply(this, args);
          if (promise && typeof promise.catch === 'function') {
            return promise.catch((err: any) => {
              const msg = String(err?.message || err || '');
              const name = String(err?.name || '');
              if (
                name === 'AbortError' ||
                name === 'NotAllowedError' ||
                msg.includes('interrupted') ||
                msg.includes('removed from the document') ||
                msg.includes('pause()')
              ) {
                // Harmless browser interruption during teardown or user navigation
                return;
              }
              return Promise.reject(err);
            });
          }
          return promise || Promise.resolve();
        } catch (err: any) {
          const msg = String(err?.message || err || '');
          const name = String(err?.name || '');
          if (
            name === 'AbortError' ||
            name === 'NotAllowedError' ||
            msg.includes('interrupted') ||
            msg.includes('removed from the document') ||
            msg.includes('pause()')
          ) {
            return Promise.resolve();
          }
          return Promise.reject(err);
        }
      };
    }
  }

  // 2. Global unhandled rejection trap for media play interruptions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason || '');
    const name = String(reason?.name || '');

    if (
      name === 'AbortError' ||
      msg.includes('The play() request was interrupted') ||
      msg.includes('removed from the document') ||
      msg.includes('interrupted by a call to pause')
    ) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  });
}

// Auto-run once on module import
initMediaSafety();
