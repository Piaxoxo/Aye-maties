/* ============================================================
   AYE MATIES — WebGL Ocean Engine
   One Blue Planet · underwater particles · caustics · volumetric light
   Runs as a fixed full-viewport background on every page.
   ============================================================ */
import * as THREE from 'three';

export function initOcean(opts = {}) {
  const canvas = document.getElementById('ocean-gl');
  if (!canvas) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = innerWidth < 760;
  const showPlanet = opts.planet !== false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  // Cinematic depth — fog gives the "dive" / depth-of-field haze
  scene.fog = new THREE.FogExp2(0x031120, 0.035);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
  camera.position.set(0, 0, 18);

  const group = new THREE.Group();
  scene.add(group);

  /* ---- soft round sprite ---- */
  function sprite() {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(.3, 'rgba(255,255,255,.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  const dot = sprite();

  /* =========================================================
     UNDERWATER MOTES — drifting marine snow (volumetric field)
     ========================================================= */
  const MOTES = mobile ? 2200 : 5200;
  const mPos = new Float32Array(MOTES * 3);
  const mCol = new Float32Array(MOTES * 3);
  const mSpeed = new Float32Array(MOTES);
  const col = new THREE.Color();
  const palette = [0x5ee6da, 0x23c6c0, 0x0e6ba8, 0xdffaff, 0xe6c574];
  for (let i = 0; i < MOTES; i++) {
    mPos[i * 3] = (Math.random() - .5) * 70;
    mPos[i * 3 + 1] = (Math.random() - .5) * 60;
    mPos[i * 3 + 2] = (Math.random() - .5) * 50 - 6;
    col.setHex(palette[(Math.random() * palette.length) | 0]);
    const b = .5 + Math.random() * .5;
    mCol[i * 3] = col.r * b; mCol[i * 3 + 1] = col.g * b; mCol[i * 3 + 2] = col.b * b;
    mSpeed[i] = .06 + Math.random() * .22;
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({
    size: mobile ? .16 : .14, map: dot, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 1
  }));
  group.add(motes);

  /* =========================================================
     ONE BLUE PLANET — point-sphere (recurring identity motif)
     ========================================================= */
  let planet = null, planetPos = null;
  if (showPlanet) {
    const P = mobile ? 5000 : 9000;
    const pp = new Float32Array(P * 3);
    const pc = new Float32Array(P * 3);
    const R = 6.2, GA = Math.PI * (3 - Math.sqrt(5));
    const cOcean = new THREE.Color(0x0e6ba8), cAqua = new THREE.Color(0x5ee6da), cGold = new THREE.Color(0xe6c574);
    for (let i = 0; i < P; i++) {
      const y = 1 - (i / (P - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const th = GA * i;
      pp[i * 3] = Math.cos(th) * rad * R;
      pp[i * 3 + 1] = y * R;
      pp[i * 3 + 2] = Math.sin(th) * rad * R;
      // mostly ocean blues with aqua highlights + rare gold ("continents of light")
      const r = Math.random();
      const c = r < .7 ? cOcean : (r < .94 ? cAqua : cGold);
      const b = .65 + Math.random() * .35;
      pc[i * 3] = c.r * b; pc[i * 3 + 1] = c.g * b; pc[i * 3 + 2] = c.b * b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    planet = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: mobile ? .09 : .075, map: dot, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    planet.position.set(mobile ? 0 : 6.5, mobile ? 4 : 2.2, -2);
    planetPos = planet.position.clone();
    group.add(planet);

    // faint halo ring around the planet
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(R + 1.4, R + 1.5, 96),
      new THREE.MeshBasicMaterial({ color: 0x5ee6da, transparent: true, opacity: .12, side: THREE.DoubleSide })
    );
    ring.position.copy(planet.position);
    ring.rotation.x = Math.PI * .42;
    group.add(ring);
    planet.userData.ring = ring;
  }

  /* =========================================================
     ANIMATED CAUSTICS — procedural shader plane (volumetric light)
     ========================================================= */
  const causticMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.5 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uOpacity;
      // cheap caustic field from layered sine ripples
      float caustic(vec2 p){
        vec2 i = p; float c = 1.0; float inten = .0045; const int N = 5;
        for (int n=0; n<N; n++){
          float t = uTime * (1.0 - (3.5 / float(n+1)));
          i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x+t)/inten), p.y / (cos(i.y+t)/inten)));
        }
        c /= float(N); c = 1.17 - pow(c, 1.4);
        return pow(abs(c), 8.0);
      }
      void main(){
        vec2 uv = vUv * 5.0;
        float c = caustic(uv);
        vec3 col = mix(vec3(0.02,0.25,0.32), vec3(0.36,0.9,0.85), c);
        float vig = smoothstep(1.0, 0.2, distance(vUv, vec2(0.5)));
        gl_FragColor = vec4(col, c * uOpacity * vig);
      }`
  });
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(120, 70), causticMat);
  caustics.position.set(0, 18, -22);
  caustics.rotation.x = -0.5;
  scene.add(caustics);

  /* volumetric god-rays: a few big soft additive sprites up top */
  const rays = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 64),
      new THREE.MeshBasicMaterial({ map: dot, color: 0x9ff0ea, transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    m.position.set(-18 + i * 9 + Math.random() * 4, 14, -16 - Math.random() * 6);
    m.rotation.z = (Math.random() - .5) * .5;
    m.userData.phase = Math.random() * Math.PI * 2;
    rays.add(m);
  }
  scene.add(rays);

  /* =========================================================
     INTERACTION + LOOP
     ========================================================= */
  let pmX = 0, pmY = 0, tX = 0, tY = 0, scrollP = 0;
  addEventListener('pointermove', e => {
    tX = (e.clientX / innerWidth - .5);
    tY = (e.clientY / innerHeight - .5);
  }, { passive: true });

  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollP = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let alive = true;
  function frame() {
    if (!alive) return;
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    pmX += (tX - pmX) * .045;
    pmY += (tY - pmY) * .045;

    // camera parallax + gentle dive as you scroll (depth transition)
    camera.position.x += (pmX * 3.2 - camera.position.x) * .04;
    camera.position.y += (-pmY * 2.0 - camera.position.y) * .04;
    camera.position.z = 18 - scrollP * 6;
    camera.lookAt(0, -scrollP * 3, 0);

    // fog deepens with scroll → "descending" feeling
    scene.fog.density = 0.03 + scrollP * 0.05;

    if (!reduced) {
      motes.rotation.y = t * 0.012;
      // motes drift upward like marine snow
      const arr = mGeo.attributes.position.array;
      for (let i = 0; i < MOTES; i++) {
        arr[i * 3 + 1] += mSpeed[i] * 0.02;
        if (arr[i * 3 + 1] > 30) arr[i * 3 + 1] = -30;
      }
      mGeo.attributes.position.needsUpdate = true;

      if (planet) {
        planet.rotation.y = t * 0.06;
        planet.rotation.z = Math.sin(t * 0.2) * 0.04;
        // planet recedes + rises slightly as you scroll the hero away
        planet.position.y = planetPos.y + Math.sin(t * 0.4) * 0.4 + scrollP * 6;
        planet.position.z = planetPos.z - scrollP * 8;
        planet.userData.ring.position.copy(planet.position);
        planet.userData.ring.rotation.z = t * 0.05;
      }
      rays.children.forEach(r => { r.material.opacity = .06 + Math.abs(Math.sin(t * .3 + r.userData.phase)) * .1; });
      causticMat.uniforms.uTime.value = t * 0.5;
    }

    group.rotation.y = pmX * 0.15;
    renderer.render(scene, camera);
  }
  frame();

  return {
    destroy() { alive = false; renderer.dispose(); },
  };
}
