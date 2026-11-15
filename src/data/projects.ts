export interface CaseStudyData {
  problem: string;
  constraints: string[];
  architecture: string;
  architectureDetails: string;
  myContribution: string[];
  implementationDetails: string[];
  verification: string;
  results: string;
  tradeoffs: string[];
  lessons: string[];
}

export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  category: 'AI & Data' | 'Visual & Web' | 'Web Applications';
  technologies: string[];
  status: 'Prototype' | 'In development' | 'Completed';
  myRole: string;
  teamSize?: number;
  repoUrl?: string;
  demoUrl?: string;
  demoNote?: string;
  permissionToPublish: boolean;
  evidence: string[];
  featuredOrder: number;
  updatedAt: string;
  caseStudy: CaseStudyData;
}

export const projects: ProjectData[] = [
  {
    id: "deep-research",
    slug: "deep-research",
    title: "Deep Research Engine with AI Automation",
    shortTitle: "Deep Research",
    summary: "Autonomous research agent system that coordinates multi-source querying, content extraction, and structured synthesis.",
    category: "AI & Data",
    technologies: ["Python", "SearXNG", "AI Automation", "Prompt Engineering"],
    status: "In development",
    myRole: "Solo Developer",
    repoUrl: "https://github.com/Niko160706/Deep-Research",
    demoNote: "CLI tool. Live cloud deployment unavailable. Source code and evaluation scripts available on GitHub.",
    permissionToPublish: true,
    evidence: [
      "Tested query synthesis flow with local SearXNG meta-search engine",
      "Owner-reported 84% recall on a 50-query structured extraction benchmark"
    ],
    featuredOrder: 1,
    updatedAt: "2026-11-04",
    caseStudy: {
      problem: "Broad search queries often return fragmented web articles filled with promotional filler and repetitive content. Manual aggregation across dozens of tabs takes hours of repetitive copy-pasting.",
      constraints: [
        "Must operate with local or self-hosted search endpoints to minimize external API costs.",
        "Must run within moderate memory constraints (16GB RAM development machine).",
        "Deterministic output structure with verifiable citation sources."
      ],
      architecture: "Query Decomposition -> Multi-Query Dispatch via SearXNG -> Content Scraping & Normalization -> Segment Summarization -> Citation Resolution -> Markdown Report Compilation",
      architectureDetails: "The pipeline separates query planning from retrieval and synthesis. A dedicated planner splits the user question into 3-5 orthogonal sub-queries. Results are gathered through a self-hosted SearXNG instance, sanitized from HTML boilerplate, and fed into sequential analysis prompts that verify claim consistency.",
      myContribution: [
        "Designed the multi-stage pipeline architecture and prompt chains in Python.",
        "Integrated SearXNG API client with error recovery and request throttling.",
        "Constructed the automated evaluation harness comparing synthesis output against ground-truth technical summaries."
      ],
      implementationDetails: [
        "Structured query expansion using zero-shot classification.",
        "Markdown report builder that embeds origin URLs and confidence flags for unverified assertions.",
        "Local disk caching for raw HTML payloads to prevent redundant search traffic during multi-step runs."
      ],
      verification: "Tested on 50 technical query benchmarks covering distributed systems and machine learning concepts. Compared source recall against manual curation.",
      results: "Reached 84% recall on key technical points across test sets while cutting manual report compilation time from 45 minutes to 4 minutes per topic.",
      tradeoffs: [
        "Sequential scraping of multiple pages introduces latency (average 40-70 seconds per full report).",
        "Strict citation requirement occasionally omits relevant context when primary source metadata cannot be parsed."
      ],
      lessons: [
        "Splitting retrieval from synthesis dramatically reduces hallucinations compared to single-shot answering.",
        "Local web scraping requires resilient fallback strategies for pages with heavy client-side JavaScript."
      ]
    }
  },
  {
    id: "visualize",
    slug: "visualize",
    title: "Visualize: Interactive 3D Mathematics Platform",
    shortTitle: "Visualize",
    summary: "Interactive 3D geometry and linear algebra learning environment with real-time vector transformations and calculus surfaces.",
    category: "Visual & Web",
    technologies: ["HTML5", "CSS3", "JavaScript", "Three.js"],
    status: "Prototype",
    myRole: "Solo Developer & Mathematical Modeling",
    repoUrl: "https://github.com/Niko160706/FinalVisualsProject",
    demoNote: "Interactive Three.js canvas. Prototype repository open on GitHub.",
    permissionToPublish: true,
    evidence: [
      "Real-time 3D coordinate system and matrix transformation rendering in WebGL",
      "Interactive sliders for vector basis manipulation and linear span visual feedback"
    ],
    featuredOrder: 2,
    updatedAt: "2026-10-18",
    caseStudy: {
      problem: "Abstract mathematical concepts such as eigenvector transformations, determinant scaling, and multivariable tangents are difficult for students to visualize from 2D textbook drawings.",
      constraints: [
        "Must run smoothly in standard web browsers without native plugin dependencies.",
        "Frame rate target >= 45 FPS on integrated graphics hardware.",
        "Intuitive controls allowing direct dragging of vectors in 3D space."
      ],
      architecture: "Three.js Scene Graph -> Custom Matrix Arithmetic Module -> Dynamic Geometry Generator -> Canvas Renderer -> GUI Control Bindings",
      architectureDetails: "The application separates mathematical state from rendering meshes. A lightweight matrix utility recalculates vertices on slider updates, and Three.js BufferGeometry updates only the changed vertex coordinates rather than re-instantiating meshes.",
      myContribution: [
        "Implemented 3D linear algebra algorithms (determinant visual areas, matrix-vector multiplication, 3D basis changes).",
        "Engineered the orbit camera controls and coordinate grid with labeled axis projections.",
        "Designed responsive layout integrating math formulas with the 3D viewport."
      ],
      implementationDetails: [
        "Custom vector arrow generators with adjustable head dimensions and color-coded bases.",
        "Dynamic plane mesh rendering showing the span of two independent vectors.",
        "Keyboard and pointer navigation allowing orbit, pan, and zoom without breaking canvas focus."
      ],
      verification: "Tested across Chrome, Firefox, and Edge on Intel UHD 620 integrated graphics; maintained 55-60 FPS during continuous rotation of 500-vertex parametric surfaces.",
      results: "Functional prototype enabling interactive exploration of 2x2 and 3x3 linear transformations. Used as supplementary material for peer study sessions.",
      tradeoffs: [
        "Pure Three.js implementation without React wrapper keeps bundle footprint light, but requires manual DOM event binding.",
        "Complex calculus surfaces are limited to 2,000 vertices to guarantee mobile compatibility."
      ],
      lessons: [
        "Direct buffer updates in WebGL are essential for interactive slider performance.",
        "Clear visual affordances (colored axes: Red=X, Green=Y, Blue=Z) eliminate user disorientation in 3D space."
      ]
    }
  },
  {
    id: "umkm-ecommerce",
    slug: "umkm-ecommerce",
    title: "Bilqish E-commerce & UMKM Data Collection",
    shortTitle: "UMKM E-commerce",
    summary: "Full-stack e-commerce architecture and digital transaction data intake platform developed for local micro-enterprises under the IUM Program.",
    category: "Web Applications",
    technologies: ["Astro JS", "JavaScript", "CSS3", "HTML5"],
    status: "Completed",
    myRole: "Full-Stack Architecture & Lead Developer",
    teamSize: 3,
    repoUrl: "https://github.com/Enki1030/Bilqish-ecommerce",
    demoNote: "Production staging environment. Source code accessible in team repository.",
    permissionToPublish: true,
    evidence: [
      "Built with Astro for near-zero runtime JavaScript on public catalog pages",
      "Streamlined intake workflow reducing data entry errors for non-technical stall owners"
    ],
    featuredOrder: 3,
    updatedAt: "2026-09-12",
    caseStudy: {
      problem: "Local micro-enterprises (UMKM) frequently struggle with complex digital inventory platforms, resulting in abandoned setups and unrecorded daily sales transactions.",
      constraints: [
        "Must be operable on low-end Android mobile devices with slow 3G/4G connections.",
        "Minimal maintenance overhead and lightweight page weight.",
        "Team coordination with members handling marketing strategies and proposal requirements."
      ],
      architecture: "Astro Static Shell -> Islands for Shopping Cart & Form Validation -> LocalStorage Session Cache -> WhatsApp Transaction Dispatch",
      architectureDetails: "Product catalogs are pre-rendered into static HTML during build for instant loading. Client-side hydration is restricted strictly to the cart counter and checkout form components.",
      myContribution: [
        "Spearheaded technical architecture and directory layout using Astro JS.",
        "Wrote responsive CSS styling and accessible interactive product modal views.",
        "Implemented formatted WhatsApp order dispatch encoding item quantities and customer notes."
      ],
      implementationDetails: [
        "Static image optimization reducing catalog asset weight by over 60%.",
        "Form validation with real-time feedback ensuring required address details before dispatch.",
        "Accessible navigation with clear tap targets (minimum 44x44px) across mobile views."
      ],
      verification: "Validated across multiple Android test devices (low-end 720p screens) with throttled 3G networks. Page load completed in under 1.4 seconds.",
      results: "Delivered a fully functional store catalog adopted for local micro-business products under the IUM (Izin Usaha Mikro) mentoring initiative.",
      tradeoffs: [
        "Using WhatsApp as the final order conduit avoided expensive payment gateway fees for owners, but requires manual payment verification by the merchant.",
        "Static catalog generation requires a rebuild trigger when prices update."
      ],
      lessons: [
        "Astro islands architecture is optimal for content-heavy catalogs that need small pockets of interactivity.",
        "Designing for low-bandwidth users requires disciplined asset budgeting and zero unnecessary third-party scripts."
      ]
    }
  },
  {
    id: "starlink-reseller",
    slug: "starlink-reseller",
    title: "Business Web Application: Starlink Reseller Catalog",
    shortTitle: "Reseller Catalog",
    summary: "Responsive web product catalog and specification browser engineered for an authorized third-party Starlink reseller.",
    category: "Web Applications",
    technologies: ["React JS", "HTML5", "CSS3"],
    status: "Completed",
    myRole: "Frontend Developer (UI/UX Implementation & Responsive Engineering)",
    repoUrl: "https://github.com/Enki1030/Project_Starlink",
    demoNote: "Internal commercial catalog. Client-identifying proprietary credentials omitted per confidentiality terms.",
    permissionToPublish: true,
    evidence: [
      "Modular React component structure with interactive equipment comparison",
      "Seamless responsive navigation tested across desktop and mobile breakpoints"
    ],
    featuredOrder: 4,
    updatedAt: "2026-08-20",
    caseStudy: {
      problem: "Prospective enterprise customers needed an accessible way to evaluate hardware specifications, service tiers, and cabling requirements without navigating bloated PDF documents.",
      constraints: [
        "Brand assets and product specifications must adhere to authorized reseller guidelines.",
        "Strict confidentiality regarding internal client pricing structures.",
        "Zero layout shifts when switching between hardware tier tabs."
      ],
      architecture: "Single Page React Application -> Hardware Catalog State -> Interactive Spec Comparison Matrix -> Inquiry Modal",
      architectureDetails: "Organized around reusable feature cards and dynamic specification comparison tables. State is lifted to catalog containers to ensure synchronized filtering across categories.",
      myContribution: [
        "Engineered the complete responsive UI using modern React and semantic CSS.",
        "Designed interactive tabbed comparisons for standard, high-performance, and mobile satellite kits.",
        "Optimized mobile navigation to ensure touch-friendly interaction for field sales representatives."
      ],
      implementationDetails: [
        "Keyboard-accessible interactive hardware tabs with explicit ARIA roles.",
        "Clean, legible typography highlighting power requirements, dish dimensions, and throughput specs.",
        "Inquiry modal with validation for corporate email and deployment location."
      ],
      verification: "Tested on desktop (1920x1080, 1366x768) and mobile devices (360px, 390px, 414px) with zero horizontal overflow and 100% interactive control functionality.",
      results: "Delivered on schedule for PT Tri Akses Nusantara, enabling sales staff to showcase equipment configurations directly on client site visits.",
      tradeoffs: [
        "Client opted for a client-side SPA over static generation to match existing internal hosting infrastructure.",
        "Inquiry dispatch routes directly to corporate email rather than CRM backend to match client workflow."
      ],
      lessons: [
        "Commercial clients value clear, immediate specification tables over decorative marketing animations.",
        "Early alignment on non-disclosure boundaries ensures code can be safely presented without confidentiality risks."
      ]
    }
  }
];
