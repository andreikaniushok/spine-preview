import {
  Animation,
  AnimationState,
  AnimationStateData,
  Attachment,
  BlendMode,
  ClippingAttachment,
  IkConstraintTimeline,
  MeshAttachment,
  PathConstraintMixTimeline,
  PathConstraintPositionTimeline,
  PathConstraintSpacingTimeline,
  Physics,
  RegionAttachment,
  Skeleton,
  SkeletonData,
  TransformConstraintTimeline,
  VertexAttachment,
} from "@esotericsoftware/spine-core";

export type ImpactLevel = "Minimal" | "Low" | "Moderate" | "High";

export interface PerAnimationSummaryRow {
  name: string;
  durationSec: number;
  renderImpact: ImpactLevel;
  computeImpact: ImpactLevel;
  activeFeatures: string;
}

export interface PerAnimationMeshRow {
  animation: string;
  activeMeshes: number;
  totalVertices: number;
  deformedVertices: number;
  weightedBoneRefs: number;
  renderImpact: ImpactLevel;
}

export interface GlobalMeshRow {
  slotName: string;
  vertices: number;
  deformed: boolean;
  boneWeights: number;
  hasParentMesh: boolean;
}

export interface ClippingAnimRow {
  animation: string;
  hasClipping: boolean;
  activeMasks: number;
  clipVertices: number;
  impact: ImpactLevel;
}

export interface BlendAnimRow {
  animation: string;
  hasBlendModes: boolean;
  maxNonNormal: number;
  maxAdditive: number;
  maxMultiply: number;
  impact: ImpactLevel;
}

export interface ConstraintAnimRow {
  animation: string;
  physics: string;
  ik: string;
  transform: string;
  path: string;
  totalActive: number;
  impact: ImpactLevel;
}

export interface TransformConstraintRow {
  name: string;
  targetBone: string;
  boneCount: number;
  mixSummary: string;
  status: string;
}

export interface ConstraintTypeBreakdown {
  type: string;
  count: number;
  /** Share of all constraint definitions in skeleton data (count / total * 100). */
  percentOfTotal: number;
}

export interface SpinePerformanceReport {
  skeletonName: string | null;
  boneCount: number;
  maxBoneDepth: number;
  animationCount: number;
  skinCount: number;
  renderingImpact: ImpactLevel;
  peakVerticesSampled: number;
  computeImpact: ImpactLevel;
  totalWeightedBoneRefsWorst: number;
  constraintCountData: number;
  animationsWithPhysics: number;
  animationsWithClipping: number;
  animationsWithSpecialBlend: number;
  perAnimation: PerAnimationSummaryRow[];
  perAnimationMeshes: PerAnimationMeshRow[];
  globalMeshTop: GlobalMeshRow[];
  globalMeshTotalSlots: number;
  clippingRows: ClippingAnimRow[];
  blendRows: BlendAnimRow[];
  constraintAnimRows: ConstraintAnimRow[];
  transformConstraintDetails: TransformConstraintRow[];
  constraintBreakdown: ConstraintTypeBreakdown[];
}

export function impactFromVertices(v: number): ImpactLevel {
  if (v < 400) return "Minimal";
  if (v < 1200) return "Low";
  if (v < 4000) return "Moderate";
  return "High";
}

function impactFromWeighted(w: number): ImpactLevel {
  if (w < 80) return "Minimal";
  if (w < 400) return "Low";
  if (w < 2000) return "Moderate";
  return "High";
}

export function impactFromConstraints(n: number): ImpactLevel {
  if (n <= 2) return "Minimal";
  if (n <= 8) return "Low";
  if (n <= 20) return "Moderate";
  return "High";
}

function maxBoneDepthFromData(skeleton: Skeleton): number {
  let max = 0;
  for (const bone of skeleton.bones) {
    let d = 0;
    let b: typeof bone | null = bone;
    while (b) {
      d++;
      b = b.parent;
    }
    max = Math.max(max, d);
  }
  return max;
}

/** Uniform time samples (~30 Hz, capped) so per-animation peaks reflect the pose over time. */
function sampleTimes(duration: number): number[] {
  if (duration <= 0) {
    return [0];
  }
  const minSamples = 12;
  const maxSamples = 72;
  const stepSec = 1 / 45;
  const n = Math.min(maxSamples, Math.max(minSamples, Math.ceil(duration / stepSec) + 1));
  const raw: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i / (n - 1)) * duration;
    raw.push(Math.min(Math.max(0, t), duration - 1e-6));
  }
  return [...new Set(raw)].sort((a, b) => a - b);
}

function isPhysicsTimeline(t: object): boolean {
  const n = t.constructor.name;
  return n.startsWith("PhysicsConstraint") && n !== "PhysicsConstraintTimeline";
}

function animationUsesPhysics(anim: Animation): boolean {
  return anim.timelines.some((t) => isPhysicsTimeline(t));
}

function animationUsesIk(anim: Animation): boolean {
  return anim.timelines.some((t) => t instanceof IkConstraintTimeline);
}

function animationUsesTransform(anim: Animation): boolean {
  return anim.timelines.some((t) => t instanceof TransformConstraintTimeline);
}

function animationTransformConstraintCount(anim: Animation): number {
  const seen = new Set<number>();
  for (const t of anim.timelines) {
    if (t instanceof TransformConstraintTimeline) {
      seen.add(t.constraintIndex);
    }
  }
  return seen.size;
}

function animationUsesPath(anim: Animation): boolean {
  return anim.timelines.some(
    (t) =>
      t instanceof PathConstraintPositionTimeline ||
      t instanceof PathConstraintSpacingTimeline ||
      t instanceof PathConstraintMixTimeline,
  );
}

function animationIkConstraintCount(anim: Animation): number {
  const seen = new Set<number>();
  for (const t of anim.timelines) {
    if (t instanceof IkConstraintTimeline) {
      seen.add(t.constraintIndex);
    }
  }
  return seen.size;
}

function animationPhysicsConstraintCount(anim: Animation, data: SkeletonData): number {
  const seen = new Set<number>();
  const addAllPhysics = () => {
    for (let i = 0; i < data.physicsConstraints.length; i++) {
      seen.add(i);
    }
  };
  for (const t of anim.timelines) {
    if (!isPhysicsTimeline(t) || !("constraintIndex" in t)) {
      continue;
    }
    const idx = (t as { constraintIndex: number }).constraintIndex;
    if (idx < 0) {
      addAllPhysics();
    } else {
      seen.add(idx);
    }
  }
  return seen.size;
}

function transformConstraintAnimatedIndices(data: SkeletonData): Set<number> {
  const driven = new Set<number>();
  for (const anim of data.animations) {
    for (const t of anim.timelines) {
      if (t instanceof TransformConstraintTimeline) {
        driven.add(t.constraintIndex);
      }
    }
  }
  return driven;
}

function animationPathConstraintCount(anim: Animation): number {
  const seen = new Set<number>();
  for (const t of anim.timelines) {
    if (
      t instanceof PathConstraintPositionTimeline ||
      t instanceof PathConstraintSpacingTimeline ||
      t instanceof PathConstraintMixTimeline
    ) {
      seen.add(t.constraintIndex);
    }
  }
  return seen.size;
}

function countWeightedBoneRefs(att: VertexAttachment): number {
  const bones = att.bones;
  if (!bones || bones.length === 0) {
    return 0;
  }
  let idx = 0;
  let refs = 0;
  while (idx < bones.length) {
    const n = bones[idx]!;
    idx += 1;
    refs += n;
    idx += n;
  }
  return refs;
}

function attachmentVertexCount(att: Attachment): number {
  if (att instanceof RegionAttachment) {
    return 4;
  }
  if (att instanceof MeshAttachment) {
    return att.worldVerticesLength / 2;
  }
  if (att instanceof ClippingAttachment) {
    return att.worldVerticesLength / 2;
  }
  return 0;
}

function isRenderableMesh(att: Attachment | null): att is RegionAttachment | MeshAttachment {
  return att instanceof RegionAttachment || att instanceof MeshAttachment;
}

interface PoseStats {
  activeMeshes: number;
  totalVertices: number;
  deformedVertices: number;
  weightedBoneRefs: number;
  clippingActive: boolean;
  activeClippingMasks: number;
  clipVertices: number;
  blendNonNormal: number;
  blendAdditive: number;
  blendMultiply: number;
}

function collectPoseStats(skeleton: Skeleton): PoseStats {
  let activeMeshes = 0;
  let totalVertices = 0;
  let deformedVertices = 0;
  let weightedBoneRefs = 0;
  let clippingActive = false;
  let activeClippingMasks = 0;
  let clipVertices = 0;
  let blendNonNormal = 0;
  let blendAdditive = 0;
  let blendMultiply = 0;

  for (const slot of skeleton.drawOrder) {
    const att = slot.getAttachment();
    if (!att) {
      continue;
    }
    if (att instanceof ClippingAttachment) {
      clippingActive = true;
      activeClippingMasks++;
      clipVertices += att.worldVerticesLength / 2;
      continue;
    }
    if (!isRenderableMesh(att)) {
      continue;
    }
    activeMeshes++;
    totalVertices += attachmentVertexCount(att);
    if (att instanceof VertexAttachment) {
      if (slot.deform.length > 0) {
        deformedVertices += att.worldVerticesLength / 2;
      }
      weightedBoneRefs += countWeightedBoneRefs(att);
    }
    if (slot.data.blendMode === BlendMode.Additive) {
      blendAdditive++;
    } else if (slot.data.blendMode === BlendMode.Multiply) {
      blendMultiply++;
    } else if (slot.data.blendMode !== BlendMode.Normal) {
      blendNonNormal++;
    }
  }

  return {
    activeMeshes,
    totalVertices,
    deformedVertices,
    weightedBoneRefs,
    clippingActive,
    activeClippingMasks,
    clipVertices,
    blendNonNormal,
    blendAdditive,
    blendMultiply,
  };
}

function maxPoseStatsAcrossSamples(
  skeleton: Skeleton,
  state: AnimationState,
  animName: string,
  duration: number,
): PoseStats {
  const times = sampleTimes(duration);
  const agg: PoseStats = {
    activeMeshes: 0,
    totalVertices: 0,
    deformedVertices: 0,
    weightedBoneRefs: 0,
    clippingActive: false,
    activeClippingMasks: 0,
    clipVertices: 0,
    blendNonNormal: 0,
    blendAdditive: 0,
    blendMultiply: 0,
  };

  for (const t of times) {
    skeleton.setToSetupPose();
    skeleton.setSlotsToSetupPose();
    state.clearTracks();
    const entry = state.setAnimation(0, animName, false)!;
    entry.mixDuration = 0;
    entry.trackTime = t;
    entry.animationLast = -1;
    state.apply(skeleton);
    const current = state.getCurrent(0);
    if (current) {
      skeleton.time = current.getAnimationTime();
    }
    skeleton.updateWorldTransform(Physics.update);
    const cur = collectPoseStats(skeleton);
    agg.activeMeshes = Math.max(agg.activeMeshes, cur.activeMeshes);
    agg.totalVertices = Math.max(agg.totalVertices, cur.totalVertices);
    agg.deformedVertices = Math.max(agg.deformedVertices, cur.deformedVertices);
    agg.weightedBoneRefs = Math.max(agg.weightedBoneRefs, cur.weightedBoneRefs);
    agg.clipVertices = Math.max(agg.clipVertices, cur.clipVertices);
    agg.activeClippingMasks = Math.max(agg.activeClippingMasks, cur.activeClippingMasks);
    agg.clippingActive = agg.clippingActive || cur.clippingActive;
    agg.blendAdditive = Math.max(agg.blendAdditive, cur.blendAdditive);
    agg.blendMultiply = Math.max(agg.blendMultiply, cur.blendMultiply);
    agg.blendNonNormal = Math.max(agg.blendNonNormal, cur.blendNonNormal);
  }
  return agg;
}

function buildGlobalMeshTop(skeleton: Skeleton, limit: number): GlobalMeshRow[] {
  const skin = skeleton.skin ?? skeleton.data.defaultSkin;
  if (!skin) {
    return [];
  }
  const rows: GlobalMeshRow[] = [];
  for (const entry of skin.getAttachments()) {
    if (!(entry.attachment instanceof MeshAttachment)) {
      continue;
    }
    const att = entry.attachment;
    const slotName = skeleton.data.slots[entry.slotIndex]?.name ?? `slot_${entry.slotIndex}`;
    const parent = att.getParentMesh();
    rows.push({
      slotName: entry.name === slotName ? slotName : `${slotName} / ${entry.name}`,
      vertices: att.worldVerticesLength / 2,
      deformed: false,
      boneWeights: countWeightedBoneRefs(att),
      hasParentMesh: parent !== null,
    });
  }
  rows.sort((a, b) => b.vertices - a.vertices);
  return rows.slice(0, limit);
}

function activeFeaturesText(anim: Animation, pose: PoseStats): string {
  const parts: string[] = [];
  if (animationUsesPhysics(anim)) parts.push("Physics");
  if (pose.clippingActive) parts.push("Clipping");
  if (pose.blendAdditive > 0 || pose.blendMultiply > 0 || pose.blendNonNormal > 0) {
    parts.push("Blend");
  }
  if (animationUsesIk(anim)) parts.push("IK");
  if (animationUsesTransform(anim)) parts.push("Transform");
  if (animationUsesPath(anim)) parts.push("Path");
  return parts.length ? parts.join(", ") : "None";
}

export function buildSpinePerformanceReport(source: Skeleton): SpinePerformanceReport {
  const data = source.data;
  const skeleton = new Skeleton(data);
  if (source.skin) {
    skeleton.setSkin(source.skin);
  } else {
    skeleton.setSkin(data.defaultSkin);
  }
  skeleton.setSlotsToSetupPose();
  skeleton.setBonesToSetupPose();
  skeleton.updateCache();

  const stateData = new AnimationStateData(data);
  const state = new AnimationState(stateData);

  const boneCount = skeleton.bones.length;
  const maxBoneDepth = maxBoneDepthFromData(skeleton);
  const animationCount = data.animations.length;
  const skinCount = data.skins.length;

  const ikD = data.ikConstraints.length;
  const trD = data.transformConstraints.length;
  const pathD = data.pathConstraints.length;
  const physD = data.physicsConstraints.length;
  const constraintCountData = ikD + trD + pathD + physD;

  const perAnimationMeshes: PerAnimationMeshRow[] = [];
  const perAnimation: PerAnimationSummaryRow[] = [];
  const clippingRows: ClippingAnimRow[] = [];
  const blendRows: BlendAnimRow[] = [];
  const constraintAnimRows: ConstraintAnimRow[] = [];

  let peakVertices = 0;
  let worstWeighted = 0;
  let worstDeformedVertices = 0;

  let animationsWithPhysics = 0;
  let animationsWithClipping = 0;
  let animationsWithSpecialBlend = 0;

  for (const anim of data.animations) {
    const pose = maxPoseStatsAcrossSamples(skeleton, state, anim.name, anim.duration);
    peakVertices = Math.max(peakVertices, pose.totalVertices);
    worstWeighted = Math.max(worstWeighted, pose.weightedBoneRefs);
    worstDeformedVertices = Math.max(worstDeformedVertices, pose.deformedVertices);

    if (animationUsesPhysics(anim)) animationsWithPhysics++;
    if (pose.clippingActive) animationsWithClipping++;
    if (pose.blendAdditive > 0 || pose.blendMultiply > 0 || pose.blendNonNormal > 0) {
      animationsWithSpecialBlend++;
    }

    const ri = impactFromVertices(pose.totalVertices);
    const ci = impactFromWeighted(pose.weightedBoneRefs + pose.deformedVertices);

    perAnimation.push({
      name: anim.name,
      durationSec: anim.duration,
      renderImpact: ri,
      computeImpact: ci,
      activeFeatures: activeFeaturesText(anim, pose),
    });

    perAnimationMeshes.push({
      animation: anim.name,
      activeMeshes: pose.activeMeshes,
      totalVertices: pose.totalVertices,
      deformedVertices: pose.deformedVertices,
      weightedBoneRefs: pose.weightedBoneRefs,
      renderImpact: ri,
    });

    clippingRows.push({
      animation: anim.name,
      hasClipping: pose.clippingActive,
      activeMasks: pose.activeClippingMasks,
      clipVertices: pose.clipVertices,
      impact: impactFromVertices(pose.clipVertices),
    });

    blendRows.push({
      animation: anim.name,
      hasBlendModes: pose.blendAdditive > 0 || pose.blendMultiply > 0 || pose.blendNonNormal > 0,
      maxNonNormal: pose.blendNonNormal,
      maxAdditive: pose.blendAdditive,
      maxMultiply: pose.blendMultiply,
      impact:
        pose.blendAdditive + pose.blendMultiply + pose.blendNonNormal > 0 ? "Low" : "Minimal",
    });

    const tc = animationTransformConstraintCount(anim);
    const pc = animationPathConstraintCount(anim);
    const ikC = animationIkConstraintCount(anim);
    const phC = animationPhysicsConstraintCount(anim, data);
    const totalActive = tc + pc + ikC + phC;

    constraintAnimRows.push({
      animation: anim.name,
      physics: phC > 0 ? `Yes (${phC})` : "-",
      ik: ikC > 0 ? `Yes (${ikC})` : "-",
      transform: tc > 0 ? `Yes (${tc})` : "-",
      path: pc > 0 ? `Yes (${pc})` : "-",
      totalActive,
      impact: impactFromConstraints(totalActive),
    });
  }

  const globalMeshTop = buildGlobalMeshTop(skeleton, 10);
  const skinForCount = skeleton.skin ?? skeleton.data.defaultSkin;
  let meshSlotCount = 0;
  if (skinForCount) {
    for (const entry of skinForCount.getAttachments()) {
      if (entry.attachment instanceof MeshAttachment) {
        meshSlotCount++;
      }
    }
  }

  const transformAnimated = transformConstraintAnimatedIndices(data);
  const transformConstraintDetails: TransformConstraintRow[] = data.transformConstraints.map(
    (c, index) => {
      const target = c.target?.name ?? "-";
      const mix =
        `Rotate: ${c.mixRotate.toFixed(2)}, X: ${c.mixX.toFixed(2)}, Y: ${c.mixY.toFixed(2)}, ` +
        `ScaleX: ${c.mixScaleX.toFixed(2)}, ScaleY: ${c.mixScaleY.toFixed(2)}, ShearY: ${c.mixShearY.toFixed(2)}`;
      return {
        name: c.name,
        targetBone: target,
        boneCount: c.bones.length,
        mixSummary: mix,
        status: transformAnimated.has(index) ? "Keyed in animation" : "Setup data only",
      };
    },
  );

  const share = (count: number) =>
    constraintCountData > 0 ? Math.round((count / constraintCountData) * 1000) / 10 : 0;

  const constraintBreakdown: ConstraintTypeBreakdown[] = [
    {
      type: "IK constraints",
      count: ikD,
      percentOfTotal: share(ikD),
    },
    {
      type: "Transform constraints",
      count: trD,
      percentOfTotal: share(trD),
    },
    {
      type: "Path constraints",
      count: pathD,
      percentOfTotal: share(pathD),
    },
    {
      type: "Physics constraints",
      count: physD,
      percentOfTotal: share(physD),
    },
  ];

  const renderingImpact = impactFromVertices(peakVertices);
  const computeImpact = impactFromWeighted(
    worstWeighted + worstDeformedVertices + constraintCountData,
  );

  return {
    skeletonName: data.name,
    boneCount,
    maxBoneDepth,
    animationCount,
    skinCount,
    renderingImpact,
    peakVerticesSampled: peakVertices,
    computeImpact,
    totalWeightedBoneRefsWorst: worstWeighted,
    constraintCountData,
    animationsWithPhysics,
    animationsWithClipping,
    animationsWithSpecialBlend,
    perAnimation,
    perAnimationMeshes,
    globalMeshTop,
    globalMeshTotalSlots: meshSlotCount,
    clippingRows,
    blendRows,
    constraintAnimRows,
    transformConstraintDetails,
    constraintBreakdown,
  };
}

export function summarizeImpactForCompare(level: ImpactLevel): number {
  switch (level) {
    case "Minimal":
      return 1;
    case "Low":
      return 2;
    case "Moderate":
      return 3;
    case "High":
      return 4;
    default:
      return 0;
  }
}
