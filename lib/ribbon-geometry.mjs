// Original ORIFACTA ribbon sculpture. Shared by the live renderer and poster.
export const bands = [
  { points: [[.55,2.55,-.12],[.91,1.65,.15],[.49,.83,.38],[-.47,.14,.54],[-.64,-.57,.13],[-.07,-1.05,-.4]], width: .83, phase:.22, palette:[[.82,.015,.57],[.3,.025,.9],[.015,.27,.94],[.035,.88,.95]] },
  { points: [[.12,2.02,-.43],[-.51,1.35,-.25],[-1.30,.79,-.13],[-1.48,.14,.15],[-.98,-.57,.13]], width:.61, phase:-.45, palette:[[.36,.025,.73],[.94,.015,.51],[1,.10,.35],[1,.47,.055]] },
  { points: [[.48,-.14,-.30],[.78,-.71,.03],[.48,-1.30,.35],[-.38,-1.89,.2],[-.69,-2.56,-.02]], width:.60, phase:.45, palette:[[.88,.025,.57],[.49,.018,.85],[.045,.28,.98],[.02,.83,.93]] },
];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const scale=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>scale(a,1/(Math.hypot(...a)||1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function curve(points,t) {
  const index=Math.min(points.length-2,Math.floor(clamp(t,0,1)*(points.length-1)));
  const u=clamp(t,0,1)*(points.length-1)-index;
  const p0=points[Math.max(0,index-1)],p1=points[index],p2=points[index+1],p3=points[Math.min(points.length-1,index+2)];
  return p1.map((_,i)=>.5*((2*p1[i])+(-p0[i]+p2[i])*u+(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*u*u+(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*u*u*u));
}
// The band's cross-section frame at t: centre, the direction across the band, its normal-ish
// "forward" axis, half-width and the gentle bulge across the width.
export function frame(band,t) {
  const p=curve(band.points,t);
  // A wide central difference keeps the frame's turn continuous through the control points, so no creases.
  const tangent=norm(sub(curve(band.points,Math.min(1,t+.035)),curve(band.points,Math.max(0,t-.035))));
  const side=norm(cross(tangent,[0,0,1]));
  const forward=norm(cross(tangent,side));
  const twist=Math.sin(t*Math.PI*1.45+band.phase)*.85-.3;
  const width=band.width*Math.pow(Math.max(.0001,Math.sin(Math.PI*t)),.68);
  const dir=add(scale(side,Math.cos(twist)),scale(forward,Math.sin(twist)));
  return {p,dir,forward,width,bulge:.11*Math.sin(Math.PI*t)};
}
const at=(f,v)=>[0,1,2].map(k=>f.p[k]+f.dir[k]*v*f.width+f.forward[k]*(1-v*v)*f.bulge);
export function surface(band,t,v) {
  return at(frame(band,t),v);
}
export function ribbonColor(band,t) {
  // The authored curves start at their tips. Orient the chroma vertically.
  const value=1-t;
  const f=clamp(value,0,.999999)*(band.palette.length-1),i=Math.floor(f),a=f-i;
  return band.palette[i].map((v,k)=>v*(1-a)+band.palette[i+1][k]*a);
}
// Each band is a closed solid: the authored surface is given a lens-shaped thickness that is
// fullest along the middle, rounds over at both edges and thins out towards the tips, so the
// sculpture has body from every angle. Vertices: position, normal, colour, edge (v), 10 floats.
export const THICKNESS=.095;
export function createRibbonMesh(segments=240,across=26) {
  const rows=segments+1,cols=across+1,count=rows*cols;
  const vertices=new Float32Array(bands.length*2*count*10),indices=new Uint16Array(bands.length*2*segments*across*6);
  // Samples gather towards the edges, where the rounded rim needs them.
  const vs=Array.from({length:cols},(_,j)=>Math.sin((j/across*2-1)*Math.PI/2));
  const base=new Float32Array(count*3),normal=new Float32Array(count*3),outward=new Float32Array(count*3),half=new Float32Array(count),sheet=new Float32Array(count*3);
  let vertex=0,index=0;
  for(const band of bands) {
    for(let i=0;i<rows;i++) {
      const t=Math.max(.0001,Math.min(.9999,i/segments));
      const f=frame(band,t),fa=frame(band,Math.min(.99999,t+.0001)),fb=frame(band,Math.max(.00001,t-.0001));
      const taper=Math.pow(Math.max(.0001,Math.sin(Math.PI*t)),.7)*band.width/.83;
      for(let j=0;j<cols;j++) {
        const v=vs[j],w=1-v*v,k=i*cols+j,q=k*3;
        let dux=0,duy=0,duz=0,dvx=0,dvy=0,dvz=0;
        for(let c=0;c<3;c++){
          base[q+c]=f.p[c]+f.dir[c]*v*f.width+f.forward[c]*w*f.bulge;
          const d=(fa.p[c]+fa.dir[c]*v*fa.width+fa.forward[c]*w*fa.bulge)-(fb.p[c]+fb.dir[c]*v*fb.width+fb.forward[c]*w*fb.bulge);
          const e=f.dir[c]*f.width-f.forward[c]*2*v*f.bulge;
          if(c===0){dux=d;dvx=e;}else if(c===1){duy=d;dvy=e;}else{duz=d;dvz=e;}
        }
        let nx=duy*dvz-duz*dvy,ny=duz*dvx-dux*dvz,nz=dux*dvy-duy*dvx,l=Math.hypot(nx,ny,nz)||1;
        nx/=l;ny/=l;nz/=l;normal[q]=nx;normal[q+1]=ny;normal[q+2]=nz;
        // On the rim the solid faces outwards across the band, square to its surface.
        const sg=v<0?-1:1,cx=dvx*sg,cy=dvy*sg,cz=dvz*sg,dot_=cx*nx+cy*ny+cz*nz;
        let ox=cx-nx*dot_,oy=cy-ny*dot_,oz=cz-nz*dot_,lo=Math.hypot(ox,oy,oz)||1;
        outward[q]=ox/lo;outward[q+1]=oy/lo;outward[q+2]=oz/lo;
        half[k]=THICKNESS*taper*Math.sqrt(Math.max(0,w));
      }
    }
    for(const side of [1,-1]) {
      const start=vertex;
      for(let k=0;k<count;k++){const h=half[k]*side;sheet[k*3]=base[k*3]+normal[k*3]*h;sheet[k*3+1]=base[k*3+1]+normal[k*3+1]*h;sheet[k*3+2]=base[k*3+2]+normal[k*3+2]*h;}
      for(let i=0;i<rows;i++) {
        const color=ribbonColor(band,Math.max(.0001,Math.min(.9999,i/segments))),shade=side>0?1:.9;
        const up=Math.min(segments,i+1)*cols,down=Math.max(0,i-1)*cols;
        for(let j=0;j<cols;j++) {
          const k=i*cols+j,q=k*3,o=vertex*10;
          let nx,ny,nz;
          if(j===0||j===across){nx=outward[q];ny=outward[q+1];nz=outward[q+2];}
          else {
            const tx=sheet[(up+j)*3]-sheet[(down+j)*3],ty=sheet[(up+j)*3+1]-sheet[(down+j)*3+1],tz=sheet[(up+j)*3+2]-sheet[(down+j)*3+2];
            const wx=sheet[q+3]-sheet[q-3],wy=sheet[q+4]-sheet[q-2],wz=sheet[q+5]-sheet[q-1];
            nx=(ty*wz-tz*wy)*side;ny=(tz*wx-tx*wz)*side;nz=(tx*wy-ty*wx)*side;
            const l=Math.hypot(nx,ny,nz);
            if(l>1e-12){nx/=l;ny/=l;nz/=l;}else{nx=normal[q]*side;ny=normal[q+1]*side;nz=normal[q+2]*side;}
          }
          vertices[o]=sheet[q];vertices[o+1]=sheet[q+1];vertices[o+2]=sheet[q+2];
          vertices[o+3]=nx;vertices[o+4]=ny;vertices[o+5]=nz;
          vertices[o+6]=color[0]*shade;vertices[o+7]=color[1]*shade;vertices[o+8]=color[2]*shade;vertices[o+9]=vs[j];
          vertex++;
        }
      }
      for(let i=0;i<segments;i++) for(let j=0;j<across;j++) {
        const a=start+i*cols+j,b=a+cols;
        // Wind both sheets so their outside faces the camera when visible; the renderer culls the rest.
        if(side>0){indices[index]=a;indices[index+1]=b;indices[index+2]=a+1;indices[index+3]=b;indices[index+4]=b+1;indices[index+5]=a+1;}
        else{indices[index]=a;indices[index+1]=a+1;indices[index+2]=b;indices[index+3]=b;indices[index+4]=a+1;indices[index+5]=b+1;}
        index+=6;
      }
    }
  }
  return {vertices,indices};
}
export function rotate(p,ay=.25,az=-.20,ax=-.08) {
  const cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az),cx=Math.cos(ax),sx=Math.sin(ax);
  const q=[cy*p[0]+sy*p[2],p[1],-sy*p[0]+cy*p[2]];
  const r=[q[0],cx*q[1]-sx*q[2],sx*q[1]+cx*q[2]];
  return [cz*r[0]-sz*r[1],sz*r[0]+cz*r[1],r[2]];
}
