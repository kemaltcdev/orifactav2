import type {CSSProperties} from "react";
export function Icon({name="arrow",className="",style}:{name?:string;className?:string;style?:CSSProperties}){
 const paths:Record<string,React.ReactNode>={
  arrow:<><path d="M5 19 19 5M5 5h14v14"/></>,
  right:<><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  down:<><path d="M12 4v16m-6-6 6 6 6-6"/></>,
  plus:<><path d="M12 5v14M5 12h14"/></>,
  minus:<path d="M5 12h14"/>,
  check:<path d="m5 12 4 4L19 6"/>,
  close:<path d="m6 6 12 12M6 18 18 6"/>,
  pause:<><path d="M8 5v14M16 5v14"/></>,
  play:<path d="m8 5 11 7-11 7Z"/>,
  menu:<path d="M4 8h16M4 16h16"/>,
  box:<><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/></>,
  grid:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
  search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
  bag:<><path d="M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2"/></>,
  leaf:<><path d="M5 19c0-11 6-13 15-15 0 9-4 15-11 15m-5 2L16 9"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`icon ${className}`} style={style} aria-hidden="true">{paths[name]||paths.arrow}</svg>;
}
