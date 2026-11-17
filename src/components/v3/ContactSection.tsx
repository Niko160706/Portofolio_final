import React from 'react';
import { profile } from '../../data/profile';

interface ContactSectionProps {
  emailCopied: boolean;
  onCopyEmail: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ emailCopied, onCopyEmail }) => (
  <section id="contact" className="contact-band">
    <div className="container">
      <div className="contact-top">
        <span className="bitmap-label contact-label">Contact / direct channels</span>
        <span className="mono-label contact-status">
          <span className="status-dot status-dot--green" aria-hidden="true" />
          Open to internship
        </span>
      </div>

      <h2 className="contact-heading">
        Let&apos;s build something <span className="contact-accent">worth understanding.</span>
      </h2>

      <div className="contact-grid">
        <div className="contact-email-block">
          <span className="mono-label">Email</span>
          <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}</a>
          <div className="contact-copy">
            <button type="button" className="btn btn--light" onClick={onCopyEmail}>
              {emailCopied ? 'Copied ✓' : 'Copy address'}
            </button>
            <span className="contact-copy-status" aria-live="polite">
              {emailCopied ? 'Email address copied to clipboard.' : 'Opens your mail client.'}
            </span>
          </div>
        </div>

        <nav className="contact-links" aria-label="Contact and profile links">
          <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
            <span>LinkedIn</span><span aria-hidden="true">↗</span>
          </a>
          <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
            <span>GitHub</span><span aria-hidden="true">↗</span>
          </a>
          <a href="/CV_NikoRajaniSyahputra.pdf" target="_blank" rel="noopener noreferrer">
            <span>Download CV</span><span aria-hidden="true">↓</span>
          </a>
        </nav>
      </div>

      <p className="contact-note">
        Seeking a Data Engineering internship for Semester 6. Direct email and LinkedIn are prioritised.
      </p>
    </div>
  </section>
);
