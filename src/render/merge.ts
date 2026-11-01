import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Merge a group's single-material child meshes into one mesh per material (draw-call saver).
 * Meshes with material arrays, sprites, lights and anything flagged `userData.keep` stay as-is.
 */
export function mergeByMaterial(group: THREE.Group, castShadow = true): void {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const remove: THREE.Object3D[] = [];
  group.traverse((o) => {
    if (o === group || !(o instanceof THREE.Mesh) || o.userData['keep']) return;
    if (Array.isArray(o.material)) return;
    const geo = (o.geometry as THREE.BufferGeometry).clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (geo.index) {
      const ni = geo.toNonIndexed();
      geo.dispose();
      bucketPush(buckets, o.material, ni);
    } else bucketPush(buckets, o.material, geo);
    remove.push(o);
  });
  for (const o of remove) o.parent?.remove(o);
  for (const [mat, geos] of buckets) {
    const merged = mergeGeometries(geos.map(stripToCommon));
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function bucketPush(
  b: Map<THREE.Material, THREE.BufferGeometry[]>,
  m: THREE.Material,
  g: THREE.BufferGeometry,
): void {
  const list = b.get(m);
  if (list) list.push(g);
  else b.set(m, [g]);
}

/** Keep only position/normal/uv so geometries from different primitives can merge. */
function stripToCommon(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.clearGroups();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  }
  if (!g.attributes['uv']) {
    const n = g.attributes['position']!.count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  }
  return g;
}
