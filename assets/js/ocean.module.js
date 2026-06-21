/* ============================================================
   AYE MATIES — WebGL Ocean Engine  (scroll-choreographed)
   One Blue Planet · morphing particle field · dive-through camera
   caustics water shader · volumetric god-rays · mouse reactive
   ============================================================ */
import * as THREE from 'three';

export function initOcean(opts = {}) {
  const canvas = document.getElementById('ocean-gl');
  if (!canvas) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = innerWidth < 760;
  const showPlanet = opts.planet !== false;
  // Full scroll choreography only where there's a cinematic hero (homepage)
  const choreograph = !!document.querySelector('.hero') && !reduced;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x031120, 0.035);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 160);
  camera.position.set(0, 0, 16);

  const group = new THREE.Group();
  scene.add(group);

  /* soft round sprite */
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
  const GA = Math.PI * (3 - Math.sqrt(5));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* =========================================================
     PARTICLE FIELD  +  morph target formations
     ========================================================= */
  const N = reduced ? 2200 : (mobile ? 3800 : 13000);

  const cloud  = new Float32Array(N * 3);
  const sphere = new Float32Array(N * 3);
  const wave   = new Float32Array(N * 3);
  const portal = new Float32Array(N * 3);
  const logo   = new Float32Array(N * 3);   // filled async (desktop) — defaults to portal
  const phase  = new Float32Array(N);
  const amp    = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    // CLOUD — volumetric dust box
    cloud[j]     = rand(-20, 20);
    cloud[j + 1] = rand(-15, 15);
    cloud[j + 2] = rand(-16, 12);
    // SPHERE — One Blue Planet (fibonacci)
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * i, R = 6.6;
    sphere[j] = Math.cos(th) * rr * R; sphere[j + 1] = y * R; sphere[j + 2] = Math.sin(th) * rr * R - 1;
    // WAVE — rippling ocean sheet
    const wx = rand(-18, 18), wz = rand(-12, 8);
    wave[j] = wx; wave[j + 1] = Math.sin(wx * .5) * 1.5 + Math.cos(wz * .45) * 1.2 - 1; wave[j + 2] = wz;
    // PORTAL — glowing annulus facing the camera
    const pr = 3.4 + ((i * 0.61803) % 1) * 3.8, pa = i * GA;
    portal[j] = Math.cos(pa) * pr; portal[j + 1] = Math.sin(pa) * pr; portal[j + 2] = rand(-1.4, 1.4);
    // logo defaults to portal until the image is sampled
    logo[j] = portal[j]; logo[j + 1] = portal[j + 1]; logo[j + 2] = portal[j + 2];

    phase[i] = Math.random() * Math.PI * 2;
    amp[i] = rand(.04, .16);
  }

  // current live positions start at the cloud
  const pos = new Float32Array(cloud);

  // colours — ocean palette with glow
  const colors = new Float32Array(N * 3);
  const col = new THREE.Color();
  const pal = [0x5ee6da, 0x23c6c0, 0x0e6ba8, 0xdffaff, 0xe6c574];
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    col.setHex(r < .6 ? pal[0] : r < .8 ? pal[1] : r < .92 ? pal[2] : r < .97 ? pal[3] : pal[4]);
    const b = .6 + Math.random() * .4;
    colors[i * 3] = col.r * b; colors[i * 3 + 1] = col.g * b; colors[i * 3 + 2] = col.b * b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: mobile ? .12 : .1, map: dot, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: .95
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* optional secondary planet halo for interior (ambient) pages */
  if (showPlanet && !choreograph) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(7.4, 7.5, 96),
      new THREE.MeshBasicMaterial({ color: 0x5ee6da, transparent: true, opacity: .12, side: THREE.DoubleSide })
    );
    ring.position.set(mobile ? 0 : 5, 2, -2); ring.rotation.x = Math.PI * .42;
    group.add(ring);
  }

  /* sample the logo into the `logo` formation (desktop + choreograph only) */
  if (choreograph && !mobile) {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cw = 240, ch = Math.round(cw * (img.height / img.width));
        const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
        const cx = cc.getContext('2d'); cx.drawImage(img, 0, 0, cw, ch);
        const data = cx.getImageData(0, 0, cw, ch).data;
        const pts = [];
        for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) {
          if (data[(y * cw + x) * 4 + 3] > 110) pts.push([x, y]);
        }
        if (pts.length > 50) {
          const sx = 17 / cw, sy = (17 * (ch / cw)) / ch;
          for (let i = 0; i < N; i++) {
            const p = pts[(Math.random() * pts.length) | 0];
            logo[i * 3] = (p[0] / cw - .5) * 17 + rand(-.05, .05);
            logo[i * 3 + 1] = -(p[1] / ch - .5) * 17 * (ch / cw) + rand(-.05, .05) + 1;
            logo[i * 3 + 2] = rand(-1, 1);
          }
        }
      } catch (e) { /* keep portal fallback */ }
    };
    img.src = 'assets/images/logo.png';
  }

  /* =========================================================
     ANIMATED CAUSTICS — procedural water-light shader
     ========================================================= */
  const causticMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.5 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uOpacity;
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
        float c = caustic(vUv * 5.0);
        vec3 col = mix(vec3(0.02,0.25,0.32), vec3(0.36,0.9,0.85), c);
        float vig = smoothstep(1.0, 0.2, distance(vUv, vec2(0.5)));
        gl_FragColor = vec4(col, c * uOpacity * vig);
      }`
  });
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), causticMat);
  caustics.position.set(0, 20, -26); caustics.rotation.x = -0.5;
  scene.add(caustics);

  /* VOLUMETRIC GOD-RAYS */
  const rays = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 70),
      new THREE.MeshBasicMaterial({ map: dot, color: 0x9ff0ea, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    m.position.set(-22 + i * 6 + rand(0, 3), 16, -16 - rand(0, 8));
    m.rotation.z = rand(-.3, .3); m.userData.phase = Math.random() * Math.PI * 2; m.userData.baseRot = m.rotation.z;
    rays.add(m);
  }
  scene.add(rays);

  /* =========================================================
     SCROLL CHOREOGRAPHY
     ========================================================= */
  // keyframes: scroll fraction -> formation + camera depth + fog
  const forms = { cloud, sphere, wave, portal, logo };
  const keys = choreograph ? [
    { p: 0.00, f: 'cloud',  z: 16, fog: .030 },  // hero
    { p: 0.20, f: 'sphere', z: 9.5, fog: .052 }, // dive into One Blue Planet
    { p: 0.42, f: 'cloud',  z: 14, fog: .036 },  // layers around the format video
    { p: 0.62, f: 'wave',   z: 11, fog: .046 },  // mission — ocean waves
    { p: 0.82, f: 'portal', z: 7,  fog: .052 },  // portal pulls inward
    { p: 1.00, f: 'logo',   z: 9,  fog: .040 },  // reveal the mark
  ] : [
    { p: 0, f: 'sphere', z: 14, fog: .034 },
    { p: 1, f: 'sphere', z: 12, fog: .04 },
  ];
  const smooth = f => f * f * (3 - 2 * f);
  let scrollP = 0;
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollP = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mouse / touch reactive */
  let tX = 0, tY = 0, mX = 0, mY = 0;
  addEventListener('pointermove', e => { tX = e.clientX / innerWidth - .5; tY = e.clientY / innerHeight - .5; }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let camZ = 16, alive = true;

  function frame() {
    if (!alive) return;
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    mX += (tX - mX) * .05; mY += (tY - mY) * .05;

    // pick bracketing keyframes
    let a = keys[0], b = keys[0], kt = 0;
    for (let i = 0; i < keys.length - 1; i++) {
      if (scrollP >= keys[i].p && scrollP <= keys[i + 1].p) {
        a = keys[i]; b = keys[i + 1];
        kt = smooth((scrollP - a.p) / (b.p - a.p || 1));
        break;
      }
      if (scrollP > keys[keys.length - 1].p) { a = b = keys[keys.length - 1]; kt = 0; }
    }
    const A = forms[a.f], B = forms[b.f];

    // soft radial "explode → settle" pulse around the portal moment
    let pulse = 1;
    if (choreograph && scrollP > 0.74 && scrollP < 0.9) {
      pulse = 1 + Math.sin((scrollP - 0.74) / 0.16 * Math.PI) * 0.16;
    }

    // morph positions (scroll-scrubbed) + living drift
    const breathe = reduced ? 0 : 1;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const dx = Math.cos(t * .4 + phase[i]) * amp[i] * breathe;
      const dy = Math.sin(t * .6 + phase[i]) * amp[i] * breathe;
      pos[j]     = (A[j]     + (B[j]     - A[j]) * kt) * pulse + dx;
      pos[j + 1] = (A[j + 1] + (B[j + 1] - A[j + 1]) * kt) * pulse + dy;
      pos[j + 2] = (A[j + 2] + (B[j + 2] - A[j + 2]) * kt);
    }
    geo.attributes.position.needsUpdate = true;

    // camera travels through the field; fog deepens on the dive
    camZ += ((a.z + (b.z - a.z) * kt) - camZ) * .06;
    scene.fog.density = a.fog + (b.fog - a.fog) * kt;
    camera.position.x += (mX * 3.4 - camera.position.x) * .04;
    camera.position.y += (-mY * 2.2 - camera.position.y) * .04;
    camera.position.z = camZ;
    camera.lookAt(0, -scrollP * 1.5, -2);

    if (!reduced) {
      points.rotation.y = t * 0.02 + mX * 0.25 + scrollP * Math.PI * 0.4;
      points.rotation.x = mY * 0.12;
      // god-rays shift angle through the acts
      rays.children.forEach((r, i) => {
        r.material.opacity = .05 + Math.abs(Math.sin(t * .3 + r.userData.phase)) * .1;
        r.rotation.z = r.userData.baseRot + scrollP * 0.7 + Math.sin(t * .2 + i) * .05;
      });
      causticMat.uniforms.uTime.value = t * 0.5;
      causticMat.uniforms.uOpacity.value = .35 + scrollP * .35;
    }

    renderer.render(scene, camera);
  }
  frame();

  return { destroy() { alive = false; renderer.dispose(); } };
}
