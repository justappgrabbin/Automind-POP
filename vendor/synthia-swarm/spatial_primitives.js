// Pure operations adapted from Morph3D v17's pivot transform and proximity check.
export const isPoint3 = value => Array.isArray(value) && value.length === 3
  && [...value].every(Number.isFinite);

export const spatialPrimitives = [
  // GameEngineX advances position by velocity times elapsed time. The host supplies terrain rules separately.
  { id: "advancePosition3", inputs: { position: "point3", velocity: "point3", seconds: "number" }, output: "point3",
    run: ({ position, velocity, seconds }) =>
      position.map((coordinate, axis) => coordinate + velocity[axis] * seconds) },
  { id: "rotateAboutY", inputs: { point: "point3", pivot: "point3", radians: "number" }, output: "point3",
    run: ({ point, pivot, radians }) => {
      const x = point[0] - pivot[0], z = point[2] - pivot[2];
      const cos = Math.cos(radians), sin = Math.sin(radians);
      return [pivot[0] + x * cos - z * sin, point[1], pivot[2] + x * sin + z * cos];
    } },
  { id: "distanceSquared3", inputs: { left: "point3", right: "point3" }, output: "number",
    run: ({ left, right }) => left.reduce((sum, component, axis) => sum + (component - right[axis]) ** 2, 0) },
];
