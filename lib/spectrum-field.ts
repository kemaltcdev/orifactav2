// A slow, living version of the supplied ORIFACTA colour field. Rendered at reduced resolution:
// the field is soft by nature, so the GPU cost stays small. Fragment-only, no textures.
const vertex = `#version 300 es
in vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
out vec4 outColor;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
vec3 spectrum(float t){
  vec3 c0=vec3(1.,.50,.10),c1=vec3(.96,.07,.56),c2=vec3(.38,.10,.92),c3=vec3(.06,.22,.98),c4=vec3(.05,.85,.96);
  float s=clamp(t,0.,1.)*4.;
  if(s<1.)return mix(c0,c1,smoothstep(0.,1.,s));
  if(s<2.)return mix(c1,c2,smoothstep(0.,1.,s-1.));
  if(s<3.)return mix(c2,c3,smoothstep(0.,1.,s-2.));
  return mix(c3,c4,smoothstep(0.,1.,s-3.));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  vec2 p=uv*vec2(uResolution.x/uResolution.y,1.);
  float t=uTime*.045;
  vec2 q=vec2(fbm(p*.55+vec2(t,-t*.6)),fbm(p*.55+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p*.5+q*1.4+vec2(1.7,9.2)+t*.8),fbm(p*.5+q*1.4+vec2(8.3,2.8)-t*.7));
  float f=fbm(p*.45+r*1.2);
  // Warm on the left, cool on the right, as in the supplied field, but the boundary breathes.
  float pos=uv.x*1.05-.06+(r.x-.5)*.75+(uv.y-.5)*.22+uPointer.x*.04;
  vec3 col=spectrum(pos);
  // A deep indigo pool keeps large type legible.
  float pool=smoothstep(.32,.78,f+uPointer.y*.03)*smoothstep(.02,.45,uv.x)*smoothstep(1.05,.55,uv.x);
  col=mix(col,vec3(.07,.03,.36),pool*.82);
  // Thin bands of light, like the creases in the brand image.
  float crease=abs(sin((r.y*1.8+uv.y*1.2+uv.x*.5)*3.14159));
  col+=mix(spectrum(pos+.22),vec3(1.),.2)*pow(1.-crease,9.)*.22;
  col*=mix(.62,1.,smoothstep(1.15,.25,distance(uv,vec2(.45,.55))));
  outColor=vec4(pow(col,vec3(.95)),1.);
}`;

export function createSpectrumField(canvas: HTMLCanvasElement, onReady:()=>void) {
  const gl=canvas.getContext("webgl2",{alpha:false,antialias:false,powerPreference:"low-power"});
  if(!gl) return null;
  const compile=(type:number,source:string)=>{
    const shader=gl.createShader(type);
    if(!shader)throw new Error("Shader unavailable");
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error("Field shader failed");}
    return shader;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  const program=gl.createProgram();
  if(!program)throw new Error("Renderer unavailable");
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Field program failed");
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,"aPosition");
  gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  gl.useProgram(program);
  const uniforms={resolution:gl.getUniformLocation(program,"uResolution"),time:gl.getUniformLocation(program,"uTime"),pointer:gl.getUniformLocation(program,"uPointer")};
  let frame=0,disposed=false,visible=false,paused=false,ready=false,last=0;
  // Start somewhere other than zero so the first frame already looks composed.
  let clock=37,px=0,py=0,tx=0,ty=0;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced=()=>motion.matches;
  const resolution=.5;
  const size=()=>{
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2)*resolution;
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  };
  const render=(now:number)=>{
    frame=0;if(disposed)return;
    const dt=last?Math.min((now-last)/1000,.05):.016;last=now;
    const animate=!paused&&!reduced();
    if(animate)clock+=dt;
    const ease=1-Math.exp(-dt*2);px+=(tx-px)*ease;py+=(ty-py)*ease;
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
    gl.uniform1f(uniforms.time,clock);
    gl.uniform2f(uniforms.pointer,px,py);
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(!ready){ready=true;onReady();}
    if(visible&&!document.hidden&&animate)frame=requestAnimationFrame(render);
  };
  const start=()=>{if(!frame&&!disposed&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(render);}};
  const onPointer=(event:PointerEvent)=>{const r=canvas.getBoundingClientRect();tx=(event.clientX-r.left)/r.width*2-1;ty=(event.clientY-r.top)/r.height*2-1;};
  const resize=new ResizeObserver(()=>{size();if(!frame)render(performance.now());});resize.observe(canvas);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:"120px"});observer.observe(canvas);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();};
  const host=canvas.parentElement?.parentElement??canvas;
  host.addEventListener("pointermove",onPointer);
  document.addEventListener("visibilitychange",visibility);
  size();
  return {
    pause(value:boolean){paused=value;cancelAnimationFrame(frame);frame=0;if(visible)render(performance.now());start();},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();host.removeEventListener("pointermove",onPointer);document.removeEventListener("visibilitychange",visibility);gl.deleteBuffer(vb);gl.deleteVertexArray(vao);gl.deleteProgram(program);},
  };
}
