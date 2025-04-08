import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { BlockType, ModeType, StateRefType } from "./types";
import { defaultRenderPrompt } from "./consts";
import { v4 as uuid } from "uuid";

export const CameraAtom = atom({
  x: 0,
  y: 0,
  z: 1,
});

export const ZoomContainerAtom = atom<HTMLDivElement | null>(null);

export const ModeAtom = atom<ModeType>("move");

export const RenderPromptAtom = atomWithStorage<string>(
  "render-prompt-3",
  defaultRenderPrompt,
);

const starterBlocks = [
  {
    id: uuid(),
    type: "render",
    x: -300,
    y: -200,
    width: 600,
    height: 400,
  },
  {
    id: uuid(),
    type: "image",
    src: "/cat.jpg",
    x: -400,
    y: -400,
    width: 400,
    height: 300,
  },
  {
    id: uuid(),
    type: "image",
    src: "/pumpkins.jpg",
    x: 200,
    y: -400,
    width: 400,
    height: 300,
  },
  {
    id: uuid(),
    type: "image",
    src: "/clock.jpg",
    x: -200,
    y: 100,
    width: 400,
    height: 300,
  },
];

export const BlockIdsAtom = atom<string[]>(
  starterBlocks.map((block) => block.id),
);
let starterBlockMap: Record<string, BlockType> = {};
for (const block of starterBlocks) {
  starterBlockMap[block.id] = block as BlockType;
}
export const BlockMapAtom = atom<Record<string, BlockType>>(starterBlockMap);

export const PromptCreatorAtom = atom<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

export const RenderCreatorAtom = atom<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

export const SelectedBlockIdsAtom = atom<string[]>([]);

export const BlockSelectorAtom = atom<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

export const StateRefAtom = atom<StateRefType>({
  camera: { x: 0, y: 0, z: 1 },
  blockIds: [],
  blockMap: {},
  mode: "move",
  zoomContainer: null,
  selectedBlockIds: [],
  blockSelector: null,
});

export const ShowTipsAtom = atom(true);
