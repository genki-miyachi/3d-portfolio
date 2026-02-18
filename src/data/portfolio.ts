export interface Skill {
  name: string;
  level: number; // 0-100
  category: 'frontend' | 'backend' | 'infra' | 'other';
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  techs: string[];
}

export interface Work {
  title: string;
  description: string;
  techs: string[];
  url?: string;
  github?: string;
  image?: string;
}

export const skills: Skill[] = [
  { name: 'TypeScript', level: 90, category: 'frontend' },
  { name: 'React', level: 90, category: 'frontend' },
  { name: 'Next.js', level: 85, category: 'frontend' },
  { name: 'Three.js', level: 70, category: 'frontend' },
  { name: 'Node.js', level: 85, category: 'backend' },
  { name: 'Python', level: 75, category: 'backend' },
  { name: 'Go', level: 65, category: 'backend' },
  { name: 'PostgreSQL', level: 80, category: 'backend' },
  { name: 'AWS', level: 80, category: 'infra' },
  { name: 'Docker', level: 85, category: 'infra' },
  { name: 'Kubernetes', level: 70, category: 'infra' },
  { name: 'Terraform', level: 65, category: 'infra' },
];

export const experiences: Experience[] = [
  {
    company: 'Example Corp',
    role: 'Senior Frontend Engineer',
    period: '2022 - Present',
    description:
      'フロントエンドアーキテクチャの設計・実装をリード。パフォーマンス最適化とDXの改善に注力。',
    techs: ['TypeScript', 'React', 'Next.js', 'AWS'],
  },
  {
    company: 'Startup Inc',
    role: 'Full-stack Engineer',
    period: '2020 - 2022',
    description:
      '0→1フェーズのプロダクト開発。フロントからインフラまで幅広く担当。',
    techs: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    company: 'Tech Agency',
    role: 'Frontend Developer',
    period: '2018 - 2020',
    description: '複数クライアントのWebアプリケーション開発を担当。',
    techs: ['JavaScript', 'React', 'Vue.js', 'SCSS'],
  },
];

export const works: Work[] = [
  {
    title: '3D Portfolio',
    description:
      'React Three Fiber を使った3Dインタラクティブポートフォリオサイト。',
    techs: ['Astro', 'React Three Fiber', 'GLSL'],
    url: '#',
    github: '#',
  },
  {
    title: 'Task Management App',
    description: 'リアルタイム同期対応のタスク管理アプリケーション。',
    techs: ['Next.js', 'tRPC', 'Prisma', 'PostgreSQL'],
    url: '#',
    github: '#',
  },
  {
    title: 'CLI Tool',
    description: '開発ワークフローを自動化するCLIツール。',
    techs: ['Go', 'Cobra', 'Docker API'],
    github: '#',
  },
  {
    title: 'Design System',
    description: 'コンポーネントライブラリとデザイントークンシステム。',
    techs: ['React', 'Storybook', 'CSS Custom Properties'],
    url: '#',
    github: '#',
  },
];
