import { writeFileSync } from 'node:fs';

const [widthValue, heightValue, outputPath, selector = '#work-visualize'] = process.argv.slice(2);
const width = Number(widthValue);
const height = Number(heightValue);
if (!width || !height || !outputPath) throw new Error('Usage: node qa-visualize-cdp.mjs <width> <height> <output-path>');

const page = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent('http://192.168.10.141:4321/')}`, { method: 'PUT' }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 600, screenWidth: width, screenHeight: height });
await send('Page.navigate', { url: 'http://192.168.10.141:4321/' });
await delay(4000);
await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'start'});` });
await delay(1800);
const metrics = await send('Runtime.evaluate', { expression: `JSON.stringify({scrollX,scrollY,viewport:[innerWidth,innerHeight],section:document.getElementById('work-visualize')?.getBoundingClientRect().toJSON(),canvas:document.querySelector('.vector-stage')?.getBoundingClientRect().toJSON(),moro:{dataset:{...document.querySelector('.moro-companion')?.dataset},bounds:document.querySelector('.moro-companion')?.getBoundingClientRect().toJSON(),anchor:document.getElementById('moro-visualize-anchor')?.getBoundingClientRect().toJSON()},overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth})`, returnByValue: true });
const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
process.stdout.write(`${metrics.result.value}\n`);
socket.close();
process.exit(0);
