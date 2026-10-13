"use client";
import {useEffect,useRef,useState} from "react";

// The supplied gradient is the poster; the live field replaces it once the first frame is drawn.
export default function Field({paused}:{paused:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const engine=useRef<{pause:(value:boolean)=>void;dispose:()=>void}|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let gone=false;
    const element=canvas.current;
    if(!element)return;
    const lost=(event:Event)=>{event.preventDefault();setReady(false);engine.current?.dispose();engine.current=null;};
    const init=async()=>{try{const {createSpectrumField}=await import("@/lib/spectrum-field");if(gone)return;engine.current=createSpectrumField(element,()=>{if(!gone)setReady(true);});engine.current?.pause(document.documentElement.dataset.motion==="paused");}catch{setReady(false);}};
    const restored=()=>{void init();};
    element.addEventListener("webglcontextlost",lost);element.addEventListener("webglcontextrestored",restored);
    void init();
    return()=>{gone=true;engine.current?.dispose();engine.current=null;element.removeEventListener("webglcontextlost",lost);element.removeEventListener("webglcontextrestored",restored);};
  },[]);
  useEffect(()=>{engine.current?.pause(paused);},[paused]);
  return <div className={`field-stage${ready?" is-ready":""}`} aria-hidden="true">
    <img className="field-poster" src="/assets/brand/orifacta-gradient.jpg" width="1536" height="864" alt="" loading="lazy" />
    <canvas ref={canvas} className="field-canvas" />
  </div>;
}
