import Lenis from "lenis";

// One scroll loop for the whole page. Elements opt in with data attributes; CSS does the drawing.
//  data-scroll="enter"  0 → 1 while the element's top travels from the bottom of the viewport to 25% from the top
//  data-scroll="read"   0 → 1 while the element is being read (used by the word-by-word statement)
//  data-scroll="pin"    0 → 1 across a tall section whose child is sticky
//  data-scroll-var      writes to another custom property when an element sits inside a tracked parent
//  data-magnetic        follows the pointer a little (fine pointers only)
export type MotionEngine={lock:(locked:boolean)=>void;setPaused:(paused:boolean)=>void;dispose:()=>void};

const clamp=(value:number)=>Math.min(1,Math.max(0,value));

export function createMotion(header:HTMLElement|null,hero:HTMLElement|null):MotionEngine {
  const root=document.documentElement;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine=window.matchMedia("(pointer: fine)");
  let lenis:Lenis|null=null,locked=false,paused=root.dataset.motion==="paused",raf=0,lastY=window.scrollY;

  const smooth=()=>{
    const wanted=!paused&&!reduced.matches;
    if(wanted&&!lenis){lenis=new Lenis({lerp:.105,wheelMultiplier:.95,anchors:true,autoRaf:true});if(locked)lenis.stop();}
    else if(!wanted&&lenis){lenis.destroy();lenis=null;}
  };

  // Section reveals happen once.
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");reveal.unobserve(entry.target);}}),{threshold:.12,rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".reveal,.reveal-lines").forEach(element=>reveal.observe(element));

  const tracked=[...document.querySelectorAll<HTMLElement>("[data-scroll]")];
  const values=new WeakMap<HTMLElement,number>();
  const nav=header?.querySelector<HTMLElement>(".desktop-nav")??null;
  const links=nav?[...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")]:[];
  const targets=links.map(link=>document.getElementById(link.hash.slice(1)));
  let active=-2;

  const progress=(element:HTMLElement,h:number)=>{
    const r=element.getBoundingClientRect(),mode=element.dataset.scroll;
    if(mode==="pin")return clamp(-r.top/Math.max(1,r.height-h));
    if(mode==="enter")return clamp((h-r.top)/(h*.75));
    if(mode==="read")return clamp((h*.86-r.top)/(r.height+h*.28));
    return clamp((h-r.top)/(h+r.height));
  };

  const markActive=(index:number)=>{
    if(index===active||!nav)return;active=index;
    links.forEach((link,i)=>link.classList.toggle("is-active",i===index));
    const link=links[index];
    if(!link){nav.style.setProperty("--indicator-scale","0");return;}
    nav.style.setProperty("--indicator-x",`${link.offsetLeft}px`);
    nav.style.setProperty("--indicator-w",`${link.offsetWidth}px`);
    nav.style.setProperty("--indicator-color",getComputedStyle(link).getPropertyValue("--c")||"#fff");
    nav.style.setProperty("--indicator-scale","1");
  };

  const update=()=>{
    raf=0;
    const y=window.scrollY,h=window.innerHeight;
    if(header){
      header.classList.toggle("scrolled",y>30);
      if(Math.abs(y-lastY)>6){header.classList.toggle("tucked",y>lastY&&y>h*.7&&!header.contains(document.activeElement)&&!root.classList.contains("menu-open"));lastY=y;}
    }
    hero?.style.setProperty("--hero-progress",clamp(y/h).toFixed(4));
    for(const element of tracked){
      const value=Math.round(progress(element,h)*1000)/1000;
      if(values.get(element)!==value){values.set(element,value);element.style.setProperty(element.dataset.scrollVar||"--p",String(value));}
    }
    let index=-1;
    targets.forEach((target,i)=>{if(target&&target.getBoundingClientRect().top<h*.45)index=i;});
    const last=targets[targets.length-1];
    if(last&&last.getBoundingClientRect().bottom<h*.3)index=-1;
    markActive(index);
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};

  // Magnetic controls drift towards the pointer, then settle back.
  const magnets=[...document.querySelectorAll<HTMLElement>("[data-magnetic]")];
  const pull=(event:PointerEvent)=>{
    if(!fine.matches||paused||reduced.matches)return;
    const element=event.currentTarget as HTMLElement,r=element.getBoundingClientRect();
    const strength=Number(element.dataset.magnetic)||.3;
    element.style.setProperty("--mx",`${((event.clientX-r.left)/r.width-.5)*r.width*strength}px`);
    element.style.setProperty("--my",`${((event.clientY-r.top)/r.height-.5)*r.height*strength}px`);
  };
  const release=(event:PointerEvent)=>{const element=event.currentTarget as HTMLElement;element.style.setProperty("--mx","0px");element.style.setProperty("--my","0px");};
  magnets.forEach(element=>{element.addEventListener("pointermove",pull);element.addEventListener("pointerleave",release);});

  // The footer wordmark is lit by the pointer.
  const wordmark=document.querySelector<HTMLElement>(".footer-wordmark");
  const footer=wordmark?.closest("footer")??null;
  const light=(event:PointerEvent)=>{
    if(!wordmark||!fine.matches)return;
    const r=wordmark.getBoundingClientRect();
    wordmark.classList.add("is-tracking");
    wordmark.style.setProperty("--lx",`${event.clientX-r.left}px`);
    wordmark.style.setProperty("--ly",`${event.clientY-r.top}px`);
  };
  const dim=()=>wordmark?.classList.remove("is-tracking");
  footer?.addEventListener("pointermove",light);footer?.addEventListener("pointerleave",dim);

  const onPreference=()=>{smooth();schedule();};
  reduced.addEventListener("change",onPreference);
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule);
  smooth();update();
  root.dataset.enhanced="true";

  return {
    lock(value){locked=value;if(value)lenis?.stop();else lenis?.start();},
    setPaused(value){paused=value;smooth();schedule();},
    dispose(){
      reveal.disconnect();cancelAnimationFrame(raf);lenis?.destroy();lenis=null;
      window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);
      reduced.removeEventListener("change",onPreference);
      magnets.forEach(element=>{element.removeEventListener("pointermove",pull);element.removeEventListener("pointerleave",release);});
      footer?.removeEventListener("pointermove",light);footer?.removeEventListener("pointerleave",dim);
      delete root.dataset.enhanced;
    },
  };
}
