const page = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent('http://192.168.10.141:4321/')}`, { method: 'PUT' }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (!handler) return; pending.delete(message.id); if (message.error) handler.reject(new Error(message.error.message)); else handler.resolve(message.result); });
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900 });
await send('Page.navigate', { url: 'http://192.168.10.141:4321/' });
await delay(4000);
await evaluate(`document.querySelector('.vector-control-deck')?.scrollIntoView({block:'start'}); true`);
await delay(1200);

const clickPreset = async (label) => {
  await evaluate(`Array.from(document.querySelectorAll('.matrix-presets button')).find((button)=>button.textContent.trim()===${JSON.stringify(label)})?.click(); true`);
  await delay(700);
  return JSON.parse(await evaluate(`JSON.stringify({active:document.querySelector('.matrix-presets [aria-pressed="true"]')?.textContent.trim(),results:document.querySelector('.vector-results')?.innerText,greeting:document.querySelector('.moro-companion__greeting span')?.textContent})`));
};

const rotation = await clickPreset('Rotate 45°');
const reflection = await clickPreset('Reflect Y');
await evaluate(`(()=>{const input=document.querySelector('.vector-controls input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'3');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));return true})()`);
await delay(700);
const vectorCommit = JSON.parse(await evaluate(`JSON.stringify({value:document.querySelector('.vector-controls output')?.textContent,results:document.querySelector('.vector-results')?.innerText,greeting:document.querySelector('.moro-companion__greeting span')?.textContent})`));
await evaluate(`Array.from(document.querySelectorAll('.vector-results button')).find((button)=>button.textContent.includes('Reset'))?.click(); true`);
await delay(500);
const reset = JSON.parse(await evaluate(`JSON.stringify({active:document.querySelector('.matrix-presets [aria-pressed="true"]')?.textContent.trim(),results:document.querySelector('.vector-results')?.innerText,greeting:document.querySelector('.moro-companion__greeting span')?.textContent})`));
await evaluate(`document.querySelector('.moro-companion__trigger')?.click(); true`);
await delay(300);
const dialogue = JSON.parse(await evaluate(`JSON.stringify({open:document.querySelector('.moro-companion__dialogue')!==null,message:document.querySelector('.moro-companion__message')?.textContent,actions:Array.from(document.querySelectorAll('.moro-companion__links button')).map((button)=>button.textContent.trim())})`));

process.stdout.write(`${JSON.stringify({ rotation, reflection, vectorCommit, reset, dialogue }, null, 2)}\n`);
socket.close();
process.exit(0);
