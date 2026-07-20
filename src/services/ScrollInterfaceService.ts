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
  private wrapper: HTMLElement;
  private track: HTMLElement;
  private panels: HTMLElement[];
  private onSectionChange: (state: ScrollState) => void;
  private currentSectionIndex: number = 0;
  private parallaxElements: { el: HTMLElement; speed: number }[] = [];
  
  public scrollTween: gsap.core.Tween | undefined;

  constructor(
    wrapper: HTMLElement,
    track: HTMLElement,
    panels: HTMLElement[],
    onSectionChange: (state: ScrollState) => void,
  ) {
    this.wrapper = wrapper;
    this.track = track;
    this.panels = panels;
    this.onSectionChange = onSectionChange;
    this.init();
  }

  private init(): void {
    // Collect all data-speed elements
    const elements = document.querySelectorAll<HTMLElement>('[data-speed]');
    this.parallaxElements = Array.from(elements).map(el => ({
      el,
      speed: parseFloat(el.getAttribute('data-speed') || '0')
    }));

    const totalPanels = this.panels.length;

    this.scrollTween = gsap.to(this.track, {
      xPercent: -100 * (totalPanels - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: this.wrapper,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => this.onScrollUpdate(self.progress)
      }
    });

    this.track.addEventListener('focusin', this.handleFocusIn);
    // Run once to set initial state
    this.onScrollUpdate(0);
  }

  private onScrollUpdate(globalProgress: number): void {
    const totalPanels = this.panels.length;

    // Parallax logic
    const totalWidth = window.innerWidth * (totalPanels - 1);
    const currentX = totalWidth * globalProgress;
    
    for (let i = 0; i < this.parallaxElements.length; i++) {
      const { el, speed } = this.parallaxElements[i];
      // When speed > 0, element moves in the opposite direction of track scroll
      // effectively moving slower than the track
      gsap.set(el, { x: currentX * speed });
    }

    const activeSection = Math.min(
      Math.floor(globalProgress * totalPanels),
      totalPanels - 1,
    );

    this.currentSectionIndex = activeSection;

    // Progress within the current section (0–1)
    const sectionProgress = (globalProgress * totalPanels) % 1;

    this.onSectionChange({ progress: globalProgress, activeSection, sectionProgress });
  }

  private handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    const panelIndex = this.panels.findIndex((panel) => panel.contains(target));
    if (panelIndex !== -1 && panelIndex !== this.currentSectionIndex) {
      this.scrollToSection(panelIndex);
    }
  };

  /**
   * Programmatically scroll to a section by index.
   * Respects prefers-reduced-motion: jumps instantly when reduced.
   */
  public scrollToSection(index: number): void {
    const totalPanels = this.panels.length;
    const wrapperTop = this.wrapper.offsetTop;
    const wrapperHeight = this.wrapper.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollableDistance = wrapperHeight - viewportHeight;

    const targetScroll = wrapperTop + (index / (totalPanels - 1)) * scrollableDistance;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.to(window, {
      scrollTo: targetScroll,
      duration: reduced ? 0 : 1,
      ease: 'power2.inOut',
    });
  }

  public destroy(): void {
    if (this.scrollTween) {
      this.scrollTween.scrollTrigger?.kill();
      this.scrollTween.kill();
    }
    this.track.removeEventListener('focusin', this.handleFocusIn);
  }
}

