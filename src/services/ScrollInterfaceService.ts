import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

export interface ScrollState {
  /** 0–1 global scroll progress */
  progress: number;
  /** 0–4 active section index */
  activeSection: number;
  /** 0–1 progress within the current section */
  sectionProgress: number;
}

export class ScrollInterfaceService {
  private section: HTMLElement;
  private track: HTMLElement;
  private items: HTMLElement[];
  private onScrollUpdate: (progress: number) => void;
  private scrollTween: gsap.core.Tween | undefined;

  constructor(
    section: HTMLElement,
    track: HTMLElement,
    items: HTMLElement[],
    onScrollUpdate: (progress: number) => void,
  ) {
    this.section = section;
    this.track = track;
    this.items = items;
    this.onScrollUpdate = onScrollUpdate;
    this.init();
  }

  private init(): void {
    if (!this.track || !this.section) return;

    const getScrollAmount = () => {
      const trackWidth = this.track.scrollWidth;
      const viewportWidth = window.innerWidth;
      const amount = trackWidth - viewportWidth + 120; // 120px padding buffer for clean end alignment
      return amount > 0 ? -amount : 0;
    };

    const getEndDistance = () => {
      const trackWidth = this.track.scrollWidth;
      const viewportWidth = window.innerWidth;
      const scrollDistance = trackWidth - viewportWidth + 120;
      return '+=' + Math.max(scrollDistance, window.innerHeight * 1.5);
    };

    this.scrollTween = gsap.to(this.track, {
      x: () => getScrollAmount(),
      ease: 'none',
      scrollTrigger: {
        trigger: this.section,
        start: 'top top',
        end: () => getEndDistance(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          this.onScrollUpdate(self.progress);
          this.updateCardEffects();
        }
      }
    });

    // Initial card setup
    this.updateCardEffects();
  }

  private updateCardEffects(): void {
    if (!this.items || this.items.length === 0) return;
    const viewportCenter = window.innerWidth / 2;

    this.items.forEach((item) => {
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distFromCenter = Math.abs(viewportCenter - cardCenter);
      const maxDist = window.innerWidth * 0.5;
      const normalized = Math.max(0, 1 - distFromCenter / maxDist);

      const scale = 0.94 + normalized * 0.08;
      const opacity = 0.55 + normalized * 0.45;

      gsap.to(item, {
        scale: scale,
        opacity: opacity,
        duration: 0.15,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    });
  }

  public destroy(): void {
    if (this.scrollTween) {
      this.scrollTween.scrollTrigger?.kill();
      this.scrollTween.kill();
    }
  }
}


