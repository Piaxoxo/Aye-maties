/* ============================================================
   AYE MATIES — WebGL ocean engine (scroll-choreographed)
   particle morph · god-rays · caustics shader · camera dive
   Bundled via Astro/Vite (three from npm).
   ============================================================ */
import * as THREE from 'three';

export function initOcean(opts = {}) {
  const canvas = document.getElementById('ocean-gl');
  if (!canvas) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.motion === 'reduce';
  const mobile = innerWidth < 760;
  const choreograph = opts.choreograph !== false && !reduced;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x041320, 0.035);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 160);
  camera.position.set(0, 0, 16);

  const sprite = (() => {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.3, 'rgba(255,255,255,.7)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  })();
  const GA = Math.PI * (3 - Math.sqrt(5));
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---- particle field + morph targets ---- */
  const N = reduced ? 2200 : (mobile ? 3800 : 13000);
  const cloud = new Float32Array(N*3), sphere = new Float32Array(N*3),
        wave = new Float32Array(N*3), portal = new Float32Array(N*3),
        phase = new Float32Array(N), amp = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const j = i*3;
    cloud[j]=rnd(-20,20); cloud[j+1]=rnd(-15,15); cloud[j+2]=rnd(-16,12);
    const y=1-(i/(N-1))*2, rr=Math.sqrt(Math.max(0,1-y*y)), th=GA*i, R=6.6;
    sphere[j]=Math.cos(th)*rr*R; sphere[j+1]=y*R; sphere[j+2]=Math.sin(th)*rr*R-1;
    const wx=rnd(-18,18), wz=rnd(-12,8);
    wave[j]=wx; wave[j+1]=Math.sin(wx*.5)*1.5+Math.cos(wz*.45)*1.2-1; wave[j+2]=wz;
    const pr=3.4+((i*0.61803)%1)*3.8, pa=i*GA;
    portal[j]=Math.cos(pa)*pr; portal[j+1]=Math.sin(pa)*pr; portal[j+2]=rnd(-1.4,1.4);
    phase[i]=Math.random()*Math.PI*2; amp[i]=rnd(.04,.16);
  }
  const pos = new Float32Array(cloud);
  const colors = new Float32Array(N*3), col = new THREE.Color();
  const pal = [0x5fe7da, 0x22c7c0, 0x0c4f6e, 0xdffaff, 0xe6c574];
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    col.setHex(r<.6?pal[0]:r<.8?pal[1]:r<.92?pal[2]:r<.97?pal[3]:pal[4]);
    const b=.6+Math.random()*.4; colors[i*3]=col.r*b; colors[i*3+1]=col.g*b; colors[i*3+2]=col.b*b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    size: mobile ? .12 : .1, map: sprite, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: .95,
  }));
  scene.add(points);

  /* ---- caustics water-light shader ---- */
  const causticMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.4 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime, uOpacity;
      float caustic(vec2 p){ vec2 i=p; float c=1.0, inten=.0045; const int N=5;
        for(int n=0;n<N;n++){ float t=uTime*(1.0-(3.5/float(n+1)));
          i=p+vec2(cos(t-i.x)+sin(t+i.y), sin(t-i.y)+cos(t+i.x));
          c+=1.0/length(vec2(p.x/(sin(i.x+t)/inten), p.y/(cos(i.y+t)/inten))); }
        c/=float(N); c=1.17-pow(c,1.4); return pow(abs(c),8.0); }
      void main(){ float c=caustic(vUv*5.0);
        vec3 col=mix(vec3(0.02,0.25,0.32), vec3(0.36,0.9,0.85), c);
        float vig=smoothstep(1.0,0.2,distance(vUv,vec2(0.5)));
        gl_FragColor=vec4(col, c*uOpacity*vig); }`,
  });
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), causticMat);
  caustics.position.set(0, 20, -26); caustics.rotation.x = -0.5; scene.add(caustics);

  /* ---- volumetric god-rays ---- */
  const rays = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 70),
      new THREE.MeshBasicMaterial({ map: sprite, color: 0x9ff0ea, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(-22 + i*6 + rnd(0,3), 16, -16 - rnd(0,8));
    m.rotation.z = rnd(-.3,.3); m.userData.base = m.rotation.z; m.userData.ph = Math.random()*6.28;
    rays.add(m);
  }
  scene.add(rays);

  /* ---- scroll choreography ---- */
  const forms = { cloud, sphere, wave, portal };
  const keys = choreograph ? [
    { p:0.00, f:'cloud',  z:16, fog:.030 },
    { p:0.22, f:'sphere', z:9.5, fog:.052 },
    { p:0.46, f:'cloud',  z:14, fog:.036 },
    { p:0.68, f:'wave',   z:11, fog:.046 },
    { p:1.00, f:'portal', z:7,  fog:.052 },
  ] : [ { p:0,f:'sphere',z:14,fog:.034 }, { p:1,f:'sphere',z:12,fog:.04 } ];
  const smooth = f => f*f*(3-2*f);
  let scrollP = 0;
  const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; scrollP = h>0 ? Math.min(1,Math.max(0,scrollY/h)) : 0; };
  addEventListener('scroll', onScroll, { passive:true }); onScroll();

  let tX=0,tY=0,mX=0,mY=0;
  addEventListener('pointermove', e => { tX=e.clientX/innerWidth-.5; tY=e.clientY/innerHeight-.5; }, { passive:true });
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock(); let camZ = 16, alive = true;
  function frame() {
    if (!alive) return;
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    mX += (tX-mX)*.05; mY += (tY-mY)*.05;

    let a=keys[0], b=keys[0], kt=0;
    for (let i=0;i<keys.length-1;i++){ if (scrollP>=keys[i].p && scrollP<=keys[i+1].p){ a=keys[i]; b=keys[i+1]; kt=smooth((scrollP-a.p)/(b.p-a.p||1)); break; } if (scrollP>keys[keys.length-1].p){ a=b=keys[keys.length-1]; kt=0; } }
    const A=forms[a.f], B=forms[b.f];
    let pulse=1; if (choreograph && scrollP>0.8) pulse = 1 + Math.sin((scrollP-0.8)/0.2*Math.PI)*0.14;
    const breathe = reduced ? 0 : 1;
    for (let i=0;i<N;i++){ const j=i*3;
      pos[j]   = (A[j]   + (B[j]  -A[j])  *kt)*pulse + Math.cos(t*.4+phase[i])*amp[i]*breathe;
      pos[j+1] = (A[j+1] + (B[j+1]-A[j+1])*kt)*pulse + Math.sin(t*.6+phase[i])*amp[i]*breathe;
      pos[j+2] = (A[j+2] + (B[j+2]-A[j+2])*kt);
    }
    geo.attributes.position.needsUpdate = true;

    camZ += ((a.z + (b.z-a.z)*kt) - camZ)*.06;
    scene.fog.density = a.fog + (b.fog-a.fog)*kt;
    camera.position.x += (mX*3.4 - camera.position.x)*.04;
    camera.position.y += (-mY*2.2 - camera.position.y)*.04;
    camera.position.z = camZ;
    camera.lookAt(0, -scrollP*1.5, -2);

    if (!reduced) {
      points.rotation.y = t*0.02 + mX*0.25 + scrollP*Math.PI*0.4;
      points.rotation.x = mY*0.12;
      rays.children.forEach((r,i)=>{ r.material.opacity = .05 + Math.abs(Math.sin(t*.3+r.userData.ph))*.1; r.rotation.z = r.userData.base + scrollP*0.7 + Math.sin(t*.2+i)*.05; });
      causticMat.uniforms.uTime.value = t*0.5;
      causticMat.uniforms.uOpacity.value = .3 + scrollP*.35;
    }
    renderer.render(scene, camera);
  }
  frame();
  return { destroy(){ alive=false; renderer.dispose(); } };
}
