import data from './portfolio.json';

export interface Skill {
  name: string;
  level: number; // 0-100
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

export const hero: Hero = data.hero;
export const about: About = data.about;
export const skills: Skill[] = data.skills as Skill[];
export const experiences: Experience[] = data.experiences;
export const contactLinks: ContactLink[] = data.contact.links;
