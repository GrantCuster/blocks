import { useEffect, useState } from "react";
import { ImageBlockType } from "./types";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function main() {
      if (window.location.origin.includes("usercontent.goog")) {
        const noStartingSlash = block.src.startsWith("/")
          ? block.src.slice(1)
          : block.src;
        const fetched = await fetch(noStartingSlash);
        const blob = await fetched.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } else {
        setImageUrl(block.src);
      }
    }
    main();
  }, [block.src]);

  return (
    <img
      draggable={false}
      src={imageUrl || ""}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
