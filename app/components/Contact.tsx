"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {budgetOptions,inquirySchema,serviceOptions} from "@/lib/inquiry";
import {Icon} from "./Icon";

export default function Contact({open,onClose,initialService}:{open:boolean;onClose:()=>void;initialService:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [service,setService]=useState(initialService||serviceOptions[0]);
 const [status,setStatus]=useState<"idle"|"sending"|"success">("idle");
 const [error,setError]=useState("");
 const [reference,setReference]=useState("");
 // Preselect the service each time the dialog opens (adjusting state during render, not in an effect).
 const [openedWith,setOpenedWith]=useState<string|null>(null),opening=open?initialService:null;
 if(opening!==openedWith){setOpenedWith(opening);if(opening!==null)setService(opening||serviceOptions[0]);}
 useEffect(()=>{
  const element=dialog.current;if(!element)return;
  if(open){element.showModal();const overflow=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{element.close();document.body.style.overflow=overflow;};}
 },[open]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(status==="sending")return;
  const data=new FormData(event.currentTarget);
  const payload={name:data.get("name"),email:data.get("email"),company:data.get("company"),service,budget:data.get("budget"),message:data.get("message"),consent:data.get("consent")==="on",website:data.get("website")||""};
  const parsed=inquirySchema.safeParse(payload);
  if(!parsed.success){setError(parsed.error.issues[0].message);return;}
  setError("");setStatus("sending");
  const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),20000);
  try{
   const response=await fetch("/api/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed.data),signal:abort.signal});
   const result=await response.json() as {ok?:boolean;error?:string;reference?:string};
   if(!response.ok||!result.ok)throw new Error(result.error||"We couldn't save your enquiry. Please try again.");
   setReference(result.reference||"");setStatus("success");
  }catch(caught){setStatus("idle");setError(caught instanceof Error&&caught.name==="AbortError"?"The connection timed out. Your message is still here — please try again.":caught instanceof Error?caught.message:"Please try again.");}
  finally{clearTimeout(timeout);}
 }
 return <dialog ref={dialog} className="contact-dialog" aria-labelledby="contact-heading" data-lenis-prevent onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="contact-dialog-inner">
   <button className="dialog-close round-button" onClick={onClose} aria-label="Close project enquiry"><Icon name="close"/></button>
   {status==="success"?<div className="contact-success" role="status">
    <span className="success-symbol"><Icon name="check"/></span><h2 id="contact-heading">An idea.<br/>A first step.</h2><p>Your enquiry has been received. Thank you for sharing what you have in mind.</p><p className="reference">Your reference <b>{reference}</b></p><button className="button button-light" onClick={onClose}>Back to exploring<span className="chip" aria-hidden="true"><Icon name="right"/><Icon name="right"/></span></button>
   </div>:<>
    <h2 id="contact-heading">It starts with<br/>a conversation.</h2><p className="contact-intro">A clear brief or a rough idea. We’d love to hear it.</p>
    <form onSubmit={submit}>
     <fieldset disabled={status==="sending"}>
      <legend className="field-label">What are you thinking about?</legend>
      <div className="service-choices">{serviceOptions.map(option=><label key={option} className={service===option?"choice active":"choice"}><input type="radio" name="service" value={option} checked={service===option} onChange={()=>setService(option)}/><span>{option}</span></label>)}</div>
      <div className="form-grid"><label>Your name <span>*</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Alex Morgan"/></label><label>Your email <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="alex@company.com"/></label></div>
      <div className="form-grid"><label>Company <span className="optional">optional</span><input name="company" autoComplete="organization" maxLength={140} placeholder="Your company"/></label><label>Budget range<select name="budget" defaultValue={budgetOptions[0]}>{budgetOptions.map(option=><option key={option}>{option}</option>)}</select></label></div>
      <label className="message-label">Tell us about your idea <span>*</span><textarea name="message" required minLength={20} maxLength={5000} rows={4} placeholder="What would you like to build, improve or simplify?"/></label>
      <div className="honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className="consent"><input type="checkbox" name="consent" required/><span>I agree that ORIFACTA can store these details and contact me about this project.</span></label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="button button-light form-submit" type="submit">{status==="sending"?"Sending your enquiry…":"Send project enquiry"}<span className="chip" aria-hidden="true"><Icon name={status==="sending"?"plus":"arrow"} className={status==="sending"?"spin":""}/>{status!=="sending"&&<Icon name="arrow"/>}</span></button>
      <p className="form-note">Your details stay private. No mailing lists, no automated sales sequences.</p>
     </fieldset>
    </form>
   </>}
  </div>
 </dialog>;
}
