import React from 'react';

const methods = [
  {
    title: 'Evidence over claims',
    body: 'Benchmarks, constraints, and tradeoffs ship with the work. Unverified numbers are labelled as reported or left out.'
  },
  {
    title: 'Retrieval before synthesis',
    body: 'Query planning and source normalization stay separate from generation, so citations can be inspected instead of trusted.'
  },
  {
    title: 'Build, verify, iterate',
    body: 'Break a problem into small interfaces, implement a working slice, and check the result. AI coding agents help with iteration; their output still needs review, tests, and honest limits.'
  }
];

export const MethodsSection: React.FC = () => (
  <section id="methods" className="section section--methods">
    <div className="container">
      <header className="section-head">
        <div className="section-head-main">
          <span className="mono-label section-index">04 / How I work</span>
          <h2 className="section-title">How I work</h2>
        </div>
        <p className="section-intro">
          Observe the problem. Research the constraints. Design a small system, implement it, verify it, then iterate.
        </p>
      </header>

      <ol className="method-list">
        {methods.map((method, index) => (
          <li key={method.title}>
            <span className="method-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{method.title}</h3>
            <p>{method.body}</p>
          </li>
        ))}
      </ol>

      <p className="method-footnote mono-label">
        Practice / verify → disclose → revise
      </p>
    </div>
  </section>
);
