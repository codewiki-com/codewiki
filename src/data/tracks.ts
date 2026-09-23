// The track registry: 22 tracks (11 languages, 9 domains, 2 pillars) and their ordered sections.
// Slugs and section order follow the design spec §14.1 and must not change casually: they are
// public URLs, content frontmatter values and checkpoint keys. Kept dependency-free (no Astro
// imports) so scripts, tests and the content schema can all import it.

/** A string in both site locales. */
export type L = { en: string; zh: string };

/** A sidebar group inside a track; also the unit of checkpoints. */
export type Section = { slug: string; name: L; description?: L };

export type TrackKind = 'language' | 'domain' | 'pillar';

export type Track = {
  slug: string;
  kind: TrackKind;
  /** Short mono label shown on cards and hubs, e.g. `py`. */
  glyph: string;
  name: L;
  description: L;
  sections: Section[];
  /**
   * The tracks with the deepest coverage today — docs/design/flagship-tracks.md. Home and
   * `/tracks/` promise these first; everything else keeps its place under "More tracks".
   * Nothing else in the site reads the flag, so the set can change without a layout edit.
   */
  flagship?: true;
};

/** Shorthand for a section entry; keeps the table below readable. */
const s = (slug: string, en: string, zh: string): Section => ({ slug, name: { en, zh } });

export const TRACKS: Track[] = [
  {
    slug: 'python',
    flagship: true,
    kind: 'language',
    glyph: 'py',
    name: { en: 'Python', zh: 'Python' },
    description: {
      en: 'Language core, the standard library, concurrency and typing',
      zh: '语言核心、标准库、并发与类型',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('functions-deeper', 'Functions in depth', '函数进阶'),
      s('objects', 'Objects and classes', '对象与类'),
      s('concurrency', 'Concurrency', '并发'),
      s('stdlib', 'Standard library', '标准库'),
      s('typing-tooling', 'Typing and tooling', '类型与工具链'),
    ],
  },
  {
    slug: 'javascript',
    flagship: true,
    kind: 'language',
    glyph: 'js',
    name: { en: 'JavaScript', zh: 'JavaScript' },
    description: {
      en: 'The core language, async, the browser and Node',
      zh: '语言核心、异步、浏览器与Node',
    },
    sections: [
      s('core', 'Core language', '语言核心'),
      s('functions-scope', 'Functions and scope', '函数与作用域'),
      s('async', 'Async', '异步'),
      s('browser', 'Browser', '浏览器'),
      s('node', 'Node', 'Node运行时'),
      s('patterns-tooling', 'Patterns and tooling', '模式与工具链'),
    ],
  },
  {
    slug: 'typescript',
    flagship: true,
    kind: 'language',
    glyph: 'ts',
    name: { en: 'TypeScript', zh: 'TypeScript' },
    description: {
      en: 'The type system, generics and migrating real codebases',
      zh: '类型系统、泛型与真实项目迁移',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('type-system', 'Type system', '类型系统'),
      s('generics-advanced', 'Generics and advanced types', '泛型与高级类型'),
      s('config-migration', 'Config and migration', '配置与迁移'),
      s('patterns', 'Patterns', '模式'),
    ],
  },
  {
    slug: 'go',
    flagship: true,
    kind: 'language',
    glyph: 'go',
    name: { en: 'Go', zh: 'Go' },
    description: {
      en: 'Types and interfaces, goroutines and production services',
      zh: '类型与接口、goroutine与生产级服务',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('types-interfaces', 'Types and interfaces', '类型与接口'),
      s('concurrency', 'Concurrency', '并发'),
      s('stdlib', 'Standard library', '标准库'),
      s('services-tooling', 'Services and tooling', '服务与工具链'),
    ],
  },
  {
    slug: 'rust',
    flagship: true,
    kind: 'language',
    glyph: 'rs',
    name: { en: 'Rust', zh: 'Rust' },
    description: {
      en: 'Ownership, traits, error handling and fearless concurrency',
      zh: '所有权、trait、错误处理与无畏并发',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('ownership-borrowing', 'Ownership and borrowing', '所有权与借用'),
      s('traits-generics', 'Traits and generics', 'trait与泛型'),
      s('error-handling', 'Error handling', '错误处理'),
      s('concurrency-async', 'Concurrency and async', '并发与异步'),
      s('unsafe-ffi', 'Unsafe and FFI', 'unsafe与FFI'),
      s('cargo-tooling', 'Cargo and tooling', 'Cargo与工具链'),
    ],
  },
  {
    slug: 'java',
    kind: 'language',
    glyph: 'jvm',
    name: { en: 'Java', zh: 'Java' },
    description: {
      en: 'OOP, collections and streams, concurrency and the JVM',
      zh: '面向对象、集合与流、并发与JVM',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('oop-generics', 'OOP and generics', '面向对象与泛型'),
      s('collections-streams', 'Collections and streams', '集合与流'),
      s('concurrency', 'Concurrency', '并发'),
      s('jvm-gc', 'JVM and GC', 'JVM与垃圾回收'),
      s('spring-tooling', 'Spring and tooling', 'Spring与工具链'),
    ],
  },
  {
    slug: 'kotlin',
    kind: 'language',
    glyph: 'kt',
    name: { en: 'Kotlin', zh: 'Kotlin' },
    description: {
      en: 'Modern JVM syntax, coroutines, Android and multiplatform',
      zh: '现代JVM语法、协程、Android与多平台',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('functions-classes', 'Functions and classes', '函数与类'),
      s('coroutines', 'Coroutines', '协程'),
      s('android-multiplatform', 'Android and multiplatform', 'Android与多平台'),
      s('tooling', 'Tooling', '工具链'),
    ],
  },
  {
    slug: 'cpp',
    kind: 'language',
    glyph: 'cpp',
    name: { en: 'C++', zh: 'C++' },
    description: {
      en: 'Memory and ownership, templates and modern C++',
      zh: '内存与所有权、模板与现代C++',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('memory-ownership', 'Memory and ownership', '内存与所有权'),
      s('templates-generic', 'Templates and generic programming', '模板与泛型编程'),
      s('modern-cpp', 'Modern C++', '现代C++'),
      s('concurrency', 'Concurrency', '并发'),
      s('tooling', 'Tooling', '工具链'),
    ],
  },
  {
    slug: 'csharp',
    kind: 'language',
    glyph: 'c#',
    name: { en: 'C#', zh: 'C#' },
    description: {
      en: 'The type system, LINQ, async and the .NET platform',
      zh: '类型系统、LINQ、异步与 .NET平台',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('types-linq', 'Types and LINQ', '类型与LINQ'),
      s('async', 'Async', '异步'),
      s('dotnet', '.NET', '.NET平台'),
      s('tooling', 'Tooling', '工具链'),
    ],
  },
  {
    slug: 'swift',
    kind: 'language',
    glyph: 'swift',
    name: { en: 'Swift', zh: 'Swift' },
    description: {
      en: 'Optionals, protocols, structured concurrency and SwiftUI',
      zh: '可选类型、协议、结构化并发与SwiftUI',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('optionals-protocols', 'Optionals and protocols', '可选类型与协议'),
      s('concurrency', 'Concurrency', '并发'),
      s('swiftui', 'SwiftUI', 'SwiftUI'),
      s('tooling', 'Tooling', '工具链'),
    ],
  },
  {
    slug: 'php',
    kind: 'language',
    glyph: 'php',
    name: { en: 'PHP', zh: 'PHP' },
    description: {
      en: 'Modern PHP, its object model, Laravel and Symfony',
      zh: '现代PHP、对象模型、Laravel与Symfony',
    },
    sections: [
      s('basics', 'Basics', '基础'),
      s('oop', 'OOP', '面向对象'),
      s('laravel-symfony', 'Laravel and Symfony', 'Laravel与Symfony'),
      s('performance-security', 'Performance and security', '性能与安全'),
      s('tooling', 'Tooling', '工具链'),
    ],
  },
  {
    slug: 'frontend',
    kind: 'domain',
    glyph: 'ui',
    name: { en: 'Frontend', zh: '前端' },
    description: {
      en: 'CSS and layout, React and Vue, performance and accessibility',
      zh: 'CSS与布局、React与Vue、性能与无障碍',
    },
    sections: [
      s('html-css', 'HTML and CSS', 'HTML与CSS'),
      s('layout', 'Layout', '布局'),
      s('react', 'React', 'React'),
      s('vue', 'Vue', 'Vue'),
      s('performance', 'Performance', '性能'),
      s('accessibility', 'Accessibility', '无障碍'),
      s('build-tools', 'Build tools', '构建工具'),
    ],
  },
  {
    slug: 'backend',
    kind: 'domain',
    glyph: 'api',
    name: { en: 'Backend', zh: '后端' },
    description: {
      en: 'HTTP APIs, auth, databases, caching and deployment',
      zh: 'HTTP API、认证、数据库、缓存与部署',
    },
    sections: [
      s('http-apis', 'HTTP and APIs', 'HTTP与API'),
      s('auth', 'Auth', '认证与授权'),
      s('databases', 'Databases', '数据库'),
      s('caching-queues', 'Caching and queues', '缓存与队列'),
      s('testing', 'Testing', '测试'),
      s('deployment', 'Deployment', '部署'),
    ],
  },
  {
    slug: 'architecture',
    kind: 'domain',
    glyph: 'arch',
    name: { en: 'Architecture and system design', zh: '架构与系统设计' },
    description: {
      en: 'Design principles and patterns, system design, distributed systems',
      zh: '设计原则与模式、系统设计、分布式系统',
    },
    sections: [
      s('principles', 'Principles', '设计原则'),
      s('design-patterns', 'Design patterns', '设计模式'),
      s('system-design', 'System design', '系统设计'),
      s('distributed', 'Distributed systems', '分布式系统'),
      s('ddd', 'Domain-driven design', '领域驱动设计'),
      s('observability', 'Observability', '可观测性'),
    ],
  },
  {
    slug: 'devops',
    kind: 'domain',
    glyph: 'ops',
    name: { en: 'DevOps and cloud', zh: 'DevOps与云' },
    description: {
      en: 'Containers, Kubernetes, CI/CD, cloud and observability',
      zh: '容器、Kubernetes、CI/CD、云与可观测性',
    },
    sections: [
      s('containers', 'Containers', '容器'),
      s('kubernetes', 'Kubernetes', 'Kubernetes'),
      s('ci-cd', 'CI/CD', '持续集成与交付'),
      s('cloud', 'Cloud', '云平台'),
      s('observability', 'Observability', '可观测性'),
      s('iac', 'Infrastructure as code', '基础设施即代码'),
    ],
  },
  {
    slug: 'data',
    kind: 'domain',
    glyph: 'db',
    name: { en: 'Data and databases', zh: '数据与数据库' },
    description: {
      en: 'SQL and Postgres, NoSQL, data engineering and analytics engines',
      zh: 'SQL与Postgres、NoSQL、数据工程与分析引擎',
    },
    sections: [
      s('sql', 'SQL', 'SQL'),
      s('postgres', 'Postgres', 'PostgreSQL'),
      s('nosql', 'NoSQL', 'NoSQL'),
      s('data-engineering', 'Data engineering', '数据工程'),
      s('analytics-engines', 'Analytics engines', '分析引擎'),
    ],
  },
  {
    slug: 'datascience',
    kind: 'domain',
    glyph: 'ds',
    name: { en: 'Data science', zh: '数据科学' },
    description: {
      en: 'The Python stack, statistics, classical ML and evaluation',
      zh: 'Python工具栈、统计、经典机器学习与评估',
    },
    sections: [
      s('python-stack', 'Python stack', 'Python工具栈'),
      s('statistics', 'Statistics', '统计'),
      s('classical-ml', 'Classical ML', '经典机器学习'),
      s('evaluation', 'Evaluation', '模型评估'),
      s('deployment', 'Deployment', '部署'),
    ],
  },
  {
    slug: 'ai',
    kind: 'domain',
    glyph: 'llm',
    name: { en: 'AI and LLM engineering', zh: 'AI与大模型工程' },
    description: {
      en: 'LLM basics, prompting, RAG, agents and evals',
      zh: '大模型基础、提示词、RAG、智能体与评估',
    },
    sections: [
      s('llm-basics', 'LLM basics', '大模型基础'),
      s('prompting', 'Prompting', '提示词'),
      s('rag', 'RAG', '检索增强生成'),
      s('agents', 'Agents', '智能体'),
      s('evals', 'Evals', '评估'),
      s('fine-tuning', 'Fine-tuning', '微调'),
      s('deep-learning', 'Deep learning', '深度学习'),
      s('multimodal', 'Multimodal', '多模态'),
    ],
  },
  {
    slug: 'security',
    kind: 'domain',
    glyph: 'sec',
    name: { en: 'Security', zh: '安全' },
    description: {
      en: 'Web security, auth and crypto, appsec and secure coding',
      zh: 'Web安全、认证与密码学、应用安全与安全编码',
    },
    sections: [
      s('web-security', 'Web security', 'Web安全'),
      s('auth-crypto', 'Auth and crypto', '认证与密码学'),
      s('appsec', 'Application security', '应用安全'),
      s('infra-security', 'Infrastructure security', '基础设施安全'),
      s('secure-coding', 'Secure coding', '安全编码'),
    ],
  },
  {
    slug: 'gamedev',
    kind: 'domain',
    glyph: 'game',
    name: { en: 'Game development', zh: '游戏开发' },
    description: {
      en: 'Unity, Unreal and Godot, graphics, gameplay systems and performance',
      zh: 'Unity、Unreal与Godot，图形、玩法系统与性能',
    },
    sections: [
      s('unity', 'Unity', 'Unity'),
      s('unreal', 'Unreal', 'Unreal'),
      s('godot', 'Godot', 'Godot'),
      s('graphics', 'Graphics', '图形'),
      s('gameplay-systems', 'Gameplay systems', '玩法系统'),
      s('performance', 'Performance', '性能'),
    ],
  },
  {
    slug: 'ai-era',
    kind: 'pillar',
    glyph: 'ai',
    name: { en: 'Coding in the AI era', zh: 'AI时代编程' },
    description: {
      en: 'Working with coding agents, reviewing generated code, specs and judgement',
      zh: '与编码智能体协作、审查生成代码、规格与判断力',
    },
    sections: [
      s('working-with-agents', 'Working with agents', '与智能体协作'),
      s('reviewing-ai-code', 'Reviewing AI code', '审查AI代码'),
      s('specs-and-tests', 'Specs and tests', '规格与测试'),
      s('prompting-for-code', 'Prompting for code', '面向代码的提示词'),
      s('tooling', 'Tooling', '工具链'),
      s('judgement', 'Judgement', '判断力'),
    ],
  },
  {
    slug: 'foundations',
    flagship: true,
    kind: 'pillar',
    glyph: 'cs',
    name: { en: 'CS foundations', zh: '计算机基础' },
    description: {
      en: 'Algorithms and data structures, networking, operating systems, git and shell',
      zh: '算法与数据结构、网络、操作系统、Git与Shell',
    },
    sections: [
      s('algorithms', 'Algorithms', '算法'),
      s('data-structures', 'Data structures', '数据结构'),
      s('networking', 'Networking', '网络'),
      s('operating-systems', 'Operating systems', '操作系统'),
      s('git-shell', 'Git and shell', 'Git与Shell'),
      s('text-numbers', 'Text and numbers', '文本与数字'),
    ],
  },
];

/** The flagship tracks, in registry order — the six the home page and `/tracks/` lead with. */
export const FLAGSHIP_TRACKS: Track[] = TRACKS.filter((track) => track.flagship === true);

const BY_SLUG = new Map(TRACKS.map((t) => [t.slug, t]));

/** Looks up a track by slug. */
export function getTrack(slug: string): Track | undefined {
  return BY_SLUG.get(slug);
}

/** Looks up a section inside a track, given either the track or its slug. */
export function getSection(track: Track | string, slug: string): Section | undefined {
  const t = typeof track === 'string' ? getTrack(track) : track;
  return t?.sections.find((section) => section.slug === slug);
}
