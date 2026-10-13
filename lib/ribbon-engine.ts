import { createRibbonMesh } from "./ribbon-geometry.mjs";

const vertex = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;
in float aEdge;
uniform float uTime;
uniform float uAspect;
uniform float uBreath;
uniform vec3 uRotation;
out vec3 vNormal;
out vec3 vColor;
out vec3 vPosition;
out float vEdge;
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void main(){
  mat3 r=rotZ(uRotation.z)*rotX(uRotation.x)*rotY(uRotation.y);
  vec3 p=aPosition;
  p.x+=sin(p.y*1.4+uTime*.38)*.038*uBreath;
  p.z+=cos(p.y*1.2-uTime*.31)*.045*uBreath;
  p=r*p;
  vNormal=r*aNormal;
  vPosition=p;
  vColor=aColor;
  vEdge=aEdge;
  gl_Position=vec4(p.x/(3.05*uAspect),p.y/3.05,-p.z*.15,1.);
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vColor;
in vec3 vPosition;
in float vEdge;
out vec4 outColor;
// Soft studio reflections for the satin finish: an overhead softbox, a key strip and a cool side light.
vec3 studio(vec3 r){
  vec3 c=vec3(.04,.035,.1);
  c+=vec3(.78,.84,1.)*smoothstep(.3,.97,r.y)*.6;
  c+=vec3(1.,.95,.92)*smoothstep(.86,.99,dot(r,normalize(vec3(-.6,.55,.6))))*1.1;
  c+=vec3(.5,.72,1.)*smoothstep(.85,.99,dot(r,normalize(vec3(.95,.1,.3))))*.8;
  return c;
}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec3 N=normalize(vNormal);
  if(!gl_FrontFacing)N=-N;
  vec3 V=vec3(0.,0.,1.);
  vec3 L=normalize(vec3(-.8,1.2,1.6));
  vec3 H=normalize(L+V);
  float nv=max(dot(N,V),0.);
  float diffuse=max(dot(N,L),0.);
  float satin=pow(max(dot(N,H),0.),34.);
  float sheen=pow(max(dot(N,H),0.),7.);
  float rim=pow(1.-abs(dot(N,V)),2.7);
  float edge=pow(abs(vEdge),20.);
  // A cool fill from the lower right keeps the turned-away faces in full colour.
  float fill=max(dot(N,normalize(vec3(.9,-.35,.45))),0.);
  vec3 col=vColor*(.5+.57*diffuse+.2*fill);
  col+=vec3(.75,.81,.93)*satin*.56;
  col+=mix(vColor,vec3(.8,.85,1.),.5)*sheen*.08;
  col+=vec3(.45,.6,1.)*rim*.20;
  col+=vec3(.44,.55,.70)*edge*.105;
  // A light clearcoat: the studio shows only towards grazing angles.
  float fresnel=.04+.96*pow(1.-nv,5.);
  col+=studio(reflect(-V,N))*fresnel*.35;
  col*=1.-.07*(sin(vPosition.y*2.1)+1.);
  col=pow(max(col,vec3(0.)),vec3(.86));
  col+=(hash(gl_FragCoord.xy)-.5)/255.;
  outColor=vec4(col,1.);
}`;

type View={yaw:number;pitch:number;roll:number};
const TURN=Math.PI*2;

export function createRibbon(canvas: HTMLCanvasElement, onReady:()=>void, view?:View) {
  const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"high-performance"});
  if(!gl) return null;
  const compile=(type:number,source:string)=>{
    const shader=gl.createShader(type);
    if(!shader)throw new Error("Shader unavailable");
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error("Ribbon shader failed");}
    return shader;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  const program=gl.createProgram();
  if(!program)throw new Error("Renderer unavailable");
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Ribbon program failed");
  const {vertices,indices}=createRibbonMesh();
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  [["aPosition",3,0],["aNormal",3,12],["aColor",3,24],["aEdge",1,36]].forEach(([name,size,offset])=>{
    const location=gl.getAttribLocation(program,name as string);
    gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size as number,gl.FLOAT,false,40,offset as number);
  });
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  // The bands are closed solids, so only their outside is drawn.
  gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  gl.clearColor(0,0,0,0);
  const uniforms={time:gl.getUniformLocation(program,"uTime"),aspect:gl.getUniformLocation(program,"uAspect"),rotation:gl.getUniformLocation(program,"uRotation"),breath:gl.getUniformLocation(program,"uBreath")};
  let frame=0,disposed=false,visible=true,paused=false,clock=0,last=0,ready=false;
  let px=0,py=0,targetX=0,targetY=0,progress=0;
  // Turned by hand it keeps its momentum, then settles facing forward again.
  let spin=0,spinVelocity=0,dragging=false,dragX=0,dragTime=0;
  let dpr=Math.min(2,Math.max(1.5,window.devicePixelRatio||1)),slowFrames=0;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection=(navigator as Navigator & {connection?: {saveData?:boolean}}).connection;
  const reduced=()=>motion.matches||!!connection?.saveData;
  const size=()=>{
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  };
  const settled=()=>!dragging&&Math.abs(spinVelocity)<.002&&Math.abs(spin-Math.round(spin/TURN)*TURN)<.002&&Math.abs(targetX-px)<.002&&Math.abs(targetY-py)<.002;
  const render=(now:number)=>{
    frame=0;if(disposed)return;
    const dt=last?Math.min((now-last)/1000,.05):.016;last=now;
    const animate=!view&&!paused&&!reduced();
    if(animate)clock+=dt;
    const ease=1-Math.exp(-dt*4.5);
    px+=(targetX-px)*ease;py+=(targetY-py)*ease;
    if(!dragging){
      spin+=spinVelocity*dt;
      const rest=Math.round(spin/TURN)*TURN,pull=Math.abs(spinVelocity)<2.4?1:0;
      spinVelocity+=((rest-spin)*16*pull-spinVelocity*(pull?6.5:1.8))*dt;
    }
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);gl.bindVertexArray(vao);
    gl.uniform1f(uniforms.time,clock);
    gl.uniform1f(uniforms.breath,view?0:1);
    gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);
    if(view)gl.uniform3f(uniforms.rotation,view.pitch,view.yaw,view.roll);
    else gl.uniform3f(uniforms.rotation,-.08+py*.13,.25+px*.25+spin+(animate?Math.sin(clock*.28)*.10:0),-.20+(animate?Math.sin(clock*.2)*.045:0)+progress*.16);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    if(!ready){ready=true;onReady();}
    if(dt>.03&&animate){slowFrames++;if(slowFrames>90&&dpr>1){dpr=Math.max(1,dpr-.25);size();slowFrames=0;}}
    if(visible&&!document.hidden&&(animate||!settled()))frame=requestAnimationFrame(render);
  };
  const start=()=>{if(!frame&&!disposed&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(render);}};
  const interactive=()=>!view&&!paused&&!reduced();
  const onPointer=(event:PointerEvent)=>{
    if(!interactive())return;
    const r=canvas.getBoundingClientRect();
    if(event.pointerType==="mouse"){targetX=(event.clientX-r.left)/r.width*2-1;targetY=(event.clientY-r.top)/r.height*2-1;}
    if(dragging){
      const now=performance.now(),delta=(event.clientX-dragX)/r.width*2.6;
      spin+=delta;spinVelocity=Math.max(-9,Math.min(9,delta/Math.max(.016,(now-dragTime)/1000)*.6+spinVelocity*.4));
      dragX=event.clientX;dragTime=now;
    }
    start();
  };
  const onDown=(event:PointerEvent)=>{if(!interactive()||(event.pointerType==="mouse"&&event.button!==0))return;dragging=true;dragX=event.clientX;dragTime=performance.now();spinVelocity=0;canvas.setPointerCapture(event.pointerId);start();};
  const onUp=(event:PointerEvent)=>{if(!dragging)return;dragging=false;if(performance.now()-dragTime>90)spinVelocity=0;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);start();};
  const onLeave=()=>{targetX=0;targetY=0;start();};
  const resize=new ResizeObserver(()=>{size();if(!frame)render(performance.now());});resize.observe(canvas);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:"80px"});observer.observe(canvas);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();};
  const onMotion=()=>{cancelAnimationFrame(frame);frame=0;start();};
  const onScroll=()=>{if(!reduced()&&!view){progress=Math.min(1,window.scrollY/window.innerHeight);start();}};
  canvas.addEventListener("pointermove",onPointer);canvas.addEventListener("pointerdown",onDown);canvas.addEventListener("pointerup",onUp);canvas.addEventListener("pointercancel",onUp);canvas.addEventListener("pointerleave",onLeave);
  document.addEventListener("visibilitychange",visibility);motion.addEventListener("change",onMotion);window.addEventListener("scroll",onScroll,{passive:true});
  size();render(performance.now());
  return {
    pause(value:boolean){paused=value;if(value){dragging=false;targetX=0;targetY=0;}cancelAnimationFrame(frame);frame=0;render(performance.now());},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();document.removeEventListener("visibilitychange",visibility);motion.removeEventListener("change",onMotion);window.removeEventListener("scroll",onScroll);canvas.removeEventListener("pointermove",onPointer);canvas.removeEventListener("pointerdown",onDown);canvas.removeEventListener("pointerup",onUp);canvas.removeEventListener("pointercancel",onUp);canvas.removeEventListener("pointerleave",onLeave);gl.deleteBuffer(vb);gl.deleteBuffer(ib);gl.deleteVertexArray(vao);gl.deleteProgram(program);},
  };
}
