import { ImageBlockType } from "./types";
import { useImageHandler } from "./utils";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const imageUrl = useImageHandler(block.src);

  return (
    <img
      draggable={false}
      src={imageUrl || ""}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
