import jaData from './portfolio-ja.json';
import enData from './portfolio-en.json';
import { useLocale } from '../contexts/LocaleContext';

export interface Skill {
  name: string;
  tier: 'expert' | 'proficient' | 'familiar';
  category: 'frontend' | 'backend' | 'infra' | 'other';
}

export interface Project {
  title: string;
  period: string;
  role: string;
  teamSize: string;
  description: string;
  achievements: string[];
  techs: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  techs: string[];
  projects?: Project[];
}

export interface ContactLink {
  label: string;
  href: string;
  text: string;
}

export interface Hero {
  name: string;
  subtitle: string;
}

export interface About {
  lines: string[];
}

const dataMap = { ja: jaData, en: enData } as const;

export function usePortfolio() {
  const { locale } = useLocale();
  const data = dataMap[locale];
  return {
    hero: data.hero as Hero,
    about: data.about as About,
    skills: data.skills as Skill[],
    experiences: data.experiences as Experience[],
    contactLinks: data.contact.links as ContactLink[],
  };
}
