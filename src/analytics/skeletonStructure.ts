import type { Skeleton } from "@esotericsoftware/spine-core";

export interface BoneAnchorRow {
  name: string;
  parent: string | null;
  length: number;
  /** No child bones — common place to parent floating text / UI. */
  isLeaf: boolean;
}

export interface SkeletonStructureStats {
  name: string | null;
  bones: number;
  slots: number;
  constraints: number;
  animations: number;
  skins: number;
  /** All bones usable as a transform parent for text / UI. */
  boneAnchors: BoneAnchorRow[];
}

export function buildSkeletonStructureStats(skeleton: Skeleton): SkeletonStructureStats {
  const data = skeleton.data;
  const constraints =
    data.ikConstraints.length +
    data.transformConstraints.length +
    data.pathConstraints.length +
    (data.physicsConstraints?.length ?? 0);

  const childCounts = new Map<string, number>();
  for (const bone of data.bones) {
    const parentName = bone.parent?.name ?? null;
    if (parentName) {
      childCounts.set(parentName, (childCounts.get(parentName) ?? 0) + 1);
    }
  }

  const boneAnchors: BoneAnchorRow[] = data.bones.map((bone) => ({
    name: bone.name,
    parent: bone.parent?.name ?? null,
    length: Math.round(bone.length * 100) / 100,
    isLeaf: (childCounts.get(bone.name) ?? 0) === 0,
  }));

  return {
    name: data.name || null,
    bones: data.bones.length,
    slots: data.slots.length,
    constraints,
    animations: data.animations.length,
    skins: data.skins.length,
    boneAnchors,
  };
}
