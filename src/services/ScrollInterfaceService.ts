import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

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

  // Plain scroll listener — no GSAP ScrollTrigger, it conflicts with CSS sticky
  private handleScroll: () => void;

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
    this.handleScroll = this.onScroll.bind(this);
    this.init();
  }

  private init(): void {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    this.track.addEventListener('focusin', this.handleFocusIn);
    // Run once to set initial state
    this.onScroll();
  }

  private onScroll(): void {
    const totalPanels = this.panels.length;
    const wrapperTop = this.wrapper.offsetTop;
    const wrapperHeight = this.wrapper.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Scrollable distance = wrapper height minus one viewport height
    const scrollableDistance = wrapperHeight - viewportHeight;
    const scrolled = Math.max(0, window.scrollY - wrapperTop);
    const globalProgress = Math.min(1, scrolled / scrollableDistance);

    // Drive the horizontal track: xPercent goes 0 → -400% for 5 panels
    gsap.set(this.track, {
      xPercent: -100 * (totalPanels - 1) * globalProgress,
    });

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
    window.removeEventListener('scroll', this.handleScroll);
    this.track.removeEventListener('focusin', this.handleFocusIn);
  }
}
