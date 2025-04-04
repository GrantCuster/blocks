import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  SelectedBlockIdsAtom,
} from "./atoms";
import { RenderBlockType, ImageBlockType, PromptBlockType } from "./types";
import { PromptBlock } from "./PromptBlock";
import { RenderBlock } from "./RenderBlock";
import { ImageBlock } from "./ImageBlock";
import { BlockResizers } from "./BlockResizers";

export function Blocks() {
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  return (
    <>
      <div className="absolute z-0">
        {blockIds.map((id) => {
          const block = blockMap[id];
          if (block.type !== "render" && block.type !== "prompt") {
            return <BlockWrapper key={id} id={id} />;
          }
        })}
      </div>
      <div className="absolute z-0">
        {blockIds.map((id) => {
          const block = blockMap[id];
          if (block.type === "prompt") {
            return <BlockWrapper key={id} id={id} />;
          }
        })}
      </div>
      <div className="absolute z-0">
        {blockIds.map((id) => {
          const block = blockMap[id];
          if (block.type === "render") {
            return <BlockWrapper key={id} id={id} />;
          }
        })}
      </div>
    </>
  );
}

export function BlockWrapper({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const isSelected = selectedBlockIds.includes(id);

  return (
    <div
      className={`absolute border-2 ${isSelected ? "border-blue-500" : "border-transparent"} touch-none pointer-events-auto`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
        pointerEvents: block.type === "render" ? "none" : "auto",
      }}
    >
      <BlockFactory id={id} />
      <BlockResizers id={id} />
    </div>
  );
}

export function BlockFactory({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  switch (block.type) {
    case "image":
      return <ImageBlock block={block as ImageBlockType} />;
    case "render":
      return <RenderBlock block={block as RenderBlockType} />;
    case "prompt":
      return <PromptBlock block={block as PromptBlockType} />;
  }
}
