import { BlockType, PointType } from "./types";

// load image as promise
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function makeZIndex() {
  return Math.round((Date.now() - 1729536285367) / 100);
}

export function pointIntersectBlocks({ x, y }: PointType, blocks: BlockType[]) {
  return blocks.filter((block) => {
    return (
      x >= block.x &&
      x <= block.x + block.width &&
      y >= block.y &&
      y <= block.y + block.height
    );
  });
}

// TODO make this work
export function blockIntersectBlocks(
  { x, y, width, height }: BlockType,
  blocks: BlockType[],
) {
  return blocks.filter((block) => {
    return (
      x < block.x + block.width &&
      x + width > block.x &&
      y < block.y + block.height &&
      y + height > block.y
    );
  });
}
