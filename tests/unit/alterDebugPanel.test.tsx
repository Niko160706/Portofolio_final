import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AlterDebugPanel } from '../../src/components/alter/AlterDebugPanel';
import { createInitialAlterState } from '../../src/lib/alter/alterMachine';
import { shouldShowAlterDebug } from '../../src/lib/alter/alterDebug';

describe('Alter debug controls', () => {
  it('is available only in development or the alter-debug QA build', () => {
    expect(shouldShowAlterDebug({ dev: true, mode: 'development', search: '?alterDebug=1' })).toBe(true);
    expect(shouldShowAlterDebug({ dev: false, mode: 'alter-debug', search: '?alterDebug=1' })).toBe(true);
    expect(shouldShowAlterDebug({ dev: true, mode: 'development', search: '?foo=1' })).toBe(false);
    expect(shouldShowAlterDebug({ dev: false, mode: 'production', search: '?alterDebug=1' })).toBe(false);
  });

  it('renders the phase inspector and deterministic controls', () => {
    const html = renderToStaticMarkup(
      <AlterDebugPanel
        state={createInitialAlterState()}
        dispatch={() => {}}
        eventLog={[]}
        reset={() => {}}
        hydrated
      />
    );
    expect(html).toContain('ALTER / DEV');
    expect(html).toContain('phase: P0');
    expect(html).toContain('C01');
    expect(html).toContain('Reveal');
    expect(html).toContain('Reset');
  });
});
