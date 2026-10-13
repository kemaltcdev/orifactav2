"use client";
import {useEffect,useRef,useState} from "react";

export default function Ribbon({paused}:{paused:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
  const engine=useRef<{pause:(value:boolean)=>void;dispose:()=>void}|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let gone=false;
    const element=canvas.current;
    if(!element)return;
    const lost=(event:Event)=>{event.preventDefault();setReady(false);engine.current?.dispose();engine.current=null;};
    const init=async()=>{try{const {createRibbon}=await import("@/lib/ribbon-engine");if(gone)return;const created=await createRibbon(element,()=>{if(!gone)setReady(true);});if(gone){created?.dispose();return;}engine.current=created;engine.current?.pause(document.documentElement.dataset.motion==="paused");}catch{setReady(false);}};
    const restored=()=>{void init();};
    element.addEventListener("webglcontextlost",lost);element.addEventListener("webglcontextrestored",restored);
    void init();
    return()=>{gone=true;engine.current?.dispose();engine.current=null;element.removeEventListener("webglcontextlost",lost);element.removeEventListener("webglcontextrestored",restored);};
  },[]);
  useEffect(()=>{engine.current?.pause(paused);},[paused]);
  // A small label follows the pointer so the sculpture announces that it can be turned.
  function follow(event:React.PointerEvent<HTMLDivElement>){
    const r=event.currentTarget.getBoundingClientRect();
    stage.current?.style.setProperty("--hx",`${event.clientX-r.left}px`);
    stage.current?.style.setProperty("--hy",`${event.clientY-r.top}px`);
  }
  return <div ref={stage} className={`ribbon-stage${ready?" is-ready":""}`} aria-hidden="true" onPointerMove={follow}>
    <div className="ribbon-aura" />
    <img className="ribbon-poster" src="/assets/ribbon-poster.webp" width="1280" height="1440" alt="" fetchPriority="high" />
    <canvas ref={canvas} className="ribbon-canvas" />
    <span className="ribbon-hint">Drag to turn</span>
  </div>;
}
