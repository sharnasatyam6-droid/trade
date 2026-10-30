import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Globe, Orbit, Moon, Eye, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export const UniverseCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences, updatePreferences } = useWorkspace();
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // References to preserve Three.js scene instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const satellitesRef = useRef<{ mesh: THREE.Group; radius: number; speed: number; inclination: number; phase: number }[]>([]);
  const orbitsGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Procedural Earth Texture Generation
  const createProceduralEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0a1628');
    oceanGrad.addColorStop(0.5, '#0b1d3a');
    oceanGrad.addColorStop(1, '#081322');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Continental landmasses (procedural organic shapes)
    ctx.fillStyle = '#1e382b'; // Deep emerald-slate continent color

    // Draw rough continents (Africa, Europe, Americas, Asia, Australia, Antarctica)
    const drawLand = (cx: number, cy: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Roughen coastline
      for (let i = 0; i < 20; i++) {
        const ox = (Math.random() - 0.5) * rx * 1.4;
        const oy = (Math.random() - 0.5) * ry * 1.4;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, (rx + ry) * 0.15 * Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Americas
    drawLand(500, 350, 180, 140);
    drawLand(600, 650, 130, 220);
    // Eurasia & Africa
    drawLand(1100, 320, 280, 160);
    drawLand(1120, 580, 150, 180);
    drawLand(1500, 360, 320, 160);
    // Australia
    drawLand(1650, 720, 120, 90);
    // Antarctica
    drawLand(1024, 980, 800, 60);

    // Topographical terrain variations
    ctx.fillStyle = '#2d4a3e';
    drawLand(1150, 330, 120, 70);
    drawLand(520, 330, 80, 60);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Procedural Night Lights Texture
  const createProceduralNightTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Black night base
    ctx.fillStyle = '#020409';
    ctx.fillRect(0, 0, 2048, 1024);

    // Glowing city light clusters on landmass coordinates
    const drawCityCluster = (cx: number, cy: number, count: number, radius: number) => {
      for (let i = 0; i < count; i++) {
        const dist = Math.random() * radius;
        const angle = Math.random() * Math.PI * 2;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        const isHub = Math.random() > 0.85;
        ctx.fillStyle = isHub ? 'rgba(255, 235, 170, 0.95)' : 'rgba(255, 180, 60, 0.65)';
        ctx.beginPath();
        ctx.arc(x, y, isHub ? 1.8 : 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Major metropolitan networks (North America, Western Europe, East Asia)
    drawCityCluster(520, 350, 120, 70); // US East Coast / Midwest
    drawCityCluster(400, 370, 60, 40);  // US West Coast
    drawCityCluster(1080, 300, 140, 60); // Europe
    drawCityCluster(1550, 380, 180, 90); // East Asia / coastal China / Japan
    drawCityCluster(1350, 480, 80, 50);  // India

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Procedural Cloud Texture
  const createProceduralCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 1024;
      const cy = 100 + Math.random() * 312;
      const rx = 40 + Math.random() * 80;
      const ry = 15 + Math.random() * 30;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Build Procedural Satellite Model
  const createSatelliteMesh = () => {
    const satelliteGroup = new THREE.Group();

    // Central bus
    const busGeo = new THREE.BoxGeometry(0.08, 0.08, 0.12);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd8e4f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    satelliteGroup.add(bus);

    // Solar panels (left & right wings)
    const panelGeo = new THREE.BoxGeometry(0.3, 0.01, 0.09);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x163459,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x091b33,
      emissiveIntensity: 0.2,
    });
    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-0.2, 0, 0);
    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(0.2, 0, 0);
    satelliteGroup.add(leftPanel);
    satelliteGroup.add(rightPanel);

    // Antenna dish
    const dishGeo = new THREE.ConeGeometry(0.04, 0.04, 8);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x48c8ff, metalness: 0.8, roughness: 0.2 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 0, 0.08);
    satelliteGroup.add(dish);

    return satelliteGroup;
  };

  useEffect(() => {
    if (preferences.webglQuality === 'off') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Probe software GL
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      isSoftwareGl = true;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.2);
    cameraRef.current = camera;

    // 2. Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 3. Lighting Rig (Directional Sun Key + Soft Atmospheric Fill)
    const sunLight = new THREE.DirectionalLight(0xfff6e8, 2.8);
    sunLight.position.set(6, 3, 5);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x0a1628, 0x050814, 0.6);
    scene.add(hemiLight);

    // 4. Planet Earth Hierarchy (Group with 23.5° Axial Tilt)
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.4 * Math.PI) / 180; // Physical axial tilt
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Base Earth Globe
    const earthRadius = 1.6;
    const earthSegments = isSoftwareGl ? 32 : 64;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, earthSegments, earthSegments);

    const earthTexture = createProceduralEarthTexture();
    const nightTexture = createProceduralNightTexture();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.1,
      emissiveMap: preferences.enableNightLights ? nightTexture : null,
      emissive: new THREE.Color(0xfff1cf),
      emissiveIntensity: preferences.enableNightLights ? 0.35 : 0.0,
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.015, earthSegments, earthSegments);
    const cloudTexture = createProceduralCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudsMesh);
    cloudsRef.current = cloudsMesh;

    // Atmospheric Rayleigh Scattering Glow (Outer Halo)
    const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.05, earthSegments, earthSegments);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.28, 0.78, 1.0, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // 5. Starfield & Deep Cosmic Particles
    const starCount = isSoftwareGl ? 500 : 1500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 30 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Star tinting: subtle electric blue, violet, or soft white
      const tint = Math.random();
      if (tint > 0.7) {
        starColors[i * 3] = 0.55;     // r
        starColors[i * 3 + 1] = 0.85; // g (cyan/blue)
        starColors[i * 3 + 2] = 1.0;  // b
      } else if (tint > 0.4) {
        starColors[i * 3] = 0.75;
        starColors[i * 3 + 1] = 0.65;
        starColors[i * 3 + 2] = 1.0;  // violet
      } else {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 6. Artificial Satellites & Orbital Trajectories
    const orbitsGroup = new THREE.Group();
    scene.add(orbitsGroup);
    orbitsGroupRef.current = orbitsGroup;

    const satelliteConfigs = [
      { radius: 2.2, speed: 0.45, inclination: 0.35, phase: 0 },
      { radius: 2.6, speed: -0.32, inclination: -0.5, phase: 1.5 },
      { radius: 3.1, speed: 0.22, inclination: 0.8, phase: 3.1 },
      { radius: 3.6, speed: -0.15, inclination: -0.2, phase: 4.8 },
    ];

    satellitesRef.current = [];

    satelliteConfigs.forEach((cfg) => {
      // Orbital path line loop
      const pathSegments = 64;
      const pathPoints = [];
      for (let i = 0; i <= pathSegments; i++) {
        const theta = (i / pathSegments) * Math.PI * 2;
        const x = cfg.radius * Math.cos(theta);
        const z = cfg.radius * Math.sin(theta);
        const pt = new THREE.Vector3(x, 0, z);
        pt.applyAxisAngle(new THREE.Vector3(1, 0, 0), cfg.inclination);
        pathPoints.push(pt);
      }
      const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathMat = new THREE.LineBasicMaterial({
        color: 0x48c8ff,
        transparent: true,
        opacity: preferences.enableSatellites ? 0.22 : 0,
      });
      const orbitLine = new THREE.Line(pathGeo, pathMat);
      orbitsGroup.add(orbitLine);

      // Satellite model
      const satMesh = createSatelliteMesh();
      satMesh.visible = preferences.enableSatellites;
      orbitsGroup.add(satMesh);

      satellitesRef.current.push({
        mesh: satMesh,
        radius: cfg.radius,
        speed: cfg.speed,
        inclination: cfg.inclination,
        phase: cfg.phase,
      });
    });

    // 7. Responsive Resizing
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop with Tab Inactivity Pausing
    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (document.visibilityState === 'hidden') {
        lastTimeRef.current = time;
        return;
      }

      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const speedFactor = preferences.earthRotationSpeed;

      // Axial Earth rotation
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.y += delta * 0.08 * speedFactor;
      }

      // Clouds rotate at slightly different rate
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += delta * 0.1 * speedFactor;
      }

      // Satellites orbital motion
      if (preferences.enableSatellites) {
        satellitesRef.current.forEach(sat => {
          sat.phase += delta * sat.speed * speedFactor;
          const x = sat.radius * Math.cos(sat.phase);
          const z = sat.radius * Math.sin(sat.phase);
          const pos = new THREE.Vector3(x, 0, z);
          pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), sat.inclination);
          sat.mesh.position.copy(pos);
          sat.mesh.rotation.y += delta * 0.5;
        });
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 9. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      earthTexture.dispose();
      nightTexture.dispose();
      cloudTexture.dispose();
    };
  }, [preferences.webglQuality, preferences.enableNightLights, preferences.enableSatellites]);

  // Adjust camera preset
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preferences.cameraPreset === 'orbit') {
      cam.position.set(0, 1.2, 5.2);
      cam.lookAt(0, 0, 0);
    } else if (preferences.cameraPreset === 'polar') {
      cam.position.set(0, 4.8, 1.8);
      cam.lookAt(0, 0, 0);
    } else if (preferences.cameraPreset === 'nightside') {
      cam.position.set(-4.2, 0.8, -2.8);
      cam.lookAt(0, 0, 0);
    } else if (preferences.cameraPreset === 'horizon') {
      cam.position.set(0.8, -0.6, 2.6);
      cam.lookAt(0, 0.4, 0);
    }
  }, [preferences.cameraPreset]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050713]">
      {/* 3D WebGL Canvas Container */}
      {webglSupported && preferences.webglQuality !== 'off' ? (
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      ) : (
        /* Accessible Fallback when WebGL is unavailable or user chooses reduced motion */
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(72,200,255,0.15),rgba(5,7,19,0.95))]">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,rgba(152,117,255,0.12)_0%,transparent_50%)]" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_70%,rgba(72,200,255,0.1)_0%,transparent_50%)]" />
        </div>
      )}

      {/* Atmospheric Vignette Scrim */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-[#050713]/40 to-[#050713]/90 pointer-events-none" />

      {/* Collapsible Bottom Control Dock (Adhering to Three.js Directives) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[94vw] w-[560px]">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsDockOpen(!isDockOpen)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0A1022]/80 hover:bg-[#0A1022] text-[#94A3B8] hover:text-[#EDF4FF] text-xs font-medium rounded-t-lg border-t border-x border-[#48C8FF]/20 transition-colors shadow-lg"
            aria-label="Toggle Universe Controls"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#48C8FF]" />
            <span>Universe Controls</span>
            {isDockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {isDockOpen && (
            <div className="w-full bg-[#0A1022]/95 border border-[#48C8FF]/20 rounded-b-xl rounded-tl-xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8]">
              {/* Rotation Speed Multiplier */}
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#48C8FF]" />
                <span>Rotation:</span>
                {[0.5, 1.0, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => updatePreferences({ earthRotationSpeed: spd })}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      preferences.earthRotationSpeed === spd
                        ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-semibold border border-[#48C8FF]/40'
                        : 'hover:text-[#EDF4FF]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Satellites Toggle */}
              <button
                onClick={() => updatePreferences({ enableSatellites: !preferences.enableSatellites })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
                  preferences.enableSatellites
                    ? 'border-[#48C8FF]/40 text-[#48C8FF] bg-[#48C8FF]/10'
                    : 'border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Orbit className="w-3 h-3" />
                <span>Satellites</span>
              </button>

              {/* Night Lights Toggle */}
              <button
                onClick={() => updatePreferences({ enableNightLights: !preferences.enableNightLights })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
                  preferences.enableNightLights
                    ? 'border-[#9875FF]/40 text-[#9875FF] bg-[#9875FF]/10'
                    : 'border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>City Lights</span>
              </button>

              {/* Camera Presets */}
              <div className="flex items-center gap-1.5 w-full pt-2 border-t border-slate-800/60 justify-between">
                <span className="flex items-center gap-1 text-[11px]">
                  <Eye className="w-3 h-3 text-[#48C8FF]" /> View:
                </span>
                {(['orbit', 'polar', 'nightside', 'horizon'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => updatePreferences({ cameraPreset: view })}
                    className={`capitalize px-2 py-0.5 rounded text-[11px] transition-colors ${
                      preferences.cameraPreset === view
                        ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-medium'
                        : 'hover:text-[#EDF4FF]'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
