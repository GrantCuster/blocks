import { ModeType } from "./types";

export const maxSize = 512;
export const defaultRenderPrompt =
  "Generate an image based on the contents provided by the user. If the user provides a collage of styles, combine them into one coherent image in a high-fidelity style. Move and reposition subjects if needed to match the user's intent.";

export const tipsContent: Record<ModeType, string> = {
  move: "Select and move blocks. Alt+Drag will duplicate.",
  prompt:
    "Click to create prompt boxes. Any prompt box that touches a frame will be sent as instructions on render.",
  segment: "Click an item in an image to extract that item.",
  frame:
    "In frame mode you can move, resize, select and delete the render blocks.",
};
