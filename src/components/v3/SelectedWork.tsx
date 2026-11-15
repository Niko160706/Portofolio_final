import React from 'react';
import { projects } from '../../data/projects';
import { VectorDemo } from './VectorDemo';
import type { VectorDemoEvent } from './VectorDemo';
import { ResearchConsole } from './ResearchConsole';

interface SelectedWorkProps {
  onTraceInspect: () => void;
  traceSeen: boolean;
  onTraceStart: () => void;
  onTracePause: () => void;
  onTraceComplete: () => void;
  onTraceReset: () => void;
  onVectorInteraction: (event: VectorDemoEvent) => void;
  visualizeResetToken: number;
}

const statusTone = (status: string) => {
  if (status === 'Completed') return 'status-dot--green';
  if (status === 'In development') return 'status-dot--accent';
  return 'status-dot--gray';
};

const ProjectKicker: React.FC<{ index: string; project: (typeof projects)[number] }> = ({ index, project }) => (
  <div className="project-kicker">
    <span>{index}</span>
    <span>{project.category}</span>
    <span className="project-status">
      <span className={`status-dot ${statusTone(project.status)}`} aria-hidden="true" />
      {project.status}
    </span>
  </div>
);

const TechList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="tech-list" aria-label="Technologies">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

const ProjectLinks: React.FC<{ project: (typeof projects)[number] }> = ({ project }) => (
  <div className="project-links">
    <a className="text-link text-link--accent" href={`/projects/${project.slug}/`}>
      Read case study <span aria-hidden="true">→</span>
    </a>
    {project.repoUrl && (
      <a className="text-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
        Source <span aria-hidden="true">↗</span>
      </a>
    )}
  </div>
);

const ProjectFacts: React.FC<{ project: (typeof projects)[number] }> = ({ project }) => (
  <dl className="project-facts">
    <div><dt>Role</dt><dd>{project.myRole}</dd></div>
    <div><dt>Updated</dt><dd>{project.updatedAt}</dd></div>
    <div><dt>Stack</dt><dd>{project.technologies.slice(0, 4).join(' / ')}</dd></div>
  </dl>
);

type DeepResearchProps = Pick<SelectedWorkProps, 'onTraceInspect' | 'traceSeen' | 'onTraceStart' | 'onTracePause' | 'onTraceComplete' | 'onTraceReset'>;

const DeepResearch: React.FC<DeepResearchProps> = ({ onTraceInspect, traceSeen, onTraceStart, onTracePause, onTraceComplete, onTraceReset }) => {
  const project = projects.find((item) => item.id === 'deep-research') ?? projects[0];

  return (
    <article id="work-deep" className="project project--deep">
      <ProjectKicker index="01" project={project} />

      <header className="research-heading">
        <p className="research-eyebrow">A question is only the beginning.</p>
        <h3 className="project-title">Deep Research<br/><span>Follow the evidence.</span></h3>
        <p>A research pipeline that turns broad questions into structured, inspectable reports. Explore how planning, retrieval, and provenance fit together.</p>
        <ProjectLinks project={project} />
      </header>
      <ResearchConsole
        onInspect={onTraceInspect}
        onStart={onTraceStart}
        onPause={onTracePause}
        onComplete={onTraceComplete}
        onReset={onTraceReset}
        seen={traceSeen}
      />
      <div className="research-caption"><span className="legacy-stamp">[ HUMAN REVIEW REQUIRED ]</span><p>Built by Niko · Python / SearXNG · In development.<br/>Source discovery, extraction, and synthesis stay separate. Live execution and evaluation have not been re-run here.</p></div>
    </article>
  );
};

const Visualize: React.FC<{ onVectorInteraction: (event: VectorDemoEvent) => void; resetToken: number }> = ({ onVectorInteraction, resetToken }) => {
  const project = projects.find((item) => item.id === 'visualize') ?? projects[1];

  return (
    <article id="work-visualize" className="project project--visualize">
      <header className="visualize-heading">
        <ProjectKicker index="02" project={project} />
        <h3 className="project-title">{project.shortTitle}</h3>
        <p className="project-summary">{project.summary}</p>
      </header>

      <div className="visualize-workspace">
        <VectorDemo onInteraction={onVectorInteraction} resetToken={resetToken} />
      </div>

      <div className="visualize-companion-row">
        <div><h4>Ask MORO about the experiment.</h4><p>Select a transform or commit a vector value for a grounded explanation.</p></div>
        <span id="moro-visualize-anchor" className="visualize-moro-anchor" aria-hidden="true" />
      </div>

      <div className="visualize-engineering">
        <ProjectFacts project={project} />
        <TechList items={project.technologies} />
        <ProjectLinks project={project} />
      </div>
    </article>
  );
};

const Umkm: React.FC = () => {
  const project = projects.find((item) => item.id === 'umkm-ecommerce') ?? projects[2];

  return (
    <article id="work-umkm" className="project project--media-story project--umkm">
      <header className="media-story-heading">
        <ProjectKicker index="03" project={project} />
        <h3 className="project-title">{project.shortTitle}</h3>
        <p className="project-summary">{project.summary}</p>
        <ProjectLinks project={project} />
      </header>
      <a className="project-image-link umkm-image" href="/assets/portfolio/ecommerce.png" target="_blank" rel="noreferrer" aria-label="Open the Bilqish commerce project screenshot at full size">
        <img src="/assets/portfolio/ecommerce.png" alt="Bilqish commerce homepage featuring a shoe collection and editorial product photography" loading="lazy" decoding="async" />
      </a>
      <div className="media-story-details"><p>{project.caseStudy.problem}</p><ProjectFacts project={project} /><TechList items={project.technologies} /></div>
    </article>
  );
};

const Starlink: React.FC = () => {
  const project = projects.find((item) => item.id === 'starlink-reseller') ?? projects[3];
  return (
    <article id="work-starlink" className="project project--media-story project--starlink">
      <header className="media-story-heading starlink-heading">
        <ProjectKicker index="04" project={project} />
        <h3 className="project-title">{project.shortTitle}</h3>
        <p className="project-summary">{project.summary}</p>
        <ProjectLinks project={project} />
      </header>
      <a className="project-image-link starlink-image" href="/assets/portfolio/katalog-starlink.png" target="_blank" rel="noreferrer" aria-label="Open the reseller catalog screenshot at full size">
        <img src="/assets/portfolio/katalog-starlink.png" alt="Responsive reseller catalog landing page with satellite internet service packages" loading="lazy" decoding="async" />
      </a>
      <div className="media-story-details"><p>{project.caseStudy.problem}</p><ProjectFacts project={project} /><TechList items={project.technologies} /><p className="media-disclaimer">Independent reseller project; not an official Starlink website or endorsement.</p></div>
    </article>
  );
};

export const SelectedWork: React.FC<SelectedWorkProps> = ({ onTraceInspect, traceSeen, onTraceStart, onTracePause, onTraceComplete, onTraceReset, onVectorInteraction, visualizeResetToken }) => (
  <section id="work" className="section section--work">
    <div className="container">
      <header className="section-head">
        <div className="section-head-main">
          <span className="mono-label section-index">02 / Selected work</span>
          <h2 className="section-title">Selected work</h2>
          <p className="section-intro">
            Four systems I built, with the constraints, the checks, and what is still unfinished.
          </p>
        </div>
      </header>

      <div className="work-list">
        <DeepResearch
          onTraceInspect={onTraceInspect}
          traceSeen={traceSeen}
          onTraceStart={onTraceStart}
          onTracePause={onTracePause}
          onTraceComplete={onTraceComplete}
          onTraceReset={onTraceReset}
        />
        <Visualize onVectorInteraction={onVectorInteraction} resetToken={visualizeResetToken} />
        <Umkm />
        <Starlink />
      </div>
    </div>
  </section>
);
