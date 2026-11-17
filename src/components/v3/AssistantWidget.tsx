import {useEffect,useRef,useState} from 'react';
import {MoroCharacter} from './MoroCharacter';
export interface AssistantWidgetProps {onOpenProjects:()=>void;onOpenContact:()=>void;onInspectSystem:()=>void;glitching?:boolean;effectsEnabled?:boolean}
export function AssistantWidget({onOpenProjects,onOpenContact,onInspectSystem,glitching=false,effectsEnabled=true}:AssistantWidgetProps) {
  const [enabled,setEnabled]=useState(true),[open,setOpen]=useState(false),[petted,setPetted]=useState(false);
  const [context,setContext]=useState("Hi, I'm MORO. A little company while you explore."),[greeting,setGreeting]=useState(false);
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
  const petTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{
    try{setEnabled(localStorage.getItem('moro-disabled')!=='true');if(!sessionStorage.getItem('moro-greeted')){setGreeting(true);sessionStorage.setItem('moro-greeted','true')}}catch{}
    const timer=setTimeout(()=>setGreeting(false),6500);
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setContext(e.target.id==='contact'?"Found something interesting? You can reach Niko here.":e.target.id==='work-visualize'?"Try changing the vector. You can rotate the view, too.":"This one follows evidence. Try typing /research in the terminal.")}),{threshold:.25});
    ['work-deep','work-visualize','contact'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el)});
    return()=>{clearTimeout(timer);observer.disconnect();if(petTimer.current)clearTimeout(petTimer.current)};
  },[]);
  useEffect(()=>{
    if(!enabled||!effectsEnabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;
    const move=(e:PointerEvent)=>{if(e.pointerType==='touch'||frame)return;frame=requestAnimationFrame(()=>{frame=0;const rect=trigger.current?.getBoundingClientRect();if(!rect)return;const x=Math.max(-1,Math.min(1,(e.clientX-rect.x-rect.width/2)/300)),y=Math.max(-1,Math.min(1,(e.clientY-rect.y-rect.height/2)/300));root.current?.style.setProperty('--look-x',`${x*4}px`);root.current?.style.setProperty('--look-y',`${y*3}px`);root.current?.style.setProperty('--moro-lean',`${x*4}deg`)})};
    window.addEventListener('pointermove',move,{passive:true});return()=>{window.removeEventListener('pointermove',move);cancelAnimationFrame(frame)};
  },[enabled,effectsEnabled]);
  useEffect(()=>{if(!open)return;panel.current?.focus();const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside)}},[open]);
  const disable=()=>{setEnabled(false);setOpen(false);try{localStorage.setItem('moro-disabled','true')}catch{}};
  return <div ref={root} className={`moro-dock ${!effectsEnabled?'moro-still':''} ${petted?'is-petted':''} ${glitching?'moro-anomaly':''}`} data-state={!enabled?'disabled':glitching?'anomaly':petted?'happy':open?'listening':'idle'}>
    {!enabled?<button className="moro-enable" onClick={()=>{setEnabled(true);try{localStorage.setItem('moro-disabled','false')}catch{}}}>Enable MORO</button>:<>
      {greeting&&!open&&<div className="moro-greeting"><span>Hey, I'm MORO. Say hello?</span><button aria-label="Dismiss MORO greeting" onClick={()=>setGreeting(false)}>×</button></div>}
      {open&&<div ref={panel} className="moro-popover" role="dialog" aria-modal="false" aria-label="MORO companion" tabIndex={-1}>
        <header><span><i/>MORO <small>{petted?'happy to see you':'here with you'}</small></span><button aria-label="Close MORO dialogue" onClick={()=>{setOpen(false);trigger.current?.focus()}}>×</button></header>
        <p className="moro-message" aria-live="polite">{petted?"Oh. That was nice. Thanks for stopping by.":context}</p>
        <div className="moro-quick-actions"><button onClick={()=>{onOpenProjects();setOpen(false)}}>Show me the work ↗</button><button onClick={()=>{onOpenContact();setOpen(false)}}>Contact Niko ↗</button><a href="/CV_NikoRajaniSyahputra.pdf" download>Get the resume ↓</a><button onClick={()=>{setPetted(true);if(petTimer.current)clearTimeout(petTimer.current);petTimer.current=setTimeout(()=>setPetted(false),1800)}}>Give MORO a pat</button></div>
        <footer><span>Scripted companion · no live AI</span><button onClick={disable}>Disable MORO</button></footer>
        <details className="moro-details"><summary>Something feels unusual?</summary><p>A small fictional story lives here.</p><button onClick={()=>{setOpen(false);onInspectSystem()}}>Inspect unusual signal</button></details>
      </div>}
      <button ref={trigger} className="moro-launcher" aria-label="Talk to MORO" aria-expanded={open} onClick={()=>{setOpen(!open);setGreeting(false)}}><MoroCharacter/><span className="moro-name">MORO <i/></span></button>
    </>}
  </div>;
}
