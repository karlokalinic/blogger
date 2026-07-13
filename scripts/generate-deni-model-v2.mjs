import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const output = path.resolve("public/models/deni-doctor");
const source = path.resolve("scripts/assets/male-base-mesh-cc0.glb");

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
}

globalThis.FileReader ??= NodeFileReader;

const materials = {
  skin: new THREE.MeshStandardMaterial({ name: "MAT_Skin", color: 0x9b6d59, roughness: 0.82, metalness: 0 }),
  hair: new THREE.MeshStandardMaterial({ name: "MAT_Hair", color: 0x111210, roughness: 0.96, metalness: 0 }),
  coat: new THREE.MeshStandardMaterial({ name: "MAT_Coat", color: 0xb9b5a7, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
  sweater: new THREE.MeshStandardMaterial({ name: "MAT_Sweater", color: 0x37352f, roughness: 1, metalness: 0 }),
  trousers: new THREE.MeshStandardMaterial({ name: "MAT_Trousers", color: 0x272b2a, roughness: 0.95, metalness: 0 }),
  leather: new THREE.MeshStandardMaterial({ name: "MAT_Leather", color: 0x29231e, roughness: 0.76, metalness: 0.03 }),
  eye: new THREE.MeshStandardMaterial({ name: "MAT_Eyes", color: 0x20231f, roughness: 0.32, metalness: 0 }),
  eyeWhite: new THREE.MeshStandardMaterial({ name: "MAT_EyeWhite", color: 0xc7bbb0, roughness: 0.6, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ name: "MAT_Metal", color: 0x5f625d, roughness: 0.35, metalness: 0.68 }),
  red: new THREE.MeshStandardMaterial({ name: "MAT_PenRed", color: 0x6f201d, roughness: 0.55, metalness: 0.08 }),
};

const sourceBuffer = await readFile(source);
const sourceArrayBuffer = sourceBuffer.buffer.slice(sourceBuffer.byteOffset, sourceBuffer.byteOffset + sourceBuffer.byteLength);
const sourceGltf = await new Promise((resolve, reject) => new GLTFLoader().parse(sourceArrayBuffer, "", resolve, reject));

const root = new THREE.Group();
root.name = "Deni_Doctor_Rig";
const assetScale = 1.83 / 1.964;
root.scale.setScalar(assetScale);
const anatomy = sourceGltf.scene;
anatomy.name = "Deni_Anatomy_CC0";
anatomy.rotation.y = -Math.PI / 2;
anatomy.position.y = 1;
root.add(anatomy);

const body = anatomy.getObjectByName("mesh");
if (!(body instanceof THREE.SkinnedMesh) || !body.geometry.index) throw new Error("The CC0 source body is missing its skinned indexed mesh.");
body.name = "Deni_Body_Skinned";
body.material = [materials.skin, materials.sweater, materials.trousers, materials.leather];

const positions = body.geometry.attributes.position;
const sourceIndex = body.geometry.index;
const materialTriangles = [[], [], [], []];
for (let offset = 0; offset < sourceIndex.count; offset += 3) {
  const indices = [sourceIndex.getX(offset), sourceIndex.getX(offset + 1), sourceIndex.getX(offset + 2)];
  let y = 0;
  let lateral = 0;
  for (const index of indices) {
    y += positions.getY(index);
    lateral += Math.abs(positions.getZ(index));
  }
  y /= 3;
  lateral /= 3;
  let materialIndex = 0;
  if (y < -0.81) materialIndex = 3;
  else if (y < -0.025) materialIndex = 2;
  else if (y < 0.65 && !(lateral > 0.43 && y < 0.3)) materialIndex = 1;
  materialTriangles[materialIndex].push(...indices);
}
const groupedIndex = materialTriangles.flat();
body.geometry.setIndex(groupedIndex);
body.geometry.clearGroups();
let groupOffset = 0;
materialTriangles.forEach((indices, materialIndex) => {
  body.geometry.addGroup(groupOffset, indices.length, materialIndex);
  groupOffset += indices.length;
});
body.geometry.computeVertexNormals();

const addMesh = (geometry, material, name, position = new THREE.Vector3(), scale = new THREE.Vector3(1, 1, 1), rotation = new THREE.Euler()) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.rotation.copy(rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
};

const createGarmentShell = () => {
  const levels = [
    { y: 1.62, rx: 0.235, rz: 0.118 },
    { y: 1.47, rx: 0.25, rz: 0.132 },
    { y: 1.2, rx: 0.205, rz: 0.122 },
    { y: 0.72, rx: 0.27, rz: 0.145 },
  ];
  const segments = 28;
  const opening = 0.23;
  const start = Math.PI / 2 + opening;
  const end = Math.PI / 2 - opening + Math.PI * 2;
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row < levels.length; row += 1) {
    const level = levels[row];
    for (let column = 0; column <= segments; column += 1) {
      const t = column / segments;
      const angle = start + (end - start) * t;
      vertices.push(Math.cos(angle) * level.rx, level.y, Math.sin(angle) * level.rz);
      uvs.push(t, 1 - row / (levels.length - 1));
    }
  }
  const stride = segments + 1;
  for (let row = 0; row < levels.length - 1; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const a = row * stride + column;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

addMesh(createGarmentShell(), materials.coat, "Coat_ContinuousShell");

const frontPanelGeometry = (side) => {
  const s = side;
  const points = [
    [0.02 * s, 0.73, 0.151],
    [0.25 * s, 0.73, 0.145],
    [0.22 * s, 1.58, 0.137],
    [0.06 * s, 1.58, 0.148],
    [0.08 * s, 1.36, 0.158],
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0.12, 0.74], 2));
  geometry.setIndex(side > 0 ? [0, 1, 2, 0, 2, 4, 4, 2, 3] : [0, 2, 1, 0, 4, 2, 4, 3, 2]);
  geometry.computeVertexNormals();
  return geometry;
};
addMesh(frontPanelGeometry(1), materials.coat, "Coat_LeftFrontPanel");
addMesh(frontPanelGeometry(-1), materials.coat, "Coat_RightFrontPanel");

const sleeveBetween = (from, to, startRadius, endRadius, name) => {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(endRadius, startRadius, length, 14, 4, false);
  const sleeve = addMesh(geometry, materials.coat, name, from.clone().add(to).multiplyScalar(0.5));
  sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return sleeve;
};

const leftShoulder = new THREE.Vector3(0.205, 1.595, -0.027);
const leftElbow = new THREE.Vector3(0.376, 1.315, -0.009);
const leftWrist = new THREE.Vector3(0.487, 1.14, 0.025);
const rightShoulder = new THREE.Vector3(-0.205, 1.595, -0.027);
const rightElbow = new THREE.Vector3(-0.376, 1.315, -0.009);
const rightWrist = new THREE.Vector3(-0.487, 1.14, 0.025);
sleeveBetween(leftShoulder, leftElbow, 0.093, 0.076, "Coat_LeftUpperSleeve");
sleeveBetween(leftElbow, leftWrist, 0.079, 0.063, "Coat_LeftLowerSleeve");
sleeveBetween(rightShoulder, rightElbow, 0.093, 0.076, "Coat_RightUpperSleeve");
sleeveBetween(rightElbow, rightWrist, 0.079, 0.063, "Coat_RightLowerSleeve");
const panelGeometry = (side) => {
  const points = side > 0
    ? [[0.018, 1.61, 0.139], [0.17, 1.57, 0.137], [0.07, 1.28, 0.151], [0.012, 1.37, 0.154]]
    : [[-0.018, 1.61, 0.139], [-0.17, 1.57, 0.137], [-0.07, 1.28, 0.151], [-0.012, 1.37, 0.154]];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
};
addMesh(panelGeometry(1), materials.coat, "Coat_LapelLeft");
addMesh(panelGeometry(-1), materials.coat, "Coat_LapelRight");
addMesh(new RoundedBoxGeometry(0.105, 0.075, 0.01, 2, 0.005), materials.coat, "Coat_ChestPocket", new THREE.Vector3(-0.125, 1.43, 0.148));
addMesh(new RoundedBoxGeometry(0.125, 0.075, 0.01, 2, 0.005), materials.coat, "Coat_LeftLowerPocket", new THREE.Vector3(0.155, 1.02, 0.151));
addMesh(new RoundedBoxGeometry(0.125, 0.075, 0.01, 2, 0.005), materials.coat, "Coat_RightLowerPocket", new THREE.Vector3(-0.155, 1.02, 0.151));
for (let index = 0; index < 3; index += 1) {
  addMesh(new THREE.CylinderGeometry(0.005, 0.005, 0.095, 7), index === 1 ? materials.red : materials.metal, `Pocket_Pen_${index + 1}`, new THREE.Vector3(-0.16 + index * 0.022, 1.515, 0.164));
}
for (const [index, y] of [1.35, 1.2, 1.05].entries()) {
  addMesh(new THREE.CylinderGeometry(0.011, 0.011, 0.009, 10), materials.metal, `Coat_Button_${index + 1}`, new THREE.Vector3(0.018, y, 0.158), new THREE.Vector3(1, 1, 1), new THREE.Euler(Math.PI / 2, 0, 0));
}
addMesh(new THREE.CylinderGeometry(0.064, 0.074, 0.115, 16), materials.sweater, "Sweater_Turtleneck", new THREE.Vector3(0, 1.67, 0));

addMesh(new THREE.SphereGeometry(0.132, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), materials.hair, "Hair_Cap", new THREE.Vector3(0, 1.865, -0.012), new THREE.Vector3(1.02, 0.84, 1), new THREE.Euler(-0.08, 0, 0));
for (let index = 0; index < 7; index += 1) {
  const x = -0.066 + index * 0.022;
  const strand = addMesh(new THREE.ConeGeometry(0.01 + (index % 3) * 0.002, 0.055 + (index % 3) * 0.008, 5), materials.hair, `Hair_Strand_${index + 1}`, new THREE.Vector3(x, 1.91 - Math.abs(x) * 0.18, 0.108 + (index % 2) * 0.006));
  strand.rotation.z = (index - 3) * 0.035;
  strand.rotation.x = 0.82;
}

for (const x of [-0.041, 0.041]) {
  addMesh(new THREE.SphereGeometry(0.015, 10, 7), materials.eyeWhite, `EyeWhite_${x < 0 ? "Right" : "Left"}`, new THREE.Vector3(x, 1.848, 0.114), new THREE.Vector3(1.25, 0.62, 0.38));
  addMesh(new THREE.SphereGeometry(0.008, 9, 6), materials.eye, `Iris_${x < 0 ? "Right" : "Left"}`, new THREE.Vector3(x, 1.848, 0.123), new THREE.Vector3(0.8, 1, 0.5));
  addMesh(new RoundedBoxGeometry(0.052, 0.008, 0.008, 2, 0.003), materials.hair, `Brow_${x < 0 ? "Right" : "Left"}`, new THREE.Vector3(x, 1.88, 0.116), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, 0, x < 0 ? -0.13 : 0.13));
}
addMesh(new THREE.ConeGeometry(0.019, 0.063, 8), materials.skin, "Nose_Detail", new THREE.Vector3(0, 1.81, 0.13), new THREE.Vector3(0.8, 1, 0.82), new THREE.Euler(Math.PI / 2, 0, 0));
addMesh(new RoundedBoxGeometry(0.067, 0.007, 0.008, 2, 0.003), materials.hair, "Mouth_Detail", new THREE.Vector3(0, 1.762, 0.119), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, 0, -0.02));

root.updateMatrixWorld(true);
const idle = new THREE.AnimationClip("Clinical_Idle", 4, [
  new THREE.VectorKeyframeTrack(`${root.uuid}.scale`, [0, 2, 4], [assetScale, assetScale, assetScale, assetScale * 1.002, assetScale * 1.004, assetScale * 1.002, assetScale, assetScale, assetScale]),
]);

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(root, { binary: true, animations: [idle], onlyVisible: true });
await writeFile(path.join(output, "deni-doctor-rigged.glb"), Buffer.from(glb));

const obj = new OBJExporter().parse(root);
await writeFile(path.join(output, "deni-doctor-mixamo.obj"), `mtllib deni-doctor.mtl\n${obj}`);

const materialTexture = {
  MAT_Skin: "skin.png",
  MAT_Hair: "hair.png",
  MAT_Coat: "coat.png",
  MAT_Sweater: "sweater.png",
  MAT_Trousers: "trousers.png",
  MAT_Leather: "leather.png",
  MAT_Eyes: "hair.png",
  MAT_EyeWhite: "skin.png",
  MAT_Metal: "leather.png",
  MAT_PenRed: "coat.png",
};
const materialColor = {
  MAT_Skin: "0.61 0.43 0.35",
  MAT_Hair: "0.07 0.07 0.06",
  MAT_Coat: "0.73 0.71 0.65",
  MAT_Sweater: "0.22 0.21 0.18",
  MAT_Trousers: "0.15 0.17 0.16",
  MAT_Leather: "0.16 0.13 0.11",
  MAT_Eyes: "0.12 0.13 0.11",
  MAT_EyeWhite: "0.78 0.73 0.69",
  MAT_Metal: "0.37 0.38 0.36",
  MAT_PenRed: "0.44 0.13 0.11",
};
const mtl = Object.entries(materialTexture).map(([name, texture]) => `newmtl ${name}\nKa 0.08 0.08 0.08\nKd ${materialColor[name]}\nKs 0.04 0.04 0.04\nNs 12\nd 1\nillum 2\nmap_Kd textures/${texture}\n`).join("\n");
await writeFile(path.join(output, "deni-doctor.mtl"), mtl);

await writeFile(path.join(output, "THIRD_PARTY.txt"), `HUMAN BASE MESH\nSource: BoQsc/Godot-3D-Male-Base-Mesh\nOriginal author: orange-juice-games\nLicense: CC0 1.0 Universal / public domain dedication\nSource repository: https://github.com/BoQsc/Godot-3D-Male-Base-Mesh\n\nThe Deni clothing, material treatment, face additions, character design, export pipeline and website presentation are original additions for VEO ZAVOD.\n`);
await writeFile(path.join(output, "README.txt"), `DENI / DOCTOR CHARACTER ASSET — VEO ZAVOD\n\nFILES\n- deni-doctor-rigged.glb: browser-ready UV humanoid with a 56-bone full-finger skeleton and restrained idle clip.\n- deni-doctor-mixamo.obj: neutral A-pose source for Mixamo auto-rigging.\n- deni-doctor.mtl + textures/: material package for the OBJ.\n- THIRD_PARTY.txt: CC0 base-mesh provenance.\n\nSCALE AND AXES\n- Real-world scale, approximately 1.83 m.\n- Y up, Z forward.\n- Origin at ground centre.\n\nMIXAMO ROUTE\n1. Upload the provided ZIP or the OBJ together with its MTL and textures.\n2. Place the chin, wrists, elbows, knees and groin markers.\n3. Use the finger skeleton route if the hand recognition succeeds; otherwise the no-fingers route remains safe.\n4. Export FBX for Unity with skin.\n\nThe GLB preserves the CC0 body's continuous skinned topology and adds Deni's coat, sleeves, pockets, hair, face details and material breakdown. Coat sections are production blockout geometry and should receive a final deformation pass before close-up animation.\n`);

console.log(`Generated Deni v2 from the CC0 continuous humanoid base in ${output}`);
