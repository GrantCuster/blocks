import { useEffect, useMemo, useState } from "react";
import { ImageBlockType } from "./types";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function main() {
      const fetched = await fetch(block.src);
      const blob = await fetched.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    }
    main();
  }, [block.src]);

  return (
    <img
      draggable={false}
      src={imageUrl || ''}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
