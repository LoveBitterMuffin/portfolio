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
    const totalItems = this.items.length;

    this.scrollTween = gsap.to(this.track, {
      xPercent: -100 * (totalItems - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: this.section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: true,
        onUpdate: (self) => this.onScrollUpdate(self.progress)
      }
    });
  }

  public destroy(): void {
    if (this.scrollTween) {
      this.scrollTween.scrollTrigger?.kill();
      this.scrollTween.kill();
    }
  }
}

