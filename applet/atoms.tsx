import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { BlockType, ModeType, StateRefType } from "./types";
import { defaultRenderPrompt } from "./consts";
import { v4 as uuid } from "uuid";
import { starterBlocks } from "./starterBlocks";

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

export const ShowSettingsAtom = atom(false);
