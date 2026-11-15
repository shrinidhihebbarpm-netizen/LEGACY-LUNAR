import * as THREE from 'three';
import type { Nasa3DModelEntry } from '../data/spaceData';

/**
 * Detects software WebGL (SwiftShader, llvmpipe, Basic Render) from the GPU renderer string
 * as required by the threejs skill so we can tune pixelRatio, shadows, and frame pacing.
 */
export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function seededNoise2D(x: number, y: number, seed = 1337): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise2D(x: number, y: number, seed = 1337): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = seededNoise2D(ix, iy, seed);
  const b = seededNoise2D(ix + 1, iy, seed);
  const c = seededNoise2D(ix, iy + 1, seed);
  const d = seededNoise2D(ix + 1, iy + 1, seed);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function fbm2D(x: number, y: number, seed = 1337, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise2D(x * freq, y * freq, seed + i * 17);
    freq *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Generates high-detail 1024x512 deterministic CanvasTextures for celestial bodies or foil.
 */
export function createProceduralPlanetTexture(
  kind: 'sun' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'icy' | 'kapton',
  renderer?: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const isPlanet = kind !== 'kapton';
  const W = isPlanet ? 1024 : 512;
  const H = isPlanet ? 512 : 256;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'sun') {
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      const latFactor = Math.sin(v * Math.PI);
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const n = fbm2D(u * 14, v * 7, 101, 4);
        const cells = fbm2D(u * 36 + n * 1.4, v * 18 - n * 1.1, 203, 3);
        const lum = Math.min(1, 0.55 + cells * 0.45 + latFactor * 0.08);
        const idx = (y * W + x) * 4;
        data[idx] = Math.round(255 * Math.min(1, lum * 1.06));
        data[idx + 1] = Math.round(255 * Math.pow(lum, 1.35) * 0.86);
        data[idx + 2] = Math.round(255 * Math.pow(lum, 2.3) * 0.52);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (kind === 'moon') {
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const macro = fbm2D(u * 6, v * 3, 41, 4);
        const detail = fbm2D(u * 26, v * 13, 83, 4);
        const base = macro < 0.46 ? 96 + detail * 42 : 148 + detail * 68;
        const val = Math.max(45, Math.min(235, Math.round(base)));
        const idx = (y * W + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = Math.min(242, val + 4);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    // Crisp lunar craters with soft ejecta rays
    for (let i = 0; i < 140; i++) {
      const cx = (seededNoise2D(i, 1, 7) * W) % W;
      const cy = 36 + seededNoise2D(i, 2, 7) * (H - 72);
      const r = 3 + seededNoise2D(i, 3, 7) * 18;
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.36)';
      ctx.lineWidth = r > 12 ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(42, 46, 54, 0.34)';
      ctx.fill();
    }
  } else if (kind === 'mars') {
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      const polarMask = Math.max(0, 1 - Math.abs(v - 0.5) * 2.08 < 0.08 ? 1 : 0);
      const nearPole = Math.abs(v - 0.5) > 0.44;
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const albedo = fbm2D(u * 7, v * 3.5, 311, 4);
        const ridge = fbm2D(u * 22, v * 11, 509, 3);
        const darkRegion = albedo < 0.46 ? (0.46 - albedo) * 1.4 : 0;
        const ice = nearPole && albedo > 0.36 ? 1 : polarMask;
        const idx = (y * W + x) * 4;
        if (ice > 0.5) {
          data[idx] = 236;
          data[idx + 1] = 232;
          data[idx + 2] = 228;
        } else {
          const r = 196 + ridge * 46 - darkRegion * 96;
          const g = 98 + ridge * 32 - darkRegion * 54;
          const b = 56 + ridge * 22 - darkRegion * 28;
          data[idx] = Math.max(60, Math.min(242, Math.round(r)));
          data[idx + 1] = Math.max(35, Math.min(165, Math.round(g)));
          data[idx + 2] = Math.max(22, Math.min(110, Math.round(b)));
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    // Valles Marineris canyon scar & Tharsis volcanic provinces
    ctx.strokeStyle = 'rgba(68, 28, 16, 0.52)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.28, H * 0.54);
    ctx.bezierCurveTo(W * 0.36, H * 0.56, W * 0.44, H * 0.53, W * 0.51, H * 0.55);
    ctx.stroke();
  } else if (kind === 'jupiter') {
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const turb = fbm2D(u * 14, v * 10, 701, 4);
        const bandPhase = Math.sin((v + turb * 0.045) * Math.PI * 13);
        const subBand = Math.cos((v + turb * 0.025) * Math.PI * 26);
        const t = bandPhase * 0.5 + subBand * 0.25 + 0.5;
        const idx = (y * W + x) * 4;
        data[idx] = Math.round(168 + t * 72);
        data[idx + 1] = Math.round(118 + t * 88);
        data[idx + 2] = Math.round(88 + t * 84);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    // Great Red Spot
    ctx.fillStyle = 'rgba(186, 82, 54, 0.85)';
    ctx.beginPath();
    ctx.ellipse(W * 0.62, H * 0.63, 44, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'saturn') {
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;
    for (let y = 0; y < H; y++) {
      const v = y / H;
      const polarHex = v < 0.08 || v > 0.92;
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const turb = fbm2D(u * 10, v * 12, 911, 3);
        const band = 0.5 + 0.35 * Math.sin((v + turb * 0.02) * Math.PI * 18) + 0.15 * Math.cos(v * Math.PI * 34);
        const idx = (y * W + x) * 4;
        if (polarHex) {
          data[idx] = 148;
          data[idx + 1] = 144;
          data[idx + 2] = 122;
        } else {
          data[idx] = Math.round(182 + band * 56);
          data[idx + 1] = Math.round(160 + band * 54);
          data[idx + 2] = Math.round(112 + band * 48);
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (kind === 'icy') {
    ctx.fillStyle = '#CFFAFE';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 42; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 37) % W, (i * 19) % H);
      ctx.bezierCurveTo(
        (i * 83) % W,
        (i * 59) % H,
        (i * 129) % W,
        (i * 97) % H,
        (i * 173) % W,
        (i * 149) % H
      );
      ctx.stroke();
    }
  } else {
    // Kapton foil crinkle pattern
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 243, 199, 0.28)' : 'rgba(180, 83, 9, 0.28)';
      ctx.beginPath();
      const x = (i * 53) % W;
      const y = (i * 31) % H;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18, y + 6);
      ctx.lineTo(x + 8, y + 22);
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

/**
 * Generates radial A / B / C Saturn ring texture with Cassini Division & Encke Gap alpha.
 */
export function createSaturnRingTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const W = 512;
  const H = 32;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;

  for (let x = 0; x < W; x++) {
    const t = x / (W - 1); // 0 = inner C ring edge, 1 = outer A/F ring edge
    let alpha = 0;
    let r = 216;
    let g = 196;
    let b = 152;

    if (t > 0.04 && t < 0.22) {
      // Translucent dusky C Ring
      alpha = 0.28 * Math.sin(((t - 0.04) / 0.18) * Math.PI);
      r = 166;
      g = 152;
      b = 128;
    } else if (t >= 0.22 && t < 0.61) {
      // Bright dense B Ring with fine ringlets
      const ripple = 0.85 + 0.15 * Math.sin(t * 210);
      alpha = 0.92 * ripple;
      r = 228;
      g = 208;
      b = 166;
    } else if (t >= 0.61 && t < 0.67) {
      // Cassini Division gap
      alpha = 0.06;
      r = 90;
      g = 84;
      b = 74;
    } else if (t >= 0.67 && t < 0.94) {
      // Outer A Ring + Encke Gap near 0.86
      const encke = t > 0.855 && t < 0.872 ? 0.12 : 1;
      const ripple = 0.82 + 0.18 * Math.cos(t * 165);
      alpha = 0.72 * ripple * encke;
      r = 206;
      g = 190;
      b = 156;
    } else if (t >= 0.97 && t < 0.99) {
      // Thin F Ring
      alpha = 0.35;
    }

    for (let y = 0; y < H; y++) {
      const idx = (y * W + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

/**
 * Builds composite 5 to 12-part procedural 3D models (`THREE.Group`) for each NASA
 * spacecraft, rover, lander, telescope, or celestial body in the 3D Model Library.
 */
export function buildProceduralArtifactGroup(
  archetype: Nasa3DModelEntry['proceduralArchetype'],
  renderer?: THREE.WebGLRenderer
): THREE.Group {
  const group = new THREE.Group();

  // Shared calibrated PBR materials (varying roughness by >= 0.25 across parts)
  const goldKaptonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createProceduralPlanetTexture('kapton', renderer),
    metalness: 0.85,
    roughness: 0.25,
  });
  const brushedAluminumMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    metalness: 0.82,
    roughness: 0.22,
  });
  const whiteThermalMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.15,
    roughness: 0.65,
  });
  const solarCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.55,
    roughness: 0.2,
    emissive: 0x0f172a,
  });
  const darkCarbonMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.35,
    roughness: 0.72,
  });
  const copperAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.78,
    roughness: 0.28,
  });

  switch (archetype) {
    case 'moon-globe': {
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: createProceduralPlanetTexture('moon', renderer),
        roughness: 0.88,
        metalness: 0.05,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.75, 32, 32), moonMat);
      group.add(sphere);

      // Orbital ring & Apollo site markers (6 golden pins)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.25, 0.015, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
      );
      ring.rotation.x = Math.PI / 2.3;
      group.add(ring);

      const apolloCoords = [
        [0.4, 0.2, 1.68],
        [-0.5, 0.1, 1.66],
        [0.2, 0.8, 1.54],
        [0.6, -0.3, 1.61],
        [0.8, 0.5, 1.48],
        [-0.3, 0.6, 1.62],
      ];
      apolloCoords.forEach(([x, y, z]) => {
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), goldKaptonMat);
        pin.position.set(x, y, z);
        group.add(pin);
      });
      break;
    }

    case 'apollo-descent': {
      // 1. Octagonal Kapton descent stage body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.82, 8), goldKaptonMat);
      body.position.y = 0.2;
      group.add(body);

      // 2. Top deck ring & blast deflector
      const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 8), darkCarbonMat);
      topDeck.position.y = 0.64;
      group.add(topDeck);

      // 3. Descent engine bell underneath
      const engineBell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.46, 0.55, 20, 1, true),
        darkCarbonMat
      );
      engineBell.position.y = -0.32;
      group.add(engineBell);

      // 4. Four outrigger struts, landing legs, and circular footpads
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const legGroup = new THREE.Group();
        legGroup.rotation.y = angle;

        const outrigger = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.75), goldKaptonMat);
        outrigger.position.set(0, 0.25, 1.35);
        legGroup.add(outrigger);

        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.35, 12), goldKaptonMat);
        strut.position.set(0, -0.15, 1.65);
        strut.rotation.x = -0.22;
        legGroup.add(strut);

        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 20), goldKaptonMat);
        pad.position.set(0, -0.78, 1.82);
        legGroup.add(pad);

        // Egress ladder on front leg
        if (i === 0) {
          const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.25, 0.04), brushedAluminumMat);
          ladder.position.set(0, -0.1, 1.72);
          ladder.rotation.x = -0.22;
          legGroup.add(ladder);
        }

        group.add(legGroup);
      }

      // 5. Lunar surface base disc
      const baseDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.7, 0.08, 32),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95, metalness: 0.05 })
      );
      baseDisc.position.y = -0.84;
      group.add(baseDisc);
      break;
    }

    case 'moon-rock': {
      // 1. Vesicular lunar basalt rock (multi-faceted dodecahedron + sub-lobes)
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.9,
        metalness: 0.12,
      });
      const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), rockMat);
      mainRock.position.set(-0.65, 0.05, 0);
      mainRock.scale.set(1.2, 0.85, 1.0);
      group.add(mainRock);

      // 2. Apollo Laser Retroreflector Array beside the rock
      const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 1.1), whiteThermalMat);
      tray.position.set(0.85, -0.2, 0.1);
      tray.rotation.x = 0.45;
      group.add(tray);

      // Corner-cube mirror grid on the tray
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 6), brushedAluminumMat);
          prism.position.set(0.85 + c * 0.28, -0.12 - r * 0.12, 0.1 + r * 0.25);
          prism.rotation.x = 0.45;
          group.add(prism);
        }
      }

      // 3. Green laser beam visual indicator
      const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.75 })
      );
      laserBeam.position.set(0.85, 0.85, 0.65);
      laserBeam.rotation.x = 0.45;
      group.add(laserBeam);
      break;
    }

    case 'mars-globe': {
      const marsMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: createProceduralPlanetTexture('mars', renderer),
        roughness: 0.82,
        metalness: 0.08,
      });
      const mars = new THREE.Mesh(new THREE.SphereGeometry(1.75, 32, 32), marsMat);
      group.add(mars);

      // Phobos & Deimos mini moons + orbital path
      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.35, 0.012, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 })
      );
      orbitRing.rotation.x = Math.PI / 2.1;
      group.add(orbitRing);

      const phobos = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 1), darkCarbonMat);
      phobos.position.set(2.35, 0.1, 0);
      group.add(phobos);
      break;
    }

    case 'mer-rover': {
      // Spirit & Opportunity 6-wheeled solar wing rover
      // 1. Warm Electronics Box (Gold Kapton hull)
      const webBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.48, 1.15), goldKaptonMat);
      webBody.position.y = 0.18;
      group.add(webBody);

      // 2. Winged solar panels (left, right, rear, center)
      const centerDeck = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 1.25), solarCellMat);
      centerDeck.position.y = 0.44;
      group.add(centerDeck);

      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.1), solarCellMat);
      leftWing.position.set(-0.98, 0.43, -0.05);
      group.add(leftWing);

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.1), solarCellMat);
      rightWing.position.set(0.98, 0.43, -0.05);
      group.add(rightWing);

      const rearWing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.65), solarCellMat);
      rearWing.position.set(0, 0.43, -0.92);
      group.add(rearWing);

      // 3. Pancam mast & dual camera eyes
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.05, 12), whiteThermalMat);
      mast.position.set(0.22, 0.95, 0.42);
      group.add(mast);

      const cameraBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2), whiteThermalMat);
      cameraBar.position.set(0.22, 1.48, 0.45);
      group.add(cameraBar);

      const leftEye = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), copperAccentMat);
      leftEye.rotation.x = Math.PI / 2;
      leftEye.position.set(0.1, 1.48, 0.56);
      group.add(leftEye);

      const rightEye = leftEye.clone();
      rightEye.position.x = 0.34;
      group.add(rightEye);

      // 4. 6 Rocker-bogie wheels
      const wheelPositions = [
        [-0.72, -0.38, 0.72],
        [0.72, -0.38, 0.72],
        [-0.78, -0.38, 0],
        [0.78, -0.38, 0],
        [-0.72, -0.38, -0.72],
        [0.72, -0.38, -0.72],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 20), darkCarbonMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        group.add(wheel);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12), goldKaptonMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x, y, z);
        group.add(hub);
      });

      // 5. Robotic instrument deployment arm (IDD)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.75), brushedAluminumMat);
      arm.position.set(-0.22, -0.05, 0.85);
      arm.rotation.x = 0.35;
      group.add(arm);
      break;
    }

    case 'perseverance-rover': {
      // 1. Main rover chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.58, 1.65), whiteThermalMat);
      chassis.position.y = 0.22;
      group.add(chassis);

      // 2. Angled rear MMRTG nuclear power generator with cooling fins
      const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.78, 16), whiteThermalMat);
      rtg.position.set(0, 0.45, -1.05);
      rtg.rotation.x = -0.65;
      group.add(rtg);

      // 3. SuperCam mast & laser cyclops head
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.1, 12), whiteThermalMat);
      mast.position.set(0.28, 0.98, 0.58);
      group.add(mast);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.28), whiteThermalMat);
      head.position.set(0.28, 1.55, 0.62);
      group.add(head);

      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), copperAccentMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0.28, 1.58, 0.77);
      group.add(lens);

      // 4. Heavy turret coring drill arm + 6 wheels + sample tube on ground
      const armBoom = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.05), brushedAluminumMat);
      armBoom.position.set(-0.28, 0.15, 1.18);
      group.add(armBoom);

      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16), darkCarbonMat);
      turret.position.set(-0.28, 0.1, 1.72);
      group.add(turret);

      const wheelCoords = [
        [-0.82, -0.38, 0.85],
        [0.82, -0.38, 0.85],
        [-0.88, -0.38, 0],
        [0.88, -0.38, 0],
        [-0.82, -0.38, -0.85],
        [0.82, -0.38, -0.85],
      ];
      wheelCoords.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 20), darkCarbonMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        group.add(wheel);
      });

      // Sealed titanium sample tube on the ground
      const sampleTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12), whiteThermalMat);
      sampleTube.rotation.z = Math.PI / 2;
      sampleTube.position.set(0.45, -0.62, 1.45);
      group.add(sampleTube);
      break;
    }

    case 'ingenuity-chopper': {
      // 1. Tissue-box kapton fuselage
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.58), goldKaptonMat);
      box.position.y = 0.05;
      group.add(box);

      // 2. Central rotor mast
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 16), darkCarbonMat);
      mast.position.y = 0.65;
      group.add(mast);

      // 3. Counter-rotating carbon-fiber rotor blades (2 pairs)
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.025, 0.22), darkCarbonMat);
      blade1.position.y = 0.72;
      blade1.rotation.y = 0.25;
      group.add(blade1);

      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.025, 0.22), darkCarbonMat);
      blade2.position.y = 0.98;
      blade2.rotation.y = -0.55;
      group.add(blade2);

      // 4. Top rectangular solar panel
      const topSolar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.03, 0.42), solarCellMat);
      topSolar.position.y = 1.24;
      group.add(topSolar);

      // 5. Four spindly carbon landing legs
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 8), darkCarbonMat);
        leg.position.set(Math.cos(angle) * 0.58, -0.42, Math.sin(angle) * 0.58);
        leg.rotation.z = -Math.cos(angle) * 0.52;
        leg.rotation.x = Math.sin(angle) * 0.52;
        group.add(leg);
      }
      break;
    }

    case 'insight-lander': {
      // 1. Octagonal lander deck
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.75, 0.38, 12), goldKaptonMat);
      deck.position.y = 0.1;
      group.add(deck);

      // 2. Twin circular decagonal fan solar arrays
      const leftFan = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.04, 10), solarCellMat);
      leftFan.position.set(-1.95, 0.22, 0);
      group.add(leftFan);

      const rightFan = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.04, 10), solarCellMat);
      rightFan.position.set(1.95, 0.22, 0);
      group.add(rightFan);

      // 3. Three landing legs
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), brushedAluminumMat);
        leg.position.set(Math.cos(a) * 0.78, -0.35, Math.sin(a) * 0.78);
        group.add(leg);
      }

      // 4. Deployed SEIS Seismometer dome on the Martian surface in front
      const seisDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        whiteThermalMat
      );
      seisDome.position.set(0, -0.78, 1.45);
      group.add(seisDome);

      const seisSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.14, 20), goldKaptonMat);
      seisSkirt.position.set(0, -0.74, 1.45);
      group.add(seisSkirt);
      break;
    }

    case 'maven-orbiter':
    case 'mro-orbiter': {
      // 1. Cube bus wrapped in gold Kapton
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.95), goldKaptonMat);
      group.add(bus);

      // 2. High-gain white dish antenna on top
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, 0.65),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.set(0, 0.95, 0);
      group.add(dish);

      // 3. Gull-wing solar panels with magnetometer tips
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.04, 0.72), solarCellMat);
      leftWing.position.set(-1.6, 0.1, 0);
      leftWing.rotation.z = 0.15;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.04, 0.72), solarCellMat);
      rightWing.position.set(1.6, 0.1, 0);
      rightWing.rotation.z = -0.15;
      group.add(rightWing);
      break;
    }

    case 'jupiter-globe': {
      const jupMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: createProceduralPlanetTexture('jupiter', renderer),
        roughness: 0.7,
        metalness: 0.05,
      });
      const jup = new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 32), jupMat);
      group.add(jup);

      // 4 Galilean moons orbiting
      const radii = [2.35, 2.65, 2.95, 3.25];
      const colors = [0xfbbf24, 0x38bdf8, 0x94a3b8, 0x64748b];
      radii.forEach((r, idx) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.11 + idx * 0.015, 16, 16),
          new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.6 })
        );
        const angle = idx * 1.4;
        m.position.set(Math.cos(angle) * r, (idx - 1.5) * 0.12, Math.sin(angle) * r);
        group.add(m);
      });
      break;
    }

    case 'juno-probe':
    case 'europa-clipper': {
      // 1. Hexagonal titanium vault & bus
      const hexBus = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.58, 6), goldKaptonMat);
      group.add(hexBus);

      // 2. White high-gain dish
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 24, 12, 0, Math.PI * 2, 0, 0.6),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 0.58;
      group.add(dish);

      // 3. Three giant 9-meter pinwheel solar arrays
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const wingGroup = new THREE.Group();
        wingGroup.rotation.y = angle;

        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.04, 0.68), solarCellMat);
        wing.position.set(1.85, 0, 0);
        wingGroup.add(wing);

        group.add(wingGroup);
      }
      break;
    }

    case 'saturn-globe': {
      const satMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: createProceduralPlanetTexture('saturn', renderer),
        roughness: 0.72,
        metalness: 0.05,
      });
      const saturn = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 32), satMat);
      group.add(saturn);

      // Multi-band Saturn ring system
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(1.75, 2.35, 64),
        new THREE.MeshStandardMaterial({
          color: 0xfde68a,
          side: THREE.DoubleSide,
          roughness: 0.55,
          transparent: true,
          opacity: 0.88,
        })
      );
      innerRing.rotation.x = Math.PI / 2.25;
      group.add(innerRing);

      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(2.46, 2.95, 64),
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          side: THREE.DoubleSide,
          roughness: 0.65,
          transparent: true,
          opacity: 0.72,
        })
      );
      outerRing.rotation.x = Math.PI / 2.25;
      group.add(outerRing);
      break;
    }

    case 'cassini-orbiter': {
      // 1. Tall cylindrical gold Kapton bus
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.55, 12), goldKaptonMat);
      group.add(bus);

      // 2. 4-meter white high-gain antenna dish on top
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 28, 14, 0, Math.PI * 2, 0, 0.65),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 1.22;
      group.add(dish);

      const feedTripod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.25, 0.65, 6), whiteThermalMat);
      feedTripod.position.y = 1.15;
      group.add(feedTripod);

      // 3. Saucer-shaped gold Huygens Titan Probe attached to the side!
      const huygens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.58, 0.28, 24), copperAccentMat);
      huygens.rotation.z = Math.PI / 2;
      huygens.position.set(0.68, -0.08, 0);
      group.add(huygens);

      // 4. Long magnetometer boom + twin propulsion nozzles
      const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 8), brushedAluminumMat);
      magBoom.rotation.z = Math.PI / 2;
      magBoom.position.set(-1.45, 0.25, 0);
      group.add(magBoom);

      const nozzle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.35, 16), darkCarbonMat);
      nozzle1.position.set(-0.18, -0.95, 0);
      group.add(nozzle1);

      const nozzle2 = nozzle1.clone();
      nozzle2.position.x = 0.18;
      group.add(nozzle2);
      break;
    }

    case 'voyager-probe': {
      // 1. 10-sided decagonal bus
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.38, 10), darkCarbonMat);
      group.add(bus);

      // 2. Iconic 3.7-meter white parabolic dish
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 32, 16, 0, Math.PI * 2, 0, 0.65),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 0.68;
      group.add(dish);

      // 3. The 12-inch Golden Record mounted on the side of the bus!
      const goldenRecord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.12 })
      );
      goldenRecord.rotation.x = Math.PI / 2;
      goldenRecord.position.set(0, 0, 0.59);
      group.add(goldenRecord);

      // 4. Triple RTG nuclear power boom extending left
      const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.85, 10), darkCarbonMat);
      rtgBoom.rotation.z = Math.PI / 2 + 0.18;
      rtgBoom.position.set(-1.35, -0.25, 0);
      group.add(rtgBoom);

      // 5. Science scan platform boom extending right
      const scanBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.45, 10), brushedAluminumMat);
      scanBoom.rotation.z = Math.PI / 2 - 0.15;
      scanBoom.position.set(1.15, -0.15, 0);
      group.add(scanBoom);

      const cameraHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.35), goldKaptonMat);
      cameraHead.position.set(1.88, -0.28, 0);
      group.add(cameraHead);
      break;
    }

    case 'pioneer-probe': {
      // 1. Large shallow white parabolic dish
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 28, 14, 0, Math.PI * 2, 0, 0.58),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 0.45;
      group.add(dish);

      // 2. Hexagonal gold compartment beneath dish
      const compartment = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.35, 6), goldKaptonMat);
      compartment.position.y = -0.05;
      group.add(compartment);

      // 3. Twin SNAP-19 nuclear generator booms
      for (const dir of [-1, 1]) {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.65, 8), brushedAluminumMat);
        boom.rotation.z = Math.PI / 2;
        boom.position.set(dir * 1.25, -0.05, 0);
        group.add(boom);

        const rtgUnit = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12), copperAccentMat);
        rtgUnit.position.set(dir * 2.05, -0.05, 0);
        group.add(rtgUnit);
      }
      break;
    }

    case 'new-horizons': {
      // 1. Grand-piano triangular gold-blanketed body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.48, 3), goldKaptonMat);
      group.add(body);

      // 2. High-gain dish on top
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, 0.62),
        whiteThermalMat
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 0.62;
      group.add(dish);

      // 3. Cylindrical black RTG nuclear generator protruding from one corner
      const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.15, 16), darkCarbonMat);
      rtg.rotation.z = Math.PI / 2;
      rtg.position.set(-1.25, 0, 0);
      group.add(rtg);
      break;
    }

    case 'icy-moon': {
      const icyMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: createProceduralPlanetTexture('icy', renderer),
        roughness: 0.35,
        metalness: 0.15,
      });
      const moon = new THREE.Mesh(new THREE.SphereGeometry(1.65, 32, 32), icyMat);
      group.add(moon);

      // South-polar cryovolcanic water plume geysers
      for (let i = 0; i < 5; i++) {
        const plume = new THREE.Mesh(
          new THREE.ConeGeometry(0.18 + i * 0.04, 0.85, 12),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
        );
        plume.position.set((i - 2) * 0.18, -1.95, 0);
        group.add(plume);
      }
      break;
    }

    case 'jwst-telescope':
    case 'hubble-telescope': {
      // 1. 5-layer diamond-shaped Kapton sunshield base
      for (let layer = 0; layer < 4; layer++) {
        const shield = new THREE.Mesh(
          new THREE.CylinderGeometry(1.75 - layer * 0.06, 1.75 - layer * 0.06, 0.02, 4),
          layer === 0 ? goldKaptonMat : brushedAluminumMat
        );
        shield.position.y = -0.55 + layer * 0.08;
        shield.scale.set(1.35, 1, 0.85);
        group.add(shield);
      }

      // 2. 18-segment hexagonal gold primary mirror array
      const mirrorGroup = new THREE.Group();
      mirrorGroup.position.set(0, 0.48, -0.15);

      const hexCoords = [
        [0, 0],
        [0, 0.38],
        [0, -0.38],
        [0.33, 0.19],
        [0.33, -0.19],
        [-0.33, 0.19],
        [-0.33, -0.19],
        [0.66, 0],
        [-0.66, 0],
        [0.33, 0.57],
        [-0.33, 0.57],
        [0.33, -0.57],
        [-0.33, -0.57],
      ];
      hexCoords.forEach(([x, y]) => {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.05, 6),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.1 })
        );
        seg.rotation.x = Math.PI / 2;
        seg.position.set(x, y, 0);
        mirrorGroup.add(seg);
      });

      // Secondary mirror tripod struts
      const secMirror = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16), goldKaptonMat);
      secMirror.rotation.x = Math.PI / 2;
      secMirror.position.set(0, 0, 1.05);
      mirrorGroup.add(secMirror);

      for (const sx of [-0.55, 0, 0.55]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), darkCarbonMat);
        strut.position.set(sx * 0.5, sx === 0 ? 0.35 : -0.25, 0.52);
        strut.rotation.x = sx === 0 ? -0.55 : 0.45;
        mirrorGroup.add(strut);
      }

      group.add(mirrorGroup);
      break;
    }
  }

  return group;
}
