import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

const stages = [
  { title: 'Define objective', body: 'Scope the question, record assumptions, and identify what needs evidence.' },
  { title: 'Build question map', body: 'Split the objective into focused sub-questions before retrieval.' },
  { title: 'Discover sources', body: 'A search adapter would dispatch sub-queries to SearXNG. No network request is made in this preview.' },
  { title: 'Retrieve documents', body: 'Normalize document text while retaining origin URLs and retrieval context.' },
  { title: 'Extract evidence', body: 'Attach each extracted passage to its document. Keep observations separate from interpretation.' },
  { title: 'Evaluate claims', body: 'Check support for assertions. Flag missing or conflicting evidence for human review.' },
  { title: 'Generate report', body: 'Compile the workflow into a structured report. This illustration does not produce factual findings.' }
];

const researchTemplates = {
  provenance: 'How can retrieval systems preserve source provenance from discovery through synthesis?',
  evidence: 'What methods help identify unsupported or conflicting claims in retrieved documents?',
  evaluation: 'How should a research pipeline evaluate retrieval quality without confusing coverage with citation validity?',
  architecture: 'How can planning, source discovery, extraction, and review be separated in a research workflow?'
} as const;

const sourceNotes = {
  Document: 'Keep the original URL and retrieval context attached to each document.',
  Evidence: 'Store the extracted passage with a direct link back to its document.',
  Claim: 'Keep supporting evidence attached. Flag claims that remain unresolved.'
} as const;

type ConsoleView = 'terminal' | 'sources' | 'report';
type SourceNode = keyof typeof sourceNotes;

interface ResearchConsoleProps {
  onInspect: () => void;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onReset: () => void;
  seen: boolean;
}

export function ResearchConsole({ onInspect, onStart, onPause, onComplete, onReset, seen }: ResearchConsoleProps) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [topic, setTopic] = useState('How can retrieval systems preserve provenance?');
  const [commandEcho, setCommandEcho] = useState('/research How can retrieval systems preserve provenance?');
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState<ConsoleView>('terminal');
  const [selectedSource, setSelectedSource] = useState<SourceNode>('Document');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    if (step >= stages.length) {
      setRunning(false);
      onCompleteRef.current();
      return;
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 950);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  useEffect(() => {
    if (started && outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [step, notice, started, view]);

  const run = (question?: string, command?: string) => {
    const resolvedQuestion = question?.trim() || 'How can retrieval systems preserve provenance?';
    onStart();
    setTopic(resolvedQuestion);
    setCommandEcho(command || `/research ${resolvedQuestion}`);
    setStep(0);
    setStarted(true);
    setRunning(true);
    setNotice('');
    setView('terminal');
  };

  const reset = () => {
    setRunning(false);
    setStep(0);
    setStarted(false);
    setNotice('');
    setInput('');
    setView('terminal');
    setHistoryIndex(-1);
    onReset();
  };

  const interrupt = () => {
    if (running) {
      setRunning(false);
      onPause();
      setNotice('Interrupted. Use /resume to continue or /reset to clear the trace.');
      setView('terminal');
    } else {
      setInput('');
    }
  };

  const execute = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setHistory((items) => [...items, value].slice(-20));
    setHistoryIndex(-1);
    setInput('');

    const [name, ...args] = value.split(/\s+/);
    const argument = args.join(' ');

    switch (name.toLowerCase()) {
      case '/research':
      case 'research':
        run(argument, `/research ${argument || 'How can retrieval systems preserve provenance?'}`);
        break;
      case '/template': {
        const template = researchTemplates[argument.toLowerCase() as keyof typeof researchTemplates];
        if (!template) {
          setNotice([
            'Available search templates',
            ...Object.keys(researchTemplates).map((key) => `  /template ${key}`)
          ].join('\n'));
          setView('terminal');
          break;
        }
        run(template, `/template ${argument.toLowerCase()}`);
        break;
      }
      case '/help':
      case 'help':
        setView('terminal');
        setNotice([
          'Commands',
          '  /research <question>   start the illustrative workflow',
          '  /template <name>       run a prepared research question',
          '                         provenance, evidence, evaluation, architecture',
          '  /pause                 pause the current trace',
          '  /resume                continue a paused trace',
          '  /sources               inspect the provenance model',
          '  /source <node>         inspect document, evidence, or claim',
          '  /report                show the completed workflow summary',
          '  /inspect               open the fictional diagnostic',
          '  /reset                 clear the current trace',
          '  /help                  show this command list'
        ].join('\n'));
        break;
      case '/pause':
        if (!running) {
          setNotice('No active trace. Start one with /research <question>.');
          setView('terminal');
          break;
        }
        setRunning(false);
        onPause();
        setNotice('Trace paused. Use /resume to continue.');
        setView('terminal');
        break;
      case '/resume':
        if (!started || step >= stages.length) {
          setNotice('Start a trace with /research <question>.');
          setView('terminal');
          break;
        }
        onStart();
        setRunning(true);
        setNotice('');
        setView('terminal');
        break;
      case '/sources':
        setView('sources');
        setNotice('');
        break;
      case '/source': {
        const node = argument.toLowerCase();
        const match = (Object.keys(sourceNotes) as SourceNode[]).find((item) => item.toLowerCase() === node);
        if (!match) {
          setNotice('Choose a source node: /source document, /source evidence, or /source claim.');
          setView('terminal');
          break;
        }
        setSelectedSource(match);
        setView('sources');
        setNotice('');
        break;
      }
      case '/report':
        if (step !== stages.length) {
          setNotice('The workflow summary is available after all seven stages.');
          setView('terminal');
          break;
        }
        setView('report');
        setNotice('');
        break;
      case '/inspect':
        onInspect();
        setNotice('Fictional diagnostic requested. Portfolio content is unchanged.');
        setView('terminal');
        break;
      case '/reset':
      case '/clear':
        reset();
        break;
      default:
        setNotice(`Unknown command: ${name}. Type /help to see the available commands.`);
        setView('terminal');
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    execute(input);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' || (event.ctrlKey && event.key.toLowerCase() === 'c')) {
      event.preventDefault();
      interrupt();
      return;
    }
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[history.length - 1 - next]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.max(-1, historyIndex - 1);
      setHistoryIndex(next);
      setInput(next === -1 ? '' : history[history.length - 1 - next]);
    }
  };

  return (
    <section className="research-terminal" aria-label="Interactive Deep Research command line preview">
      <header className="cli-chrome">
        <span>niko@human-protocol</span>
        <span className="cli-window-path">:~/deep-research</span>
        <span className="cli-local">illustrative local session</span>
      </header>

      <div className="cli-viewport" ref={outputRef} aria-live="polite" aria-relevant="additions text">
        {view === 'terminal' && (
          <>
            {!started && (
              <div className="cli-welcome">
                <svg className="cli-infinity" viewBox="0 0 48 24" role="img" aria-label="Infinity mark"><path d="M24 12c-5 7-8 9-12 9a9 9 0 1 1 0-18c4 0 7 2 12 9Zm0 0c5-7 8-9 12-9a9 9 0 1 1 0 18c-4 0-7-2-12-9Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div>
                  <strong>Deep Research <span>/ preview</span></strong>
                  <p>A question, a trace, an inspectable report.</p>
                  <p>Python / SearXNG / human review</p>
                </div>
              </div>
            )}

            {!started ? (
              <div className="cli-intro">
                <p>This browser preview does not search the web, call a model, or execute shell commands.</p>
                <div className="cli-template-list" aria-label="Illustrative research prompt templates">
                  <p>Prepared searches <span>/ illustrative only</span></p>
                  <pre>{`/template provenance   source history to synthesis
/template evidence     unsupported or conflicting claims
/template evaluation  retrieval quality and citation validity
/template architecture separate planning, retrieval, review`}</pre>
                  <p>Or enter <code>/research &lt;your question&gt;</code>. Type <code>/help</code> for controls.</p>
                </div>
              </div>
            ) : (
              <div className="cli-trace">
                <p className="cli-echo">niko@human-protocol:~/deep-research$ {commandEcho}<br /><span className="cli-question">{topic}</span></p>
                <div className="cli-trace-entries">
                  {stages.slice(0, step).map((stage, index) => (
                    <div className="cli-entry" key={stage.title}>
                      <p><span className="cli-bullet" aria-hidden="true">›</span><strong>{stage.title}</strong><span className="cli-step-number">{String(index + 1).padStart(2, '0')} / 07</span></p>
                      <p className="cli-entry-detail">{stage.body}</p>
                    </div>
                  ))}
                </div>
                {running && <p className="cli-working"><span aria-hidden="true" />Working through the illustrative pipeline...</p>}
                {!running && step === stages.length && <p className="cli-complete">Workflow complete. Type /report to inspect its scope and limits.</p>}
              </div>
            )}

            {notice && <pre className="cli-notice">{notice}</pre>}
          </>
        )}

        {view === 'sources' && (
          <div className="cli-sources">
            <p className="cli-overline">CONCEPTUAL PROVENANCE</p>
            <pre className="cli-source-tree">{`Document  --origin-->  Evidence  --supports-->  Claim\n    |                     |                        |\n    + URL and context     + extracted passage     + review status`}</pre>
            <p className="cli-source-detail"><strong>{selectedSource}</strong>: {sourceNotes[selectedSource]}</p>
            <p className="cli-hint">Inspect another node with /source document, /source evidence, or /source claim.</p>
            <p className="cli-hint">These are conceptual relationships. No sources or evidence are loaded.</p>
          </div>
        )}

        {view === 'report' && (
          <div className="cli-report">
            <p className="cli-overline">WORKFLOW SUMMARY / ILLUSTRATIVE</p>
            <h4>{topic}</h4>
            <p>Seven pipeline stages demonstrated. No factual findings were generated.</p>
            <h5>Designed to</h5>
            <p>Separate planning from retrieval, preserve source origins, and make synthesis reviewable.</p>
            <h5>Verified by this preview</h5>
            <p>Only the interface sequence and controls. Search quality, extraction accuracy, runtime, and citation validity are not evaluated here.</p>
            <a href="/projects/deep-research/">Open the engineering case study</a>
          </div>
        )}
      </div>

      <div className="cli-bottom">
        <form className="cli-input-row" onSubmit={submit}>
          <label htmlFor="research-command"><span aria-hidden="true">❯</span><span className="sr-only">Research command</span></label>
          <input
            id="research-command"
            value={input}
            maxLength={240}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Research command"
            placeholder="/research <question>"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </form>
        <div className="cli-footer">
          <span><kbd>ENTER</kbd> execute <kbd>↑</kbd><kbd>↓</kbd> history <kbd>ESC</kbd> interrupt</span>
          <span>{running ? 'trace: running' : started && step === stages.length ? 'trace: complete' : 'no live model or network'}</span>
        </div>
      </div>
    </section>
  );
}
