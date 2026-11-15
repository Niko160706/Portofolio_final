import React from 'react';
import { profile } from '../../data/profile';

export const Hero = () => (
  <section id="hero" className="hero-v3">
    <div className="container hero-grid">
      <div className="hero-main">
        <p className="hero-eyebrow">
          <span>Niko Rajani Syahputra</span>
          <span className="hero-availability"><span className="status-dot status-dot--green" />Available for internship</span>
        </p>
        <h1 className="hero-title">
          <span>Interfaces that </span>
          <span>answer back<span className="hero-period">.</span></span>
        </h1>
        <p className="hero-subhead">I build AI systems, data workflows, and interactive experiences that make complex technology easier to explore.</p>
        <div className="hero-actions">
          <a href="#work" className="btn btn--primary">View Work ↗</a>
          <a href={profile.resumeUrl} className="btn btn--outline" download>Download Resume ↓</a>
          <a href="#contact" className="text-link">Contact ↗</a>
        </div>
        <span id="moro-hero-anchor" className="hero-moro-anchor" aria-hidden="true" />
        <div className="hero-foot">
          <span className="mono-label">Engineering, with a human point of view.</span>
          <span className="mono-label">Surabaya, Indonesia</span>
        </div>
      </div>
    </div>
  </section>
);
