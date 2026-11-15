# Superseded browser tests

These Playwright scripts target earlier V3/refinement interfaces. They reference
selectors and controls that no longer exist in the current build, including:

- `Run sample trace`, `Pause`, `Resume`, `Inspect sources`, and `Claim`
  from an older research-console layout,
- `Product detail` and `Order intake` from the unused `ProductPreview` component,
- `.moro-launcher`, `.moro-dock`, and `Give MORO a pat` from the earlier SVG
  companion.

They are preserved for history and should not be run against the current site.

Current browser checks:

- `tests/moro-placement.cjs` for companion placement, rapid scrolling, resizing,
  and mobile viewport behavior.
- `tests/v3_e2e.py` for the legacy Selenium smoke path, when a compatible
  Chrome/Selenium environment is available.

The current automated unit/static suite is still `npm test`.
