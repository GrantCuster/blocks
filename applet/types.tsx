export type PointType = {
  x: number;
  y: number;
};

export type CameraType = {
  x: number;
  y: number;
  z: number;
};

export type ModeType = "move" | "segment" | "render" | "prompt";

export type BaseBlockType = {
  id: string;
  type: "image" | "prompt" | "render";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

export type ImageBlockType = BaseBlockType & {
  type: "image";
  src: string;
};
export type RenderBlockType = BaseBlockType & {
  type: "render";
  prompt: string;
};
export type PromptBlockType = BaseBlockType & {
  type: "prompt";
  text: string;
  editing: boolean;
};

export type BlockType = ImageBlockType | RenderBlockType | PromptBlockType;

export type StateRefType = {
  camera: CameraType;
  blockIds: string[];
  blockMap: Record<string, BlockType>;
  mode: ModeType;
  zoomContainer: HTMLDivElement | null;
  selectedBlockIds: string[];
  blockSelector: { x: number; y: number; width: number; height: number } | null;
}
