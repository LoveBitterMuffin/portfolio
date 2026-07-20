// ─── Content Type Definitions ──────────────────────────────────────────────

export interface EducationItem {
  institution: string;
  specialty: string;
  description: string;
  logo?: string; // optional path to /public image
}

export interface ExperienceItem {
  role: string;
  place: string;
  period: string;
  details: string[];
  focus: string;
}

export interface SkillCategory {
  title: string;
  items: string[];
}

export interface SocialLink {
  name: string;
  url: string;
  icon: 'github' | 'linkedin' | 'telegram';
}

export interface PortfolioContent {
  intro: {
    title: string;
    subtitle: string;
    tagline: string;
    cta: string;
  };
  education: {
    header: string;
    items: EducationItem[];
  };
  experience: {
    header: string;
    items: ExperienceItem[];
  };
  about: {
    header: string;
    skills: {
      frontend: SkillCategory;
      backend: SkillCategory;
      soft: SkillCategory;
    };
    bio: string;
  };
  contacts: {
    header: string;
    email: string;
    social: SocialLink[];
    footer: string;
  };
}
