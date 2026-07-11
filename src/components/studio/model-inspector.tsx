"use client";

import { Box, Grid3X3, RotateCcw, Scan, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ModelInspector() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => undefined);
  const loadRef = useRef<(url: string) => void>(() => undefined);
  const wireframeRef = useRef<(value: boolean) => void>(() => undefined);
  const [wireframe, setWireframe] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ meshes: 3, triangles: "1.2K", material: 2 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelled || !mount) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111411);
      scene.fog = new THREE.Fog(0x111411, 7, 18);
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(4.6, 3.2, 6.2);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.8;
      mount.appendChild(renderer.domElement);

      const hemi = new THREE.HemisphereLight(0xb6c6bf, 0x1e1712, 2.2);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xdde7dd, 3.2);
      key.position.set(4, 7, 5);
      scene.add(key);
      const red = new THREE.PointLight(0x8e201f, 16, 8);
      red.position.set(-3, 1.4, 2);
      scene.add(red);

      const ground = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), new THREE.MeshStandardMaterial({ color: 0x1a1c19, roughness: 0.9, metalness: 0.1 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.22;
      scene.add(ground);
      const grid = new THREE.GridHelper(9, 18, 0x3b433e, 0x232925);
      grid.position.y = -1.2;
      scene.add(grid);

      let active = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: 0x74766b, roughness: 0.78, metalness: 0.04, flatShading: true });
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), material);
      head.scale.set(0.82, 1.1, 0.76);
      head.position.y = 0.55;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.75, 8), material.clone());
      neck.position.y = -0.48;
      const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 1.7, 0.72, 10), material.clone());
      shoulders.scale.z = 0.5;
      shoulders.position.y = -0.95;
      active.add(head, neck, shoulders);
      scene.add(active);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.target.set(0, 0.05, 0);
      controls.minDistance = 2.4;
      controls.maxDistance = 12;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.55;

      const resize = () => {
        const rect = mount.getBoundingClientRect();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect = rect.width / Math.max(1, rect.height);
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();

      let frame = 0;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();

      loadRef.current = (url: string) => {
        setLoading(true);
        new GLTFLoader().load(url, (gltf) => {
          scene.remove(active);
          disposeObject(active);
          active = gltf.scene;
          const box = new THREE.Box3().setFromObject(active);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const max = Math.max(size.x, size.y, size.z) || 1;
          active.scale.setScalar(3 / max);
          active.position.sub(center.multiplyScalar(3 / max));
          scene.add(active);
          let meshes = 0;
          let triangles = 0;
          const materials = new Set<import("three").Material>();
          active.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              meshes += 1;
              const geometry = child.geometry;
              triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
              const list = Array.isArray(child.material) ? child.material : [child.material];
              list.forEach((item) => materials.add(item));
            }
          });
          setStats({ meshes, triangles: triangles > 1000 ? `${(triangles / 1000).toFixed(1)}K` : Math.round(triangles).toString(), material: materials.size });
          setLoading(false);
        }, undefined, () => setLoading(false));
      };

      wireframeRef.current = (value: boolean) => {
        active.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const list = Array.isArray(child.material) ? child.material : [child.material];
            list.forEach((item) => { if ("wireframe" in item) (item as import("three").MeshStandardMaterial).wireframe = value; });
          }
        });
      };

      cleanupRef.current = () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        disposeObject(active);
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => cleanupRef.current();
  }, []);

  const chooseModel = (selected?: File) => {
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    loadRef.current(url);
  };

  return (
    <section className="model-inspector">
      <div className="inspector-heading"><div><Box size={16} /><span>3D ASSET INSPECTOR</span></div><small>Drag to orbit / scroll to zoom</small></div>
      <div className="model-stage" ref={mountRef}>
        {loading && <div className="model-loading"><Scan size={22} /> Reading geometry…</div>}
        <div className="model-stage-label">{file ? file.name : "PLACEHOLDER_BUST.PSX"}</div>
        <div className="stage-controls">
          <label title="Load GLB or GLTF"><Upload size={14} /><input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(event) => chooseModel(event.target.files?.[0])} /></label>
          <button className={wireframe ? "active" : ""} onClick={() => { const next = !wireframe; setWireframe(next); wireframeRef.current(next); }} title="Toggle wireframe"><Grid3X3 size={14} /></button>
          <button title="Reset view"><RotateCcw size={14} /></button>
        </div>
      </div>
      <div className="model-stats"><div><span>MESHES</span><strong>{stats.meshes}</strong></div><div><span>TRIANGLES</span><strong>{stats.triangles}</strong></div><div><span>MATERIALS</span><strong>{stats.material}</strong></div><div><span>FORMAT</span><strong>{file?.name.split(".").pop()?.toUpperCase() || "DEMO"}</strong></div></div>
    </section>
  );
}

function disposeObject(object: import("three").Object3D) {
  object.traverse((child) => {
    const mesh = child as import("three").Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material?.dispose());
  });
}
