export const MAIN_PATH = `M 200 -40
L 230 30 L 212 88 L 252 150 L 226 208 L 268 270 L 240 330
L 284 390 L 254 450 L 300 510 L 272 570 L 318 630 L 294 690 L 330 740
L 430 740 L 404 690 L 418 630 L 400 570 L 400 510 L 354 450
L 384 390 L 340 330 L 368 270 L 326 208 L 352 150 L 312 88
L 330 30 L 300 -40 Z`;

export const BRANCHES = [
  'M 252 150 L 168 130 L 130 96 L 92 104',
  'M 326 208 L 430 180 L 490 206 L 550 170',
  'M 286 476 L 190 508 L 142 560 L 118 640',
  'M 354 450 L 460 472 L 530 520 L 570 590'
];

export const PRECURSOR_PATH = 'M 296 326 L 304 319 L 309 329 L 320 323';
export const WHISPER_PATH = 'M 472 318 L 478 313 L 482 321 L 492 317';

export const FRACTURE_VIEWBOX = '0 0 1000 700';

export function fractureMaskDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FRACTURE_VIEWBOX}" preserveAspectRatio="none"><rect width="1000" height="700" fill="black"/><path d="${MAIN_PATH}" fill="white"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
