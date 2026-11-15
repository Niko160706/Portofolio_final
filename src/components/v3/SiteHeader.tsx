import React, { useEffect, useRef, useState } from 'react';

interface SiteHeaderProps {
  activeSection: string;
}

const navItems = [
  { id: 'work', label: 'Work' },
  { id: 'lab', label: 'Lab' },
  { id: 'methods', label: 'Methods' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' }
];

export const SiteHeader: React.FC<SiteHeaderProps> = ({ activeSection }) => {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#top" className="brand" aria-label="The Human Protocol, home">
          <span className="brand-mark" aria-hidden="true">NR</span>
          <span className="brand-copy">
            <span className="brand-name">Niko Rajani</span>
            <span className="bitmap-label brand-label">The Human Protocol</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`site-nav__link ${activeSection === item.id ? 'is-active' : ''}`}
              aria-current={activeSection === item.id ? 'location' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="header-cv"
        >
          Resume <span aria-hidden="true">↓</span>
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <>
          <div className="mobile-menu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <nav ref={panelRef} id="mobile-navigation" className="mobile-menu" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>
                <span>{item.label}</span>
                <span className="mono-label">0{navItems.findIndex((nav) => nav.id === item.id) + 1}</span>
              </a>
            ))}
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mobile-menu__cv"
            >
              Download CV <span aria-hidden="true">↓</span>
            </a>
          </nav>
        </>
      )}
    </header>
  );
};
