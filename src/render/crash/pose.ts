// Converts crash bodies (track-relative poses) to world matrices.
import * as THREE from 'three';
import type { CrashBody } from '../../sim/crash/crashSim';
import type { Track } from '../../sim/track/track';
import { frameAt, headingAt } from '../trackMesh';

const pos = new THREE.Vector3();
const shift = new THREE.Vector3();
const scale = new THREE.Vector3();
const quat = new THREE.Quaternion();
const euler = new THREE.Euler(0, 0, 0, 'YZX');

/** Orientation of a body: world heading minus its yaw (yaw + = toward the right). */
export function bodyQuaternion(
  track: Track,
  b: CrashBody,
  out: THREE.Quaternion,
): THREE.Quaternion {
  const grade = Math.atan(track.gradeAt(b.s)) * Math.cos(b.yaw);
  euler.set(b.roll, headingAt(track, b.s) - b.yaw, b.pitch + grade);
  return out.setFromEuler(euler);
}

/**
 * World matrix of a body. Crumpled ends are drawn by squashing the body along its length and
 * moving its centre toward the intact end.
 */
export function bodyMatrix(track: Track, b: CrashBody, out: THREE.Matrix4): THREE.Matrix4 {
  frameAt(track, b.s, b.y, b.z, pos);
  bodyQuaternion(track, b, quat);
  const crushed = b.crushFront + b.crushRear;
  shift.set((b.crushRear - b.crushFront) / 2, 0, 0).applyQuaternion(quat);
  pos.add(shift);
  scale.set(Math.max(0.3, (b.lengthM - crushed) / b.lengthM), 1, 1);
  return out.compose(pos, quat, scale);
}

/** World position of a point in a body's local frame (x along it, y up). */
export function bodyPoint(
  track: Track,
  b: CrashBody,
  lx: number,
  ly: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  frameAt(track, b.s, b.y, b.z, out);
  bodyQuaternion(track, b, quat);
  return out.add(shift.set(lx, ly, 0).applyQuaternion(quat));
}
