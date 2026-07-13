import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const output = path.resolve("public/models/deni-doctor");
const textureDirectory = path.join(output, "textures");
await mkdir(textureDirectory, { recursive: true });

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

const textureSpecs = [
  { file: "skin.png", base: "#9b6d59", line: "#c7977f", kind: "skin" },
  { file: "hair.png", base: "#111210", line: "#2b2a25", kind: "hair" },
  { file: "coat.png", base: "#b9b5a7", line: "#817f76", kind: "coat" },
  { file: "sweater.png", base: "#37352f", line: "#6a655a", kind: "knit" },
  { file: "trousers.png", base: "#272b2a", line: "#535954", kind: "cloth" },
  { file: "leather.png", base: "#29231e", line: "#665548", kind: "leather" },
];

for (const spec of textureSpecs) {
  const marks = [];
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 83) % 512;
    const y = (index * 137) % 512;
    const length = spec.kind === "knit" ? 512 : 12 + ((index * 17) % 52);
    const opacity = 0.05 + (index % 5) * 0.018;
    if (spec.kind === "knit" || spec.kind === "hair") {
      marks.push(`<path d="M${x} 0 L${x + (index % 3) - 1} ${length}" stroke="${spec.line}" stroke-width="${spec.kind === "knit" ? 2 : 1}" opacity="${opacity + 0.08}"/>`);
    } else {
      marks.push(`<ellipse cx="${x}" cy="${y}" rx="${length}" ry="${Math.max(3, length / 5)}" fill="${spec.line}" opacity="${opacity}"/>`);
    }
  }
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="${spec.base}"/>${marks.join("")}<filter id="n"><feTurbulence baseFrequency=".42" numOctaves="3" seed="19"/><feColorMatrix values=".12 0 0 0 0 0 .12 0 0 0 0 0 .12 0 0 0 0 0 .18 0"/></filter><rect width="512" height="512" filter="url(#n)" opacity=".24"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(textureDirectory, spec.file));
}

const materials = {
  skin: new THREE.MeshStandardMaterial({ name: "MAT_Skin", color: 0x9b6d59, roughness: 0.82, metalness: 0 }),
  hair: new THREE.MeshStandardMaterial({ name: "MAT_Hair", color: 0x111210, roughness: 0.96, metalness: 0 }),
  coat: new THREE.MeshStandardMaterial({ name: "MAT_Coat", color: 0xb9b5a7, roughness: 0.92, metalness: 0 }),
  sweater: new THREE.MeshStandardMaterial({ name: "MAT_Sweater", color: 0x37352f, roughness: 1, metalness: 0 }),
  trousers: new THREE.MeshStandardMaterial({ name: "MAT_Trousers", color: 0x272b2a, roughness: 0.95, metalness: 0 }),
  leather: new THREE.MeshStandardMaterial({ name: "MAT_Leather", color: 0x29231e, roughness: 0.76, metalness: 0.03 }),
  eye: new THREE.MeshStandardMaterial({ name: "MAT_Eyes", color: 0x262722, roughness: 0.32, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ name: "MAT_Metal", color: 0x5f625d, roughness: 0.35, metalness: 0.68 }),
  red: new THREE.MeshStandardMaterial({ name: "MAT_PenRed", color: 0x6f201d, roughness: 0.55, metalness: 0.08 }),
};

const root = new THREE.Group();
root.name = "Deni_Doctor_Rig";

const bone = (name, parent, position) => {
  const joint = new THREE.Bone();
  joint.name = `mixamorig:${name}`;
  joint.position.copy(position);
  parent.add(joint);
  return joint;
};

const hips = bone("Hips", root, new THREE.Vector3(0, 1.01, 0));
const spine = bone("Spine", hips, new THREE.Vector3(0, 0.11, 0));
const spine1 = bone("Spine1", spine, new THREE.Vector3(0, 0.18, 0));
const spine2 = bone("Spine2", spine1, new THREE.Vector3(0, 0.19, 0));
const neck = bone("Neck", spine2, new THREE.Vector3(0, 0.2, 0));
const head = bone("Head", neck, new THREE.Vector3(0, 0.14, 0));

const leftShoulder = bone("LeftShoulder", spine2, new THREE.Vector3(0.19, 0.13, 0));
const leftArm = bone("LeftArm", leftShoulder, new THREE.Vector3(0.09, -0.02, 0));
const leftForeArm = bone("LeftForeArm", leftArm, new THREE.Vector3(0.27, -0.23, 0));
const leftHand = bone("LeftHand", leftForeArm, new THREE.Vector3(0.24, -0.22, 0));
const rightShoulder = bone("RightShoulder", spine2, new THREE.Vector3(-0.19, 0.13, 0));
const rightArm = bone("RightArm", rightShoulder, new THREE.Vector3(-0.09, -0.02, 0));
const rightForeArm = bone("RightForeArm", rightArm, new THREE.Vector3(-0.27, -0.23, 0));
const rightHand = bone("RightHand", rightForeArm, new THREE.Vector3(-0.24, -0.22, 0));

const leftUpLeg = bone("LeftUpLeg", hips, new THREE.Vector3(0.105, -0.03, 0));
const leftLeg = bone("LeftLeg", leftUpLeg, new THREE.Vector3(0.005, -0.45, 0));
const leftFoot = bone("LeftFoot", leftLeg, new THREE.Vector3(-0.005, -0.43, 0.018));
const leftToe = bone("LeftToeBase", leftFoot, new THREE.Vector3(0, -0.055, 0.14));
const rightUpLeg = bone("RightUpLeg", hips, new THREE.Vector3(-0.105, -0.03, 0));
const rightLeg = bone("RightLeg", rightUpLeg, new THREE.Vector3(-0.005, -0.45, 0));
const rightFoot = bone("RightFoot", rightLeg, new THREE.Vector3(0.005, -0.43, 0.018));
const rightToe = bone("RightToeBase", rightFoot, new THREE.Vector3(0, -0.055, 0.14));

const addMesh = (parent, geometry, material, name, position = new THREE.Vector3(), scale = new THREE.Vector3(1, 1, 1), rotation = new THREE.Euler()) => {
  const item = new THREE.Mesh(geometry, material);
  item.name = name;
  item.position.copy(position);
  item.scale.copy(scale);
  item.rotation.copy(rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
};

const segment = (parent, vector, radius, material, name, radialSegments = 10) => {
  const length = Math.max(vector.length(), radius * 2.2);
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), 4, radialSegments);
  const item = addMesh(parent, geometry, material, name);
  item.position.copy(vector).multiplyScalar(0.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize());
  return item;
};

addMesh(hips, new THREE.SphereGeometry(0.18, 16, 10), materials.trousers, "Pants_Hips", new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(1.05, 0.78, 0.75));
addMesh(spine1, new THREE.SphereGeometry(0.22, 18, 12), materials.sweater, "Sweater_Torso", new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(1.02, 1.16, 0.62));
addMesh(neck, new THREE.CylinderGeometry(0.062, 0.074, 0.15, 12), materials.sweater, "Turtleneck", new THREE.Vector3(0, 0.06, 0));

addMesh(spine1, new RoundedBoxGeometry(0.19, 0.54, 0.055, 3, 0.018), materials.coat, "Coat_LeftFront", new THREE.Vector3(0.105, 0.02, 0.135), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, -0.07, -0.015));
addMesh(spine1, new RoundedBoxGeometry(0.19, 0.54, 0.055, 3, 0.018), materials.coat, "Coat_RightFront", new THREE.Vector3(-0.105, 0.02, 0.135), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, 0.07, 0.015));
addMesh(spine1, new RoundedBoxGeometry(0.43, 0.57, 0.055, 3, 0.018), materials.coat, "Coat_Back", new THREE.Vector3(0, 0.01, -0.125));
addMesh(hips, new RoundedBoxGeometry(0.205, 0.5, 0.06, 3, 0.018), materials.coat, "Coat_SkirtLeft", new THREE.Vector3(0.108, 0.04, 0.1), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, -0.04, -0.01));
addMesh(hips, new RoundedBoxGeometry(0.205, 0.5, 0.06, 3, 0.018), materials.coat, "Coat_SkirtRight", new THREE.Vector3(-0.108, 0.04, 0.1), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, 0.04, 0.01));
addMesh(hips, new RoundedBoxGeometry(0.43, 0.5, 0.055, 3, 0.018), materials.coat, "Coat_SkirtBack", new THREE.Vector3(0, 0.04, -0.095));

addMesh(spine2, new RoundedBoxGeometry(0.075, 0.29, 0.025, 2, 0.008), materials.coat, "Lapel_Left", new THREE.Vector3(0.08, -0.03, 0.178), new THREE.Vector3(1, 1, 1), new THREE.Euler(0.18, 0, -0.42));
addMesh(spine2, new RoundedBoxGeometry(0.075, 0.29, 0.025, 2, 0.008), materials.coat, "Lapel_Right", new THREE.Vector3(-0.08, -0.03, 0.178), new THREE.Vector3(1, 1, 1), new THREE.Euler(0.18, 0, 0.42));
addMesh(spine1, new RoundedBoxGeometry(0.12, 0.095, 0.018, 2, 0.006), materials.coat, "Chest_Pocket", new THREE.Vector3(-0.115, 0.19, 0.17));
for (let index = 0; index < 3; index += 1) {
  addMesh(spine1, new THREE.CylinderGeometry(0.006, 0.006, 0.095, 7), index === 1 ? materials.red : materials.metal, `Pocket_Pen_${index + 1}`, new THREE.Vector3(-0.15 + index * 0.025, 0.27, 0.185));
}
for (const x of [-0.017, 0.017]) addMesh(spine1, new THREE.SphereGeometry(0.009, 7, 5), materials.metal, `Coat_Button_${x}`, new THREE.Vector3(x, 0.03 - x * 4, 0.185));

segment(leftArm, leftForeArm.position, 0.078, materials.coat, "Coat_LeftUpperSleeve");
segment(leftForeArm, leftHand.position, 0.068, materials.coat, "Coat_LeftLowerSleeve");
segment(rightArm, rightForeArm.position, 0.078, materials.coat, "Coat_RightUpperSleeve");
segment(rightForeArm, rightHand.position, 0.068, materials.coat, "Coat_RightLowerSleeve");
addMesh(leftHand, new THREE.SphereGeometry(0.075, 12, 9), materials.skin, "Hand_Left", new THREE.Vector3(0.045, -0.04, 0), new THREE.Vector3(0.72, 1.3, 0.6), new THREE.Euler(0, 0, -0.12));
addMesh(rightHand, new THREE.SphereGeometry(0.075, 12, 9), materials.skin, "Hand_Right", new THREE.Vector3(-0.045, -0.04, 0), new THREE.Vector3(0.72, 1.3, 0.6), new THREE.Euler(0, 0, 0.12));

segment(leftUpLeg, leftLeg.position, 0.105, materials.trousers, "Trousers_LeftThigh", 12);
segment(leftLeg, leftFoot.position, 0.092, materials.trousers, "Trousers_LeftCalf", 12);
segment(rightUpLeg, rightLeg.position, 0.105, materials.trousers, "Trousers_RightThigh", 12);
segment(rightLeg, rightFoot.position, 0.092, materials.trousers, "Trousers_RightCalf", 12);
addMesh(leftFoot, new RoundedBoxGeometry(0.175, 0.105, 0.33, 4, 0.035), materials.leather, "Boot_Left", new THREE.Vector3(0, -0.045, 0.105));
addMesh(rightFoot, new RoundedBoxGeometry(0.175, 0.105, 0.33, 4, 0.035), materials.leather, "Boot_Right", new THREE.Vector3(0, -0.045, 0.105));
addMesh(leftToe, new RoundedBoxGeometry(0.17, 0.035, 0.21, 3, 0.018), materials.leather, "BootSole_Left", new THREE.Vector3(0, -0.035, -0.02));
addMesh(rightToe, new RoundedBoxGeometry(0.17, 0.035, 0.21, 3, 0.018), materials.leather, "BootSole_Right", new THREE.Vector3(0, -0.035, -0.02));

addMesh(head, new THREE.SphereGeometry(0.12, 20, 15), materials.skin, "Head", new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0.83, 1.13, 0.82));
addMesh(head, new THREE.SphereGeometry(0.122, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), materials.hair, "Hair", new THREE.Vector3(0, 0.125, -0.006), new THREE.Vector3(0.86, 0.72, 0.85), new THREE.Euler(-0.08, 0, 0));
addMesh(head, new THREE.ConeGeometry(0.022, 0.065, 7), materials.skin, "Nose", new THREE.Vector3(0, 0.064, 0.101), new THREE.Vector3(0.75, 1, 0.85), new THREE.Euler(Math.PI / 2, 0, 0));
for (const x of [-0.043, 0.043]) {
  addMesh(head, new THREE.SphereGeometry(0.012, 8, 6), materials.eye, `Eye_${x < 0 ? "Right" : "Left"}`, new THREE.Vector3(x, 0.095, 0.101), new THREE.Vector3(1.1, 0.62, 0.42));
  addMesh(head, new RoundedBoxGeometry(0.055, 0.007, 0.008, 2, 0.003), materials.hair, `Brow_${x < 0 ? "Right" : "Left"}`, new THREE.Vector3(x, 0.125, 0.102), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, 0, x < 0 ? -0.12 : 0.12));
}
addMesh(head, new RoundedBoxGeometry(0.07, 0.007, 0.008, 2, 0.003), materials.hair, "Mouth", new THREE.Vector3(0, 0.018, 0.105));
addMesh(head, new THREE.SphereGeometry(0.028, 8, 6), materials.skin, "Ear_Left", new THREE.Vector3(0.102, 0.075, 0), new THREE.Vector3(0.55, 1.05, 0.45));
addMesh(head, new THREE.SphereGeometry(0.028, 8, 6), materials.skin, "Ear_Right", new THREE.Vector3(-0.102, 0.075, 0), new THREE.Vector3(0.55, 1.05, 0.45));

const rigBones = [
  hips, spine, spine1, spine2, neck, head,
  leftShoulder, leftArm, leftForeArm, leftHand,
  rightShoulder, rightArm, rightForeArm, rightHand,
  leftUpLeg, leftLeg, leftFoot, leftToe,
  rightUpLeg, rightLeg, rightFoot, rightToe,
];
const rigGeometry = new THREE.BufferGeometry();
rigGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 1, 0, 0.001, 1, 0, 0, 1.001, 0], 3));
rigGeometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4));
rigGeometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
rigGeometry.setIndex([0, 1, 2]);
const rigAnchor = new THREE.SkinnedMesh(rigGeometry, new THREE.MeshBasicMaterial({ name: "MAT_RigAnchor", transparent: true, opacity: 0, depthWrite: false }));
rigAnchor.name = "Deni_RigAnchor";
root.add(rigAnchor);
rigAnchor.bind(new THREE.Skeleton(rigBones));

root.updateMatrixWorld(true);

const quaternionValues = (values) => values.flatMap(([x, y, z]) => {
  const value = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  return [value.x, value.y, value.z, value.w];
});
const idle = new THREE.AnimationClip("Clinical_Idle", 4, [
  new THREE.QuaternionKeyframeTrack(`${spine2.uuid}.quaternion`, [0, 2, 4], quaternionValues([[0, 0, 0], [0.018, 0, 0.004], [0, 0, 0]])),
  new THREE.QuaternionKeyframeTrack(`${head.uuid}.quaternion`, [0, 2, 4], quaternionValues([[0.02, -0.025, 0], [0.015, 0.02, 0], [0.02, -0.025, 0]])),
]);

const gltfExporter = new GLTFExporter();
const glb = await gltfExporter.parseAsync(root, { binary: true, animations: [idle], onlyVisible: true });
await writeFile(path.join(output, "deni-doctor-rigged.glb"), Buffer.from(glb));

const objExporter = new OBJExporter();
const obj = objExporter.parse(root);
await writeFile(path.join(output, "deni-doctor-mixamo.obj"), `mtllib deni-doctor.mtl\n${obj}`);

const materialTexture = {
  MAT_Skin: "skin.png",
  MAT_Hair: "hair.png",
  MAT_Coat: "coat.png",
  MAT_Sweater: "sweater.png",
  MAT_Trousers: "trousers.png",
  MAT_Leather: "leather.png",
  MAT_Eyes: "hair.png",
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
  MAT_Metal: "0.37 0.38 0.36",
  MAT_PenRed: "0.44 0.13 0.11",
};
const mtl = Object.entries(materialTexture).map(([name, texture]) => `newmtl ${name}\nKa 0.08 0.08 0.08\nKd ${materialColor[name]}\nKs 0.04 0.04 0.04\nNs 12\nd 1\nillum 2\nmap_Kd textures/${texture}\n`).join("\n");
await writeFile(path.join(output, "deni-doctor.mtl"), mtl);

await writeFile(path.join(output, "README.txt"), `DENI / DOCTOR CHARACTER ASSET — VEO ZAVOD\n\nFILES\n- deni-doctor-rigged.glb: browser-ready humanoid hierarchy with a subtle idle clip.\n- deni-doctor-mixamo.obj: neutral A-pose source for Mixamo auto-rigging.\n- deni-doctor.mtl + textures/: material package for the OBJ.\n\nSCALE AND AXES\n- Real-world scale, approximately 1.83 m.\n- Y up, Z forward.\n- Origin at ground centre.\n\nMIXAMO ROUTE\n1. Upload the provided ZIP or the OBJ together with its MTL and textures.\n2. Place the chin, wrists, elbows, knees and groin markers.\n3. Choose “No Fingers” for the current low-poly hand topology.\n4. Export FBX for Unity with skin.\n\nThe GLB uses a standard mixamorig-style named hierarchy and rigid low-poly clothing sections. It is intended as a PS2-era production model and a safe first playable asset, not a scan-quality digital double.\n`);

console.log(`Generated Deni asset package in ${output}`);
