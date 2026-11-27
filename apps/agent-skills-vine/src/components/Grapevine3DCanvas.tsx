import React, {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {Branch,BranchKey,Skill} from '../types/skills';

interface Props {
  skills:Skill[]; branches:Record<BranchKey,Branch>; selectedSkill:Skill|null; basket:Skill[];
  activeBranchFilter:BranchKey|null; activeSkillNames:Set<string>; nearModeSkill:Skill|null; isNearModeActive:boolean; isCloseUp:boolean;
  onSelectSkill:(skill:Skill)=>void; cameraYaw:number; cameraPitch:number; cameraZoom:number;
  onCameraChange:(yaw:number,pitch:number,zoom:number)=>void;
}
interface Label {skillId:string;skillName:string;categoryName:string;color:string;statusLabel:string;isHarvested:boolean;isSelected:boolean;x:number;y:number;visible:boolean}
interface Node {mesh:THREE.Group;skill:Skill;world:THREE.Vector3}

export const Grapevine3DCanvas:React.FC<Props>=({skills,branches,selectedSkill,basket,activeBranchFilter,activeSkillNames,isCloseUp,onSelectSkill,cameraYaw,cameraPitch,onCameraChange})=>{
 const canvasMount=useRef<HTMLDivElement|null>(null),drag=useRef(false),last=useRef({x:0,y:0}),down=useRef({x:0,y:0});
 const target=useRef({yaw:cameraYaw*Math.PI/180,pitch:cameraPitch*Math.PI/180}),current=useRef({yaw:0,pitch:0});
 const zoom=useRef(isCloseUp?14:23),zoomNow=useRef(isCloseUp?14:23),cameraRef=useRef<THREE.PerspectiveCamera|null>(null),nodes=useRef<Node[]>([]);
 const [labels,setLabels]=useState<Label[]>([]);

 useEffect(()=>{target.current={yaw:cameraYaw*Math.PI/180,pitch:cameraPitch*Math.PI/180}},[cameraYaw,cameraPitch]);
 useEffect(()=>{zoom.current=isCloseUp?14:23},[isCloseUp]);

 useEffect(()=>{
  const host=canvasMount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);
  const camera=new THREE.PerspectiveCamera(36,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,.25,zoomNow.current);cameraRef.current=camera;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;host.replaceChildren(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x1a2b3c,1.15));
  for(const [color,pos,intensity] of [[0x38edf8,[14,18,16],3.2],[0xff007f,[-16,14,12],2.8],[0xa855f7,[-10,16,-14],3],[0x74ee15,[12,-4,-10],2.2]] as const){const l=new THREE.DirectionalLight(color,intensity);l.position.set(pos[0],pos[1],pos[2]);scene.add(l)}
  const floorPurple=new THREE.PointLight(0xa855f7,3.5,18);floorPurple.position.set(0,-4.2,0);scene.add(floorPurple);
  const floorCyan=new THREE.PointLight(0x38edf8,2.8,18);floorCyan.position.set(1.2,-4.2,1.2);scene.add(floorCyan);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshStandardMaterial({color:0x010305,roughness:.18,metalness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-4.5;scene.add(ground);
  const bloom=new THREE.Mesh(new THREE.RingGeometry(.5,5.8,64),new THREE.MeshBasicMaterial({color:0x7c3aed,transparent:true,opacity:.22,side:THREE.DoubleSide}));bloom.rotation.x=-Math.PI/2;bloom.position.y=-4.48;scene.add(bloom);

  const tree=new THREE.Group();scene.add(tree);
  const crystal=new THREE.MeshPhysicalMaterial({color:0xf0faff,emissive:0x162c3b,emissiveIntensity:.25,roughness:.03,metalness:.04,transmission:.94,transparent:true,opacity:.92,ior:1.54,thickness:1.6,reflectivity:.95,clearcoat:1,clearcoatRoughness:.02});
  [0,1.05,2.09,3.14,4.19,5.24].forEach(a=>{const c=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.9,-3.2,Math.sin(a)*.9),new THREE.Vector3(Math.cos(a)*1.6,-3.8,Math.sin(a)*1.6),new THREE.Vector3(Math.cos(a)*2.3,-4.35,Math.sin(a)*2.3),new THREE.Vector3(Math.cos(a)*2.6,-4.48,Math.sin(a)*2.6)]);tree.add(new THREE.Mesh(new THREE.TubeGeometry(c,20,.42,24),crystal));});
  const flare=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.9,.8,28),crystal);flare.position.y=-3.8;tree.add(flare);
  const trunk=[[-3.4,1.25,1.05,0,0],[-2.1,1.05,.88,-.22,.14],[-.8,.88,.76,.16,-.16],[.5,.76,.68,-.12,.1],[1.8,.68,.58,.05,0]] as const;
  for(let i=0;i<trunk.length-1;i++){const a=trunk[i],b=trunk[i+1],h=b[0]-a[0],m=new THREE.Mesh(new THREE.CylinderGeometry(b[2],a[1],h,28,2),crystal);m.position.set((a[3]+b[3])/2,a[0]+h/2,(a[4]+b[4])/2);m.rotation.y=.1+i*.3;tree.add(m)}
  const coreMat=new THREE.MeshBasicMaterial({color:0x38edf8,transparent:true,opacity:.85,blending:THREE.AdditiveBlending});const core=new THREE.Mesh(new THREE.CylinderGeometry(.26,.38,5.2,20),coreMat);core.position.y=-.8;tree.add(core);

  const branchKeys=Object.keys(branches) as BranchKey[],branchGroups=new Map<BranchKey,THREE.Group>(),branchAnchors=new Map<BranchKey,THREE.Vector3>(),nodeList:Node[]=[];
  branchKeys.forEach((key,bi)=>{const branch=branches[key],g=new THREE.Group();branchGroups.set(key,g);tree.add(g);const a=(bi/branchKeys.length)*Math.PI*2-.6;const end=new THREE.Vector3(Math.cos(a)*6.2,2+Math.cos(bi*.8)*.75,Math.sin(a)*6.2);branchAnchors.set(key,end.clone().add(new THREE.Vector3(0,.55,0)));const c=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.6,0),new THREE.Vector3(Math.cos(a)*2.8,1.25+Math.sin(bi*.7)*.5,Math.sin(a)*2.8),end]);g.add(new THREE.Mesh(new THREE.TubeGeometry(c,30,.15,14),crystal));g.add(new THREE.Mesh(new THREE.TubeGeometry(c,30,.035,8),new THREE.MeshBasicMaterial({color:new THREE.Color(branch.color),transparent:true,opacity:.8,blending:THREE.AdditiveBlending})));});

  const grouped=new Map<BranchKey,Skill[]>();for(const s of skills){const arr=grouped.get(s.branchKey)||[];arr.push(s);grouped.set(s.branchKey,arr)}
  for(const key of branchKeys){const list=grouped.get(key)||[],bi=branchKeys.indexOf(key),base=(bi/branchKeys.length)*Math.PI*2-.6,group=branchGroups.get(key)!;for(let i=0;i<list.length;i++){const skill=list[i],t=(i+1)/(list.length+1),gold=i*2.3999632297,rad=1.7+t*4.9,ang=base+Math.sin(gold)*.31,y=-2.1+t*5.2+Math.cos(gold)*.42,pos=new THREE.Vector3(Math.cos(ang)*rad+Math.cos(gold)*.5,y,Math.sin(ang)*rad+Math.sin(gold)*.5),start=pos.clone().multiplyScalar(.78);start.y=(start.y+pos.y)/2;group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start,pos.clone().lerp(start,.35),pos]),5,.022,6),new THREE.MeshBasicMaterial({color:new THREE.Color(branches[key].color),transparent:true,opacity:.38})));
    const cluster=new THREE.Group(),color=new THREE.Color(branches[key].color);
    // One canonical skill = one grape. Keep the visible geometry a single closed sphere so
    // lighting/transmission cannot turn the skill into a hollow ring or broken mini-cluster.
    const grapeRadius=skills.length>120?.14:.18;
    const grape=new THREE.Mesh(
      new THREE.SphereGeometry(grapeRadius,18,14),
      new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.34,roughness:.22,metalness:.08})
    );
    grape.userData.skillId=skill.id;
    cluster.add(grape);
    const collider=new THREE.Mesh(new THREE.SphereGeometry(skills.length>120?.235:.32,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    collider.userData.skillId=skill.id;cluster.add(collider);cluster.position.copy(pos);group.add(cluster);nodeList.push({mesh:cluster,skill,world:pos});
  }}
  // Create true 3D billboards at fixed branch stations. These are scene objects,
  // not screen-space overlays, so they remain attached to their category section as the tree moves.
  const billboardTextures:THREE.Texture[]=[];
  const billboardMaterials:THREE.SpriteMaterial[]=[];
  const billboardSprites=new Map<BranchKey,THREE.Sprite>();
  const makeBillboardTexture=(key:BranchKey,count:number)=>{
    const branch=branches[key],canvas=document.createElement('canvas');
    canvas.width=1400;canvas.height=280;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('GRAPEVINE_BILLBOARD_CANVAS_UNAVAILABLE');
    const hex=branch.color;
    const roundRect=(x:number,y:number,w:number,h:number,r:number)=>{
      ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.closePath();
    };
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(0,0,0,0.90)';roundRect(6,6,1388,268,34);ctx.fill();
    ctx.lineWidth=8;ctx.strokeStyle=hex;roundRect(8,8,1384,264,32);ctx.stroke();

    ctx.fillStyle=hex;ctx.beginPath();ctx.arc(64,76,18,0,Math.PI*2);ctx.fill();
    ctx.shadowColor=hex;ctx.shadowBlur=28;ctx.beginPath();ctx.arc(64,76,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

    ctx.textBaseline='middle';
    ctx.textAlign='left';
    ctx.font='800 70px "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle=hex;ctx.fillText(branch.title.toUpperCase(),104,76);

    ctx.font='600 38px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillStyle='rgba(245,250,252,0.96)';
    ctx.fillText(branch.subtitle,52,154);

    ctx.font='700 27px "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle='rgba(190,205,214,0.92)';
    ctx.fillText(`${branch.badge}  •  ${count} GRAPES`,52,222);

    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.needsUpdate=true;
    billboardTextures.push(texture);
    return texture;
  };

  for(const key of branchKeys){
    const members=nodeList.filter(n=>n.skill.branchKey===key);
    if(!members.length)continue;
    const center=new THREE.Vector3();let top=-Infinity;
    for(const member of members){center.add(member.world);top=Math.max(top,member.world.y)}
    center.divideScalar(members.length);
    center.y=top+.66;
    branchAnchors.set(key,center);

    const material=new THREE.SpriteMaterial({
      map:makeBillboardTexture(key,members.length),
      transparent:true,
      depthTest:false,
      depthWrite:false
    });
    billboardMaterials.push(material);
    const sprite=new THREE.Sprite(material);
    sprite.center.set(.5,0);
    sprite.position.copy(center);
    sprite.scale.set(4.9,.98,1);
    sprite.renderOrder=80;
    sprite.userData={kind:'branch-billboard',branchKey:key};
    tree.add(sprite);
    billboardSprites.set(key,sprite);
  }
  nodes.current=nodeList;

  const onResize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};window.addEventListener('resize',onResize);
  let raf=0,frame=0;const clock=new THREE.Clock();
  const animate=()=>{raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();current.current.yaw+=(target.current.yaw-current.current.yaw)*.08;current.current.pitch+=(target.current.pitch-current.current.pitch)*.08;tree.rotation.y=current.current.yaw;tree.rotation.x=current.current.pitch;zoomNow.current+=(zoom.current-zoomNow.current)*.08;camera.position.z=zoomNow.current;coreMat.opacity=.64+Math.sin(t*2.4)*.2;floorPurple.intensity=3.1+Math.sin(t*.7)*.8;floorCyan.intensity=2.5+Math.sin(t*.9+1)*.6;
    nodeList.forEach((n,i)=>{const hi=basket.some(b=>b.id===n.skill.id)||selectedSkill?.id===n.skill.id,s=hi?1.35+Math.sin(t*3+i)*.08:1+Math.sin(t*2+i*.17)*.05;n.mesh.scale.setScalar(s);n.mesh.visible=!activeBranchFilter||n.skill.branchKey===activeBranchFilter;const inUse=activeSkillNames.has(n.skill.name)||activeSkillNames.has(n.skill.id),glow=inUse?.25+.75*(.5+.5*Math.sin(t*9+i)):.34;n.mesh.traverse(o=>{const m=o as THREE.Mesh,material=m.material as THREE.MeshStandardMaterial|undefined;if(material&&typeof material.emissiveIntensity==='number')material.emissiveIntensity=glow})});
    renderer.render(scene,camera);
    if(++frame%4===0){
      tree.updateMatrixWorld(true);
      const limited=skills.length>120
        ? nodeList.filter(n=>selectedSkill?.id===n.skill.id||basket.some(b=>b.id===n.skill.id)||(activeBranchFilter&&n.skill.branchKey===activeBranchFilter)).slice(0,80)
        : nodeList;
      setLabels(limited.map(n=>{
        const p=n.world.clone().applyMatrix4(tree.matrixWorld).project(camera),visible=p.z>-1&&p.z<1;
        return{skillId:n.skill.id,skillName:n.skill.name,categoryName:branches[n.skill.branchKey].title,color:branches[n.skill.branchKey].color,statusLabel:n.skill.registryState==='CANONICAL_DISCOVERED'?'CANONICAL':n.skill.registryState,isHarvested:basket.some(b=>b.id===n.skill.id),isSelected:selectedSkill?.id===n.skill.id,x:Math.max(70,Math.min(host.clientWidth-70,(p.x*.5+.5)*host.clientWidth)),y:Math.max(72,Math.min(host.clientHeight-110,(-p.y*.5+.5)*host.clientHeight)),visible};
      }));
      billboardSprites.forEach((sprite,key)=>{sprite.visible=!activeBranchFilter||activeBranchFilter===key});
    }
  };animate();
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);billboardTextures.forEach(t=>t.dispose());billboardMaterials.forEach(m=>m.dispose());renderer.dispose();host.replaceChildren()};
 },[skills,branches,basket,selectedSkill,activeBranchFilter,activeSkillNames]);

 const rayPick=(e:React.PointerEvent<HTMLDivElement>)=>{const host=canvasMount.current,camera=cameraRef.current;if(!host||!camera)return null;const rect=host.getBoundingClientRect(),mouse=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const colliders=nodes.current.map(n=>n.mesh.children[n.mesh.children.length-1]);const hit=ray.intersectObjects(colliders,false)[0];return hit?nodes.current.find(n=>n.skill.id===(hit.object as THREE.Mesh).userData.skillId)?.skill:null};
 const downFn=(e:React.PointerEvent<HTMLDivElement>)=>{drag.current=true;last.current=down.current={x:e.clientX,y:e.clientY};(e.target as HTMLElement).setPointerCapture(e.pointerId)};
 const moveFn=(e:React.PointerEvent<HTMLDivElement>)=>{if(drag.current){const dx=e.clientX-last.current.x,dy=e.clientY-last.current.y;last.current={x:e.clientX,y:e.clientY};target.current.yaw+=dx*.008;target.current.pitch=Math.max(-.9,Math.min(.9,target.current.pitch+dy*.006));onCameraChange(target.current.yaw*180/Math.PI,target.current.pitch*180/Math.PI,zoom.current)}else e.currentTarget.style.cursor=rayPick(e)?'pointer':'grab'};
 const upFn=(e:React.PointerEvent<HTMLDivElement>)=>{drag.current=false;try{(e.target as HTMLElement).releasePointerCapture(e.pointerId)}catch{};if(Math.hypot(e.clientX-down.current.x,e.clientY-down.current.y)<6){const skill=rayPick(e);if(skill)onSelectSkill(skill)}};
 const wheelFn=(e:React.WheelEvent<HTMLDivElement>)=>{e.preventDefault();zoom.current=Math.max(10,Math.min(34,zoom.current+e.deltaY*.015));onCameraChange(target.current.yaw*180/Math.PI,target.current.pitch*180/Math.PI,zoom.current)};
 return <div onPointerDown={downFn} onPointerMove={moveFn} onPointerUp={upFn} onPointerCancel={upFn} onWheel={wheelFn} onDoubleClick={()=>zoom.current=zoom.current<18?23:14} className="absolute inset-0 w-full h-full overflow-hidden select-none touch-none bg-black cursor-grab active:cursor-grabbing">
   <div ref={canvasMount} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />
   <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
     {labels.map(l=><div key={l.skillId} style={{transform:`translate3d(${l.x}px,${l.y-8}px,0) translate(-50%,-100%)`,display:l.visible?'block':'none'}} onClick={e=>{e.stopPropagation();const skill=skills.find(s=>s.id===l.skillId);if(skill)onSelectSkill(skill)}} className={`absolute pointer-events-auto cursor-pointer px-2 py-1 rounded-lg backdrop-blur-md border text-center transition-all ${l.isHarvested?'bg-[#39FF14]/20 border-[#39FF14] text-white shadow-[0_0_15px_rgba(57,255,20,0.4)]':l.isSelected?'bg-white/15 border-white text-white shadow-lg':'bg-black/78 hover:bg-black/95 border-white/15 hover:border-[#39FF14]/60 text-zinc-200'}`}>
       <div className="text-[7.5px] md:text-[8px] font-black font-mono uppercase tracking-[0.08em] whitespace-nowrap" style={{color:l.color}}>{l.categoryName}</div>
       <div className="text-[9px] md:text-[10px] font-bold font-mono whitespace-nowrap max-w-[130px] truncate">{l.skillName}</div>
       <div className="text-[7.5px] font-mono text-[#39FF14] font-semibold">{l.statusLabel}</div>
     </div>)}
   </div>
 </div>;
};