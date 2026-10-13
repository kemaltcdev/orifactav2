"use client";
import {Fragment,useEffect,useRef,useState,type CSSProperties} from "react";
import type {MotionEngine} from "@/lib/motion";
import Ribbon from "./Ribbon";
import Field from "./Field";
import Contact from "./Contact";
import Projects from "./Projects";
import {Icon} from "./Icon";

// Five services, five stops of the brand spectrum. The colour travels with the service wherever it appears.
const services=[
 {name:"Websites",color:"#ff8a1f",line:"Make the first impression count.",description:"Distinctive websites that express who you are and give people a clear reason to stay, explore and take the next step.",tags:["Brand websites","E-commerce","Content management"],form:"Website"},
 {name:"Web applications",color:"#f2179a",line:"Bring clarity to complex work.",description:"Useful, intuitive platforms that turn a complicated process into something people can navigate with confidence.",tags:["Customer portals","SaaS products","Dashboards & platforms"],form:"Web application"},
 {name:"Mobile applications",color:"#8b5cff",line:"Be there for the everyday.",description:"Thoughtful mobile experiences, designed for real people and built to feel at home on the devices they use.",tags:["iOS & Android","Product design","Connected experiences"],form:"Mobile application"},
 {name:"B2B & custom software",color:"#2f6bff",line:"Build around your business.",description:"Ordering portals, internal tools and connected systems that fit the way your business actually works — and where it’s going.",tags:["B2B ordering","ERP integrations","Internal tools"],form:"B2B / custom software"},
 {name:"Automation",color:"#19d3ee",line:"Give your time back.",description:"Connect the tools you already use. Remove repetitive steps, keep information moving and let your team focus on work that matters.",tags:["Workflow automation","System integration","Reporting"],form:"Automation"},
];
const process=[
 {title:"Understand",line:"The right questions first.",body:"We get clear on the people, the problem and what a good outcome looks like. Then we agree on a focused scope."},
 {title:"Shape",line:"Make the direction tangible.",body:"Structure, design and interactive prototypes turn the idea into something you can see, use and give feedback on."},
 {title:"Build",line:"Care in every detail.",body:"We bring the experience to life, connect the moving parts and test across devices before anything goes live."},
 {title:"Evolve",line:"Launch is a beginning.",body:"A clear handover, a considered launch and room to improve. We can keep working with you as the business grows."},
];
const principles=[
 {title:"Close to the work. Closer to your goals.",body:"Direct collaboration with the people shaping and building your product. A shared understanding from the start."},
 {title:"Every detail has a purpose.",body:"From the first interaction to the system behind it, the decisions that matter deserve care and attention."},
 {title:"Yours to grow.",body:"Clear documentation, thoughtful handover and a foundation that can move forward with your business."},
];
const faqs=[
 {q:"Can we start with just an idea?",a:"Absolutely. You don’t need a finished brief. Tell us what you’re trying to achieve, what feels difficult today and who it’s for. We’ll help shape a useful first step."},
 {q:"Can you work with our existing systems?",a:"Yes. We can assess your current website, software and workflows, then identify what to keep, improve or connect. Integrations depend on the access and APIs available in your existing tools."},
 {q:"How do you price and plan a project?",a:"We define the scope, priorities and milestones with you first. You receive a proposal based on that scope, with a clear view of the deliverables, timing and cost before work begins."},
 {q:"What happens after launch?",a:"We provide a handover so you understand what has been built. Ongoing support, maintenance and further development can be agreed around what your project needs."},
];
const links=[{id:"expertise",name:"Expertise",color:"#ff8a1f"},{id:"possibilities",name:"In practice",color:"#f2179a"},{id:"approach",name:"Approach",color:"#8b5cff"},{id:"studio",name:"Studio",color:"#19d3ee"}];
const statement="The best digital experiences don’t just look good. They make things work better.".split(" ");

// The approach curve is a real ribbon: its width follows a slow twist, and the reverse side is shaded.
const nodes=[[-60,24],[36,46],[344,122],[652,70],[960,142],[1260,90]];
function centre(t:number){
 const f=t*(nodes.length-1),i=Math.min(nodes.length-2,Math.floor(f)),u=f-i;
 const p0=nodes[Math.max(0,i-1)],p1=nodes[i],p2=nodes[i+1],p3=nodes[Math.min(nodes.length-1,i+2)];
 return [0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u));
}
const ribbon=(()=>{
 const samples=280,twist=(t:number)=>Math.cos(t*Math.PI*4.4+.5),points=[...Array(samples+1)].map((_,i)=>centre(i/samples));
 const faces:{d:string;back:boolean}[]=[];let left:number[][]=[],right:number[][]=[];
 const close=(back:boolean)=>{if(left.length>1)faces.push({back,d:`M${left.map(p=>p.map(v=>v.toFixed(1)).join(" ")).join("L")}L${right.reverse().map(p=>p.map(v=>v.toFixed(1)).join(" ")).join("L")}Z`});};
 for(let i=0;i<=samples;i++){
  const a=points[Math.max(0,i-1)],b=points[Math.min(samples,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
  const n=[-(b[1]-a[1])/len,(b[0]-a[0])/len],c=twist(i/samples),w=16*Math.max(.05,Math.abs(c));
  if(i>0&&Math.sign(c)!==Math.sign(twist((i-1)/samples))){const keep=[left[left.length-1],right[right.length-1]];close(twist((i-1)/samples)<0);left=[keep[0]];right=[keep[1]];}
  left.push([points[i][0]+n[0]*w,points[i][1]+n[1]*w]);right.push([points[i][0]-n[0]*w,points[i][1]-n[1]*w]);
 }
 close(twist(1)<0);
 return {faces,line:`M${points.map(p=>p.map(v=>v.toFixed(1)).join(" ")).join("L")}`};
})();

function Logo({className=""}:{className?:string}){return <img className={`brand-logo ${className}`} src="/assets/brand/orifacta-white.svg" alt="orifacta" width="201" height="79"/>;}
// Arrows sit in a round chip; on hover one leaves and the next arrives.
function Chip({name="arrow"}:{name?:string}){return <span className="chip" aria-hidden="true"><Icon name={name}/><Icon name={name}/></span>;}
function Lines({lines}:{lines:string[]}){return <>{lines.map((line,i)=><span className="line" key={line}><span style={{"--i":i} as CSSProperties}>{line}</span></span>)}</>;}

export default function Studio(){
 const [contactOpen,setContactOpen]=useState(false),[initialService,setInitialService]=useState("Let's figure it out"),[menuOpen,setMenuOpen]=useState(false),[privacyOpen,setPrivacyOpen]=useState(false);
 const [paused,setPaused]=useState(false),[activeService,setActiveService]=useState<number|null>(0),[activeFaq,setActiveFaq]=useState<number|null>(null),[clock,setClock]=useState<{label:string;minutes:number}|null>(null);
 const menu=useRef<HTMLDialogElement>(null),privacy=useRef<HTMLDialogElement>(null),header=useRef<HTMLElement>(null),hero=useRef<HTMLElement>(null),motion=useRef<MotionEngine|null>(null);
 function startProject(service="Let's figure it out"){setInitialService(service);setMenuOpen(false);setContactOpen(true);}
 useEffect(()=>{
  const updateTime=()=>{
   const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Sarajevo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
   const hour=Number(parts.find(p=>p.type==="hour")?.value),minute=Number(parts.find(p=>p.type==="minute")?.value);
   setClock({label:`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,minutes:hour*60+minute});
  };
  // Browser-only preferences are read after hydration so server and client markup match.
  const frame=requestAnimationFrame(()=>{let saved=false;try{saved=localStorage.getItem("orifacta-motion")==="paused";}catch{}setPaused(saved||window.matchMedia("(prefers-reduced-motion: reduce)").matches);updateTime();});
  const interval=setInterval(updateTime,30000);return()=>{cancelAnimationFrame(frame);clearInterval(interval);};
 },[]);
 useEffect(()=>{document.documentElement.dataset.motion=paused?"paused":"playing";motion.current?.setPaused(paused);},[paused]);
 function toggleMotion(){setPaused(value=>{const next=!value;try{localStorage.setItem("orifacta-motion",next?"paused":"playing");}catch{}return next;});}
 useEffect(()=>{
  let gone=false;
  void import("@/lib/motion").then(({createMotion})=>{if(!gone)motion.current=createMotion(header.current,hero.current);});
  return()=>{gone=true;motion.current?.dispose();motion.current=null;};
 },[]);
 useEffect(()=>{motion.current?.lock(contactOpen||menuOpen||privacyOpen);document.documentElement.classList.toggle("menu-open",menuOpen);},[contactOpen,menuOpen,privacyOpen]);
 useEffect(()=>{const d=menu.current;if(!d)return;if(menuOpen&&!d.open)d.showModal();if(!menuOpen&&d.open)d.close();},[menuOpen]);
 useEffect(()=>{const d=privacy.current;if(!d)return;if(privacyOpen&&!d.open)d.showModal();if(!privacyOpen&&d.open)d.close();},[privacyOpen]);
 return <>
  <a className="skip-link" href="#main">Skip to content</a>
  <header ref={header} className="site-header">
   <a href="#top" className="brand-home" aria-label="ORIFACTA home"><Logo/></a>
   <nav className="desktop-nav" aria-label="Main navigation">{links.map(link=><a key={link.id} href={`#${link.id}`} style={{"--c":link.color} as CSSProperties}><span className="roll"><span>{link.name}</span><span aria-hidden="true">{link.name}</span></span></a>)}<span className="nav-indicator" aria-hidden="true"/></nav>
   <div className="header-actions"><button className="nav-contact" data-magnetic=".2" onClick={()=>startProject()}>Start a project<Chip/></button><button className="menu-toggle" onClick={()=>setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation"><Icon name="menu"/></button></div>
  </header>
  <main id="main">
   <section ref={hero} className="hero" id="top" aria-labelledby="hero-title">
    <div className="hero-field" aria-hidden="true"/>
    <h1 id="hero-title" className="hero-title"><span className="line hero-line hero-line-1"><span>Ideas made</span></span> <span className="line hero-line hero-line-2"><span>real<span className="hero-period">.</span></span></span></h1>
    <div className="hero-art"><Ribbon paused={paused}/></div>
    <div className="hero-copy"><p className="hero-description">We design and build websites, apps and software that move your business forward.</p><button className="button button-light hero-cta" data-magnetic=".22" onClick={()=>startProject()}>Let’s build what’s next<Chip/></button></div>
    <div className="hero-bottom"><p>An independent digital studio in Sarajevo</p><button className="motion-control" onClick={toggleMotion} aria-pressed={paused} aria-label={paused?"Resume animations":"Pause animations"}><Icon name={paused?"play":"pause"}/><span>{paused?"Motion paused":"Pause motion"}</span></button></div>
   </section>
   <section className="intro section-pad" id="intro" aria-labelledby="intro-title">
    <div className="intro-inner" data-scroll="read" style={{"--n":statement.length} as CSSProperties}>
     <h2 id="intro-title" className="intro-statement">{statement.map((word,i)=><Fragment key={i}><span className={`word${i>=8?" word-after":""}`} style={{"--i":i} as CSSProperties}>{word}</span>{" "}</Fragment>)}</h2>
     <div className="intro-foot reveal"><img src="/assets/brand/orifacta-symbol.svg" alt="" width="36" height="51"/><p>That’s where we come in. We connect considered design with purposeful development, bringing the right ideas to life — beautifully, and with a reason.</p></div>
    </div>
   </section>
   <section className="expertise section-pad" id="expertise" aria-labelledby="expertise-title">
    <div className="expertise-intro"><h2 id="expertise-title" className="reveal-lines"><Lines lines={["Good ideas.","Great execution."]}/></h2><p className="reveal">One connected approach. Five ways to move you forward.</p><a className="text-link reveal" href="#possibilities">See the possibilities <Icon name="down"/></a></div>
    <div className="service-list">{services.map((service,i)=><article className={`service-row${activeService===i?" active":""}`} key={service.name} style={{"--c":service.color} as CSSProperties}><h3><button onClick={()=>setActiveService(activeService===i?null:i)} aria-expanded={activeService===i} aria-controls={`service-${i}`} id={`service-button-${i}`}><span className="service-mark" aria-hidden="true"/><span className="service-name">{service.name}</span><span className="service-expand"><Icon name="plus"/></span></button></h3><div className="service-panel" id={`service-${i}`} role="region" aria-labelledby={`service-button-${i}`} inert={activeService!==i}><div><div className="service-copy"><h4>{service.line}</h4><p>{service.description}</p></div><div className="service-meta"><ul className="service-tags" aria-label={`${service.name} includes`}>{service.tags.map(tag=><li key={tag}>{tag}</li>)}</ul><button className="service-start" onClick={()=>startProject(service.form)}>Let’s talk about it<Chip/></button></div></div></div></article>)}</div>
   </section>
   <Projects onProject={startProject}/>
   <section className="process" id="approach" aria-labelledby="process-title" data-scroll="pin">
    <div className="process-pin section-pad" data-scroll="enter" data-scroll-var="--enter">
     <div className="section-heading"><h2 id="process-title" className="reveal-lines"><Lines lines={["Thought through.","Then built right."]}/></h2><p className="section-heading-note reveal">Good work comes from a clear process — and a genuinely shared direction.</p></div>
     <div className="process-steps" data-scroll="read" data-scroll-var="--draw">
      <svg className="process-ribbon" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="process-gradient" gradientUnits="userSpaceOnUse" x1="0" x2="1200" y1="0" y2="0"><stop stopColor="#ff8a1f"/><stop offset=".3" stopColor="#f2179a"/><stop offset=".62" stopColor="#6a3cf0"/><stop offset="1" stopColor="#19d3ee"/></linearGradient><mask id="process-mask" maskUnits="userSpaceOnUse" x="-100" y="-50" width="1400" height="300"><path className="process-draw" d={ribbon.line} pathLength={1} fill="none" stroke="#fff" strokeWidth="70" strokeLinecap="round"/></mask></defs><g mask="url(#process-mask)">{ribbon.faces.map((face,i)=><Fragment key={i}><path d={face.d} fill="url(#process-gradient)"/>{face.back&&<path d={face.d} fill="#1d0f45" opacity=".34"/>}</Fragment>)}</g></svg>
      <ol>{process.map((step,i)=><li className="process-step" key={step.title} style={{"--i":i} as CSSProperties}><span className="process-number" aria-hidden="true">0{i+1}</span><h3>{step.title}</h3><h4>{step.line}</h4><p>{step.body}</p></li>)}</ol>
     </div>
     <div className="process-bottom"><p>One direct line, from the first conversation to what comes next.</p><a href="#contact" aria-label="Go to contact section" data-magnetic=".3"><Icon name="down"/></a></div>
    </div>
   </section>
   <section className="studio section-pad" id="studio" aria-labelledby="studio-title">
    <div className="studio-field" aria-hidden="true"/>
    <div className="studio-head"><h2 id="studio-title" className="reveal-lines"><Lines lines={["Independent by choice.","Invested by design."]}/></h2>
     <div className="studio-clock reveal"><span className={`clock-dial${clock?" is-set":""}`} style={{"--turn":clock?clock.minutes/1440:0} as CSSProperties} aria-hidden="true"><i/></span><span className="clock-copy"><strong>{clock?.label??"Sarajevo"}</strong><small>{clock?"Local time in Sarajevo":"Bosnia and Herzegovina"}</small></span></div>
    </div>
    <p className="studio-lead reveal">We’re ORIFACTA, a digital studio based in Sarajevo. We bring design and development together to make things that feel right — and work hard for your business.</p>
    <div className="studio-principles">{principles.map((item,i)=><article className="reveal" key={item.title} style={{"--i":i} as CSSProperties}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
   </section>
   <section className="faq section-pad" aria-labelledby="faq-title">
    <div className="faq-intro"><h2 id="faq-title" className="reveal-lines"><Lines lines={["Before we begin."]}/></h2><p className="reveal">Questions people usually ask before the first call.</p></div>
    <div className="faq-list">{faqs.map((faq,i)=><article className={`faq-item${activeFaq===i?" open":""}`} key={faq.q}><h3><button onClick={()=>setActiveFaq(activeFaq===i?null:i)} aria-expanded={activeFaq===i} aria-controls={`faq-${i}`}><span>{faq.q}</span><span className="faq-toggle"><Icon name="plus"/></span></button></h3><div className="faq-answer" id={`faq-${i}`} inert={activeFaq!==i}><p>{faq.a}</p></div></article>)}</div>
   </section>
   <section className="contact-section" id="contact" aria-labelledby="cta-title" data-scroll="enter">
    <div className="contact-frame">
     <div className="contact-field" aria-hidden="true"><Field paused={paused}/></div>
     <div className="contact-inner section-pad">
      <div className="contact-main"><h2 id="cta-title" className="reveal-lines"><Lines lines={["Let’s make","it real."]}/></h2><button className="contact-arrow" data-magnetic=".32" onClick={()=>startProject()} aria-label="Start a project with ORIFACTA"><span className="contact-arrow-fill" aria-hidden="true"/><Icon/></button></div>
      <div className="contact-bottom"><p>A clear brief, a rough idea or a better way of working — it starts with a conversation.</p><button className="text-link" onClick={()=>startProject()}>Tell us about your idea <Icon/></button></div>
     </div>
    </div>
   </section>
  </main>
  <footer className="site-footer section-pad"><div className="footer-top"><a href="#top" aria-label="Back to top" className="footer-symbol"><img src="/assets/brand/orifacta-symbol.svg" alt="ORIFACTA" width="38" height="54"/></a><p>Independent thinking.<br/>Ideas made real.</p><nav aria-label="Footer navigation">{links.map(link=><a key={link.id} href={`#${link.id}`}>{link.name}</a>)}</nav><a href="#top" className="back-top">Back to top <Icon name="arrow"/></a></div><div className="footer-wordmark reveal" aria-hidden="true"><img src="/assets/brand/orifacta-wordmark.svg" alt="" width="891" height="212"/><span className="wordmark-light"/></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ORIFACTA</span><span>Sarajevo, Bosnia and Herzegovina</span><div><button onClick={()=>setPrivacyOpen(true)}>Your privacy</button><button onClick={toggleMotion} aria-pressed={paused}>{paused?"Enable motion":"Pause motion"}<span className={`motion-dot${paused?" paused":""}`}/></button></div></div></footer>
  <Contact open={contactOpen} onClose={()=>setContactOpen(false)} initialService={initialService}/>
  <dialog id="mobile-navigation" ref={menu} className="menu-dialog" aria-label="Navigation" data-lenis-prevent onCancel={e=>{e.preventDefault();setMenuOpen(false);}}><div className="menu-top"><Logo/><button className="round-button" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div><nav>{links.map((link,i)=><a key={link.id} href={`#${link.id}`} onClick={()=>setMenuOpen(false)} style={{"--i":i,"--c":link.color} as CSSProperties}><span>{link.name}</span><Icon name="right"/></a>)}</nav><button className="button button-light" onClick={()=>startProject()}>Start a project<Chip/></button><p>An independent digital studio in Sarajevo.</p></dialog>
  <dialog ref={privacy} className="privacy-dialog" aria-labelledby="privacy-heading" data-lenis-prevent onCancel={e=>{e.preventDefault();setPrivacyOpen(false);}} onClick={e=>{if(e.target===e.currentTarget)setPrivacyOpen(false);}}><button className="dialog-close round-button" onClick={()=>setPrivacyOpen(false)} aria-label="Close privacy information"><Icon name="close"/></button><h2 id="privacy-heading">Your enquiry and your privacy</h2><p>When you submit the project form, we store the name, email address, company and project information you share so we can review and discuss your enquiry. These details are stored with our hosting provider and are not shown publicly.</p><p>This website uses no marketing trackers. If you change the motion setting, that preference is saved only in your browser. The hosting platform may use cookies to provide access and security.</p><p>To request access, correction or removal of your enquiry, use the project form and include your reference number if you have it. Please avoid including sensitive information in the form.</p><button className="button button-light" onClick={()=>setPrivacyOpen(false)}>Got it<Chip name="check"/></button></dialog>
 </>;
}
