export function shouldShowAlterDebug({
  dev,
  mode,
  search
}: {
  dev: boolean;
  mode: string;
  search: string;
}): boolean {
  if (!dev && mode !== 'alter-debug') return false;
  return new URLSearchParams(search).has('alterDebug');
}
