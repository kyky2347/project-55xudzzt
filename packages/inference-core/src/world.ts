import { SeededRng } from "./rng";
import type { Facility, Position } from "./types";

export function indexOf(world: Pick<Facility, "width">, position: Position): number {
  return position.y * world.width + position.x;
}

export function inBounds(world: Pick<Facility, "width" | "height">, position: Position): boolean {
  return position.x >= 0 && position.y >= 0 && position.x < world.width && position.y < world.height;
}

export function isFloor(world: Facility, position: Position): boolean {
  return inBounds(world, position) && world.cells[indexOf(world, position)] === 1;
}

export function neighbors(world: Facility, position: Position): Position[] {
  return [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 },
  ].filter((candidate) => isFloor(world, candidate));
}

function carve(cells: number[], width: number, x: number, y: number): void {
  if (x > 0 && y > 0 && x < width - 1 && y < width - 1) cells[y * width + x] = 1;
}

export function floorPositions(world: Facility): Position[] {
  const result: Position[] = [];
  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) if (world.cells[y * world.width + x] === 1) result.push({ x, y });
  }
  return result;
}

export function distancesFrom(world: Facility, start: Position): Map<number, number> {
  const distances = new Map<number, number>([[indexOf(world, start), 0]]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor] as Position;
    const distance = distances.get(indexOf(world, current)) ?? 0;
    for (const next of neighbors(world, current)) {
      const index = indexOf(world, next);
      if (!distances.has(index)) {
        distances.set(index, distance + 1);
        queue.push(next);
      }
    }
  }
  return distances;
}

function farthestAvailable(world: Facility, origin: Position, used: Set<number>, rng: SeededRng, fraction = 0.62): Position {
  const distances = [...distancesFrom(world, origin).entries()]
    .filter(([index]) => !used.has(index))
    .sort((a, b) => b[1] - a[1]);
  const pool = distances.slice(0, Math.max(1, Math.floor(distances.length * (1 - fraction))));
  const [index] = rng.pick(pool);
  return { x: index % world.width, y: Math.floor(index / world.width) };
}

export function generateFacility(seed: string, size = 48): Facility {
  const rng = new SeededRng(`${seed}:facility`);
  const cells = new Array<number>(size * size).fill(0);
  let x = Math.floor(size / 2);
  let y = Math.floor(size / 2);
  carve(cells, size, x, y);

  const target = Math.floor(size * size * 0.42);
  let carved = 1;
  let guard = 0;
  while (carved < target && guard < size * size * 30) {
    guard += 1;
    const direction = rng.int(0, 3);
    if (direction === 0) x += 1;
    if (direction === 1) x -= 1;
    if (direction === 2) y += 1;
    if (direction === 3) y -= 1;
    x = Math.max(2, Math.min(size - 3, x));
    y = Math.max(2, Math.min(size - 3, y));
    const index = y * size + x;
    if (cells[index] === 0) {
      cells[index] = 1;
      carved += 1;
    }
    if (rng.next() < 0.055) {
      const roomWidth = rng.int(3, 7);
      const roomHeight = rng.int(3, 6);
      for (let ry = -Math.floor(roomHeight / 2); ry <= Math.floor(roomHeight / 2); ry += 1) {
        for (let rx = -Math.floor(roomWidth / 2); rx <= Math.floor(roomWidth / 2); rx += 1) {
          const before = cells[(y + ry) * size + x + rx];
          carve(cells, size, x + rx, y + ry);
          if (before === 0 && cells[(y + ry) * size + x + rx] === 1) carved += 1;
        }
      }
    }
  }

  const provisional = { width: size, height: size, cells } as Facility;
  const floors = floorPositions(provisional);
  const start = rng.pick(floors);
  const used = new Set<number>([indexOf(provisional, start)]);
  const hunterStart = farthestAvailable(provisional, start, used, rng, 0.8);
  used.add(indexOf(provisional, hunterStart));
  const cores = Array.from({ length: 3 }, () => {
    const core = farthestAvailable(provisional, start, used, rng, 0.55);
    used.add(indexOf(provisional, core));
    return core;
  });
  const extraction = farthestAvailable(provisional, cores[2] as Position, used, rng, 0.7);
  used.add(indexOf(provisional, extraction));
  const beacons = Array.from({ length: 3 }, () => {
    const beacon = rng.pick(floors.filter((position) => !used.has(indexOf(provisional, position))));
    used.add(indexOf(provisional, beacon));
    return beacon;
  });
  const recharge = [rng.pick(floors.filter((position) => !used.has(indexOf(provisional, position))))];

  return { ...provisional, start, hunterStart, cores, extraction, beacons, recharge };
}

export function rayDistance(world: Facility, origin: Position, dx: number, dy: number, max = 16): number {
  for (let distance = 1; distance <= max; distance += 1) {
    if (!isFloor(world, { x: origin.x + dx * distance, y: origin.y + dy * distance })) return distance - 0.5;
  }
  return max;
}

export function shortestPath(world: Facility, start: Position, target: Position): Position[] {
  const startIndex = indexOf(world, start);
  const targetIndex = indexOf(world, target);
  const cameFrom = new Map<number, number>([[startIndex, -1]]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor] as Position;
    if (indexOf(world, current) === targetIndex) break;
    for (const next of neighbors(world, current)) {
      const index = indexOf(world, next);
      if (!cameFrom.has(index)) {
        cameFrom.set(index, indexOf(world, current));
        queue.push(next);
      }
    }
  }
  if (!cameFrom.has(targetIndex)) return [start];
  const path: Position[] = [];
  let cursor = targetIndex;
  while (cursor !== -1) {
    path.push({ x: cursor % world.width, y: Math.floor(cursor / world.width) });
    cursor = cameFrom.get(cursor) ?? -1;
  }
  return path.reverse();
}
