export interface ProfileData {
  name: string;
  fullName: string;
  headline: string;
  focusPill: string;
  location: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    period: string;
    details: string;
    gpa?: string;
  }>;
  experience: Array<{
    role: string;
    organization: string;
    period: string;
    location: string;
    responsibilities: string[];
  }>;
  skillCategories: Array<{
    category: string;
    skills: string[];
  }>;
  awards: Array<{
    title: string;
    organizer: string;
    year: string;
    details: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    credentialId: string;
    url: string;
  }>;
}

export const profile: ProfileData = {
  name: "Niko Rajani Syahputra",
  fullName: "Niko Rajani Syahputra Pane",
  headline: "Informatics student building AI systems, data workflows, and interactive web experiences.",
  focusPill: "Seeking Data Engineering Internship: Semester 6",
  location: "Surabaya, Jawa Timur, Indonesia",
  email: "gradientacademy57@gmail.com",
  linkedinUrl: "https://linkedin.com/in/niko-rajani-syahputra-1857b3403",
  githubUrl: "https://github.com/Niko160706",
  resumeUrl: "/resume.pdf",
  summary: "Mahasiswa S1 Informatika di Telkom University Surabaya dengan latar belakang SMK TKJ. Berpengalaman sebagai Wakil Ketua Divisi AI di UKM Coder mengajar komputasi dasar dan arsitektur neural network. Membangun platform pembelajaran visual kalkulus 3D, e-commerce pendataan UMKM, hingga sistem agen deep research berbasis otomasi.",
  education: [
    {
      institution: "Telkom University Surabaya",
      degree: "S1 Informatika",
      period: "Sep 2024 - Apr 2028 (Expected)",
      details: "Semester 5, IP semester terakhir 4.00. Aktif di UKM Coder dan kompetisi sains data / inovasi.",
      gpa: "3.86 of 4.00"
    },
    {
      institution: "SMKS Muhammadiyah",
      degree: "Teknik Komputer dan Jaringan (TKJ)",
      period: "Jun 2021 - Apr 2024",
      details: "Penerima Beasiswa Siswa Berprestasi 3 Tahun penuh."
    }
  ],
  experience: [
    {
      role: "Wakil Ketua Divisi AI",
      organization: "UKM Coder Telkom University",
      period: "Feb 2026 - Dec 2026",
      location: "Surabaya, Jawa Timur",
      responsibilities: [
        "Memandu dan mengajar materi dasar AI meliputi komputasi dasar, Naive Bayes, Artificial Neural Network (ANN), dan ResNet.",
        "Memfasilitasi sesi troubleshooting kuis pemrograman mingguan dan pendampingan proyek machine learning peserta.",
        "Menyusun kurikulum workshop implementasi praktis model klasifikasi untuk mahasiswa baru."
      ]
    },
    {
      role: "Intern Jaringan dan Komputer",
      organization: "PT Sipef AMR",
      period: "Feb 2023 - May 2023",
      location: "Singkut, Jambi",
      responsibilities: [
        "Membantu konfigurasi routing LAN, manajemen subnet, dan instalasi fisik workstation kantor baru.",
        "Memverifikasi konektivitas server internal dan melakukan pemeliharaan kabel terstruktur."
      ]
    }
  ],
  skillCategories: [
    {
      category: "Programming & Web",
      skills: ["React JS", "JavaScript", "TypeScript", "Astro JS", "HTML5", "CSS3", "Node JS", "SQL"]
    },
    {
      category: "AI & Machine Learning",
      skills: ["Python", "TensorFlow", "ANN", "ResNet", "Word2Vec", "Deep Learning", "SearXNG Automation"]
    },
    {
      category: "Systems & Infrastructure",
      skills: ["Network LAN Configuration", "Server Setup", "Linux (WSL)", "Git", "GitHub Actions"]
    },
    {
      category: "Design & Methods",
      skills: ["Figma UI/UX", "Canva", "Technical Documentation", "Interactive Prototyping"]
    }
  ],
  awards: [
    {
      title: "Finalis Pekan Ilmiah Mahasiswa (PIM) Nasional 2025",
      organizer: "Telkom University",
      year: "2025",
      details: "Ketua Tim lomba kompetisi bisnis inovatif: Strategi Positioning dan Nilai Keberlanjutan Produk Miselium."
    },
    {
      title: "Peserta Kompetisi Internal SATRIA DATA 2026",
      organizer: "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi",
      year: "2026",
      details: "Kompetisi Statistika Ria dan Festival Sains Data tingkat universitas."
    }
  ],
  certifications: [
    {
      name: "The Complete Full-Stack Web Development Bootcamp",
      issuer: "Udemy",
      credentialId: "UC-78eeb2f2-8655-4551-8ede-450c4bf0c86a",
      url: "https://www.udemy.com/certificate/UC-78eeb2f2-8655-4551-8ede-450c4bf0c86a/"
    },
    {
      name: "AI Engineer Core Track: LLM Engineering, RAG, QLoRA, Agents",
      issuer: "Udemy",
      credentialId: "UC-6beda5a5-71d0-4bc2-b5dd-f6c75840229d",
      url: "https://www.udemy.com/certificate/UC-6beda5a5-71d0-4bc2-b5dd-f6c75840229d/"
    },
    {
      name: "Artificial Intelligence Masterclass Bahasa",
      issuer: "Udemy",
      credentialId: "UC-de2fba23-d8ec-48f0-8143-3da76c06a7a8",
      url: "https://www.udemy.com/certificate/UC-de2fba23-d8ec-48f0-8143-3da76c06a7a8/"
    }
  ]
};
