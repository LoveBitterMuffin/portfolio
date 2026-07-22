import { gsap } from 'gsap';

export class VideoInteractionService {
  private video: HTMLVideoElement;
  private container: HTMLElement;
  private onLowFpsFallback?: () => void;
  
  private playheadState = { currentTime: 0 };
  private lastSeekTime = 0;
  
  private PARALLAX_STRENGTH = 24;
  private throttleMs = 16; // 60fps cap for video seeks
  
  private isMobile = false;
  private isReducedMotion = false;
  private isFallbackTriggered = false;

  private updateVideoFrame = () => {
    if (this.isFallbackTriggered) return;
    
    const now = performance.now();
    const target = this.playheadState.currentTime;

    // Throttled video seek
    if (now - this.lastSeekTime > this.throttleMs) {
      if (Math.abs(this.video.currentTime - target) > 0.01) {
        this.video.currentTime = target;
        this.lastSeekTime = now;
      }
    }
  };

  constructor(
    video: HTMLVideoElement, 
    container: HTMLElement,
    onLowFpsFallback?: () => void
  ) {
    this.video = video;
    this.container = container;
    this.onLowFpsFallback = onLowFpsFallback;
    this.init();
  }

  private init(): void {
    // Detect reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = reducedMotionQuery.matches;
    
    // Detect mobile/touch
    this.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (this.isMobile) {
      this.PARALLAX_STRENGTH = 0;
      this.throttleMs = 33; // Increase throttle for mobile (30fps)
    }
    
    if (this.isReducedMotion) {
      this.PARALLAX_STRENGTH = 0;
    }

    // Set initial playhead state to current video time
    this.playheadState.currentTime = this.video.currentTime;

    gsap.ticker.add(this.updateVideoFrame);
  }

  public updatePointer(clientX: number, clientY: number): void {
    if (this.isFallbackTriggered || !this.video.duration) return;

    // Calculate scrub progress
    const progress = Math.max(0, Math.min(1, clientX / window.innerWidth));
    const targetTime = progress * this.video.duration;

    gsap.to(this.playheadState, {
      currentTime: targetTime,
      duration: 0.6,
      ease: 'power1.out',
      overwrite: 'auto',
    });

    // Parallax effect
    if (this.PARALLAX_STRENGTH > 0) {
      const offsetX = (clientX / window.innerWidth - 0.5) * this.PARALLAX_STRENGTH;
      const offsetY = (clientY / window.innerHeight - 0.5) * this.PARALLAX_STRENGTH;

      gsap.to(this.container, {
        x: offsetX,
        y: offsetY,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }

  public triggerLowFpsFallback() {
    this.isFallbackTriggered = true;
    gsap.ticker.remove(this.updateVideoFrame);
    gsap.killTweensOf(this.playheadState);
    gsap.killTweensOf(this.container);
    
    // Reset parallax
    gsap.set(this.container, { clearProps: "all" });
    
    if (this.onLowFpsFallback) {
      this.onLowFpsFallback();
    }
  }

  public updateVideoSource(theme: 'light' | 'dark'): void {
    const currentTime = this.video.currentTime;
    const wasPlaying = !this.video.paused;
    
    this.video.src = theme === 'light' ? '/lbm.mp4' : '/lbm_dark.mp4';
    this.video.load();
    
    // Восстановление позиции после загрузки
    this.video.currentTime = currentTime;
    if (wasPlaying) {
      this.video.play().catch(() => {});
    }
  }

  public destroy(): void {
    gsap.ticker.remove(this.updateVideoFrame);
    gsap.killTweensOf(this.playheadState);
    gsap.killTweensOf(this.container);
  }
}
