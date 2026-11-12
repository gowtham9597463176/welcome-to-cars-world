import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const socket=io();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9ac4df);scene.fog=new THREE.Fog(0x9ac4df,70,240);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;document.querySelector('#scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd8edff,0x34485a,2));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-30,70,40);sun.castShadow=true;scene.add(sun);
const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.65});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),mat(0x477b56));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
for(let i=-5;i<=5;i++){let r=new THREE.Mesh(new THREE.BoxGeometry(13,.1,600),mat(0x303947));r.position.set(i*45,-.1,0);scene.add(r);let r2=new THREE.Mesh(new THREE.BoxGeometry(600,.1,13),mat(0x303947));r2.position.set(0,-.1,i*45);scene.add(r2);}
for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)for(let n=0;n<3;n++){let h=9+Math.random()*28,b=new THREE.Mesh(new THREE.BoxGeometry(6+Math.random()*7,h,6+Math.random()*7),mat([0x77899d,0x536a83,0xa6a9ad,0x6c8179][Math.floor(Math.random()*4)]));b.position.set(x*45+(Math.random()-.5)*23,h/2,z*45+(Math.random()-.5)*23);b.castShadow=true;scene.add(b);}
function car(color=0x13cfff){let g=new THREE.Group();let body=new THREE.Mesh(new THREE.BoxGeometry(2,.7,4),mat(color));body.position.y=.75;body.castShadow=true;g.add(body);let cabin=new THREE.Mesh(new THREE.BoxGeometry(1.45,.8,1.8),mat(0x142c43));cabin.position.set(0,1.45,.1);g.add(cabin);for(let x of [-1,1])for(let z of [-1.3,1.3]){let w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.25,16),mat(0x080b11));w.rotation.z=Math.PI/2;w.position.set(x,.4,z);g.add(w);}return g;}
const me=car();scene.add(me);const others=new Map(),keys={};let joined=false,heading=0,velocity=0,score=0,lastSend=0;
const $=s=>document.querySelector(s);
function makeRemote(p){let c=car(0xffa33c);c.userData.playerId=p.id;scene.add(c);others.set(p.id,c);return c;}
function applyRemote(p){let c=others.get(p.id)||makeRemote(p);c.position.set(p.x,0,p.z);c.rotation.y=p.rotation||0;}
socket.on('world:players',list=>list.forEach(applyRemote));
socket.on('world:joined',applyRemote);
socket.on('world:player-update',applyRemote);
socket.on('world:left',id=>{let c=others.get(id);if(c){scene.remove(c);others.delete(id);}});
socket.on('admin:players',d=>$('#online').textContent=d.online.length+1);
function enter(){let name=$('#username').value.trim();if(name.length<2){alert('Enter at least 2 characters.');return;}socket.emit('player:join',{username:name},res=>{if(!res?.ok){alert(res?.message||'Could not join');return;}joined=true;$('#join').classList.add('hidden');$('#playerName').textContent=name;$('#toast').textContent='Welcome to Cars World!';$('#toast').style.opacity=1;setTimeout(()=>$('#toast').style.opacity=0,1500);});}
$('#joinBtn').onclick=enter;$('#username').addEventListener('keydown',e=>{if(e.key==='Enter')enter();});
addEventListener('keydown',e=>{keys[e.code]=true;});addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-key]').forEach(b=>{let k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();keys[k]=true;};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));});
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.04);
 if(joined){let forward=keys.KeyW||keys.ArrowUp,back=keys.KeyS||keys.ArrowDown;let boost=(keys.ShiftLeft||keys.ShiftRight)&&forward;velocity+=(forward?1:back?-1:0)*18*dt;velocity*=Math.pow(.985,dt*60);velocity=THREE.MathUtils.clamp(velocity,-10,boost?42:27);
 let steer=(keys.KeyA||keys.ArrowLeft?-1:0)+(keys.KeyD||keys.ArrowRight?1:0);heading+=steer*dt*(.8+Math.abs(velocity)*.035)*(velocity<0?-1:1);
 me.rotation.y=heading;me.position.x+=-Math.sin(heading)*velocity*dt;me.position.z+=-Math.cos(heading)*velocity*dt;
 score+=Math.max(0,Math.floor(Math.abs(velocity)*dt*.15));$('#score').textContent=score;
 let behind=new THREE.Vector3(Math.sin(heading)*10,6,Math.cos(heading)*10);camera.position.lerp(me.position.clone().add(behind),.09);camera.lookAt(me.position.x,1,me.position.z-5);
 if(performance.now()-lastSend>100){socket.emit('player:update',{x:me.position.x,z:me.position.z,rotation:heading,score,level:1,car:'Neon Starter'});lastSend=performance.now();}
 }else{camera.position.set(0,12,22);camera.lookAt(0,0,0);}
 renderer.render(scene,camera);
}
animate();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
