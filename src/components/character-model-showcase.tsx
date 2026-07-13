"use client";

import { Download, Grid3X3, Pause, Play, RotateCcw, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CharacterModelShowcaseProps = {
  model: string;
  pack: string;
  obj: string;
  name: string;
};

const initialStats = { meshes: 0, triangles: "—", bones: 0, animations: 0 };

export function CharacterModelShowcase({ model, pack, obj, name }: CharacterModelShowcaseProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ reset: () => void; wireframe: (value: boolean) => void; play: (value: boolean) => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let cleanup = () => undefined;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d100e);
      scene.fog = new THREE.Fog(0x0d100e, 5.5, 11);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
      const home = new THREE.Vector3(2.6, 1.55, 3.6);
      camera.position.copy(home);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xc1cec6, 0x1c1713, 2.5));
      const key = new THREE.DirectionalLight(0xf0eee4, 4.4);
      key.position.set(3.5, 6, 4);
      key.castShadow = true;
      scene.add(key);
      const edge = new THREE.PointLight(0xb72622, 18, 7);
      edge.position.set(-2.6, 1.1, 1.7);
      scene.add(edge);
      const cold = new THREE.PointLight(0x769b98, 7, 6);
      cold.position.set(1.5, 2.2, -2.4);
      scene.add(cold);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.8, 64),
        new THREE.MeshStandardMaterial({ color: 0x171a17, roughness: 0.93, metalness: 0.03 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      const grid = new THREE.GridHelper(5.6, 28, 0x343d37, 0x202622);
      grid.position.y = 0.004;
      scene.add(grid);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.target.set(0, 0.94, 0);
      controls.minDistance = 1.65;
      controls.maxDistance = 7;
      controls.maxPolarAngle = Math.PI * 0.54;
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotateSpeed = 0.48;

      const clock = new THREE.Clock();
      let modelRoot = new THREE.Group();
      let mixer: import("three").AnimationMixer | null = null;
      let animationAction: import("three").AnimationAction | null = null;
      let frame = 0;

      const resize = () => {
        const bounds = mount.getBoundingClientRect();
        renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
        camera.aspect = bounds.width / Math.max(1, bounds.height);
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      try {
        const gltf = await new GLTFLoader().loadAsync(model);
        if (cancelled) return;
        modelRoot = gltf.scene;
        scene.add(modelRoot);
        modelRoot.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.82 / Math.max(size.y, 0.001);
        modelRoot.scale.setScalar(scale);
        modelRoot.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        modelRoot.updateMatrixWorld(true);

        let meshes = 0;
        let triangles = 0;
        let bones = 0;
        modelRoot.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes += 1;
            child.castShadow = true;
            child.receiveShadow = true;
            triangles += child.geometry.index ? child.geometry.index.count / 3 : child.geometry.attributes.position.count / 3;
          }
          if (child instanceof THREE.Bone) bones += 1;
        });
        setStats({ meshes, triangles: `${(triangles / 1000).toFixed(1)}K`, bones, animations: gltf.animations.length });

        if (gltf.animations[0]) {
          mixer = new THREE.AnimationMixer(modelRoot);
          animationAction = mixer.clipAction(gltf.animations[0]);
          animationAction.play();
        }
        setLoading(false);
      } catch {
        setLoading(false);
        setFailed(true);
      }

      controlsRef.current = {
        reset: () => {
          camera.position.copy(home);
          controls.target.set(0, 0.94, 0);
          controls.update();
        },
        wireframe: (value) => {
          modelRoot.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const materialList = Array.isArray(child.material) ? child.material : [child.material];
            materialList.forEach((material) => {
              if ("wireframe" in material) (material as import("three").MeshStandardMaterial).wireframe = value;
            });
          });
        },
        play: (value) => {
          controls.autoRotate = value && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (animationAction) animationAction.paused = !value;
        },
      };

      const render = () => {
        const delta = Math.min(clock.getDelta(), 0.05);
        mixer?.update(delta);
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        controls.dispose();
        scene.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.geometry.dispose();
          const materialList = Array.isArray(child.material) ? child.material : [child.material];
          materialList.forEach((material) => material.dispose());
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      cancelled = true;
      controlsRef.current = null;
      cleanup();
    };
  }, [model]);

  const toggleWireframe = () => {
    const next = !wireframe;
    setWireframe(next);
    controlsRef.current?.wireframe(next);
  };

  const togglePlaying = () => {
    const next = !playing;
    setPlaying(next);
    controlsRef.current?.play(next);
  };

  return (
    <section className="character-model-showcase section-shell" aria-label={`${name} interactive 3D model`}>
      <header className="character-model-heading reveal-block">
        <div><p className="section-kicker"><span /> Actual asset / browser build</p><h2>Turn him around.<br /><em>Inspect the work.</em></h2></div>
        <p>This is the downloadable geometry, not a prerender. Drag to orbit, scroll to zoom, expose the wireframe, or stop the clinical idle.</p>
      </header>
      <div className="character-model-frame">
        <div className="character-model-stage" ref={mountRef}>
          {loading && <div className="character-model-loading"><ScanLine size={21} /> Reading Deni&apos;s geometry…</div>}
          {failed && <div className="character-model-loading is-error">The live preview failed. The asset downloads remain available below.</div>}
          <span className="character-model-label">DENI_DOCTOR / RIGGED GLB / BUILD 0.4.9</span>
          <div className="character-model-controls">
            <button onClick={togglePlaying} aria-label={playing ? "Pause model rotation and idle" : "Play model rotation and idle"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
            <button className={wireframe ? "active" : ""} onClick={toggleWireframe} aria-label="Toggle model wireframe"><Grid3X3 size={15} /></button>
            <button onClick={() => controlsRef.current?.reset()} aria-label="Reset model view"><RotateCcw size={15} /></button>
          </div>
        </div>
        <aside className="character-model-panel">
          <div><span>ASSET NAME</span><strong>{name}</strong></div>
          <div className="character-model-stats"><span><b>{stats.triangles}</b> TRIANGLES</span><span><b>{stats.meshes}</b> MESHES</span><span><b>{stats.bones}</b> BONES</span><span><b>{stats.animations}</b> IDLE CLIP</span></div>
          <p>The GLB carries a 56-bone full-finger humanoid skeleton and restrained clinical idle. The OBJ is left in a neutral A-pose for Mixamo&apos;s auto-rigger.</p>
          <a className="model-download primary" href={pack} download><Download size={15} /><span><strong>Download complete character pack</strong><small>GLB + OBJ + MTL + six textures + guide</small></span></a>
          <div className="model-download-row"><a href={model} download>GLB / RIGGED</a><a href={obj} download>OBJ / MIXAMO</a></div>
        </aside>
      </div>
    </section>
  );
}
