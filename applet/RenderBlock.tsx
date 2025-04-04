import { useAtom } from "jotai";
import { v4 as uuid } from "uuid";
import { BlockIdsAtom, BlockMapAtom, RenderPromptAtom } from "./atoms";
import { maxSize } from "./consts";
import { useCreateBlock, useUpdateBlock } from "./hooks";
import { predict } from "./modelUtils";
import { RenderBlockType } from "./types";
import { appletResolveImage, loadImage, makeZIndex } from "./utils";
import { GenerateContentRequest } from "@google/generative-ai";

const sides = ["top", "right", "bottom", "left"] as const;

export function RenderBlock({ block }: { block: RenderBlockType }) {
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const [systemInstruction] = useAtom(RenderPromptAtom);

  async function handleRender() {
    const canvas = document.createElement("canvas");
    canvas.width = block.width;
    canvas.height = block.height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, block.width, block.height);

    const imageBlocks = blockIds
      .map((id) => blockMap[id])
      .filter((block) => block.type === "image");
    // sort by zIndex
    imageBlocks.sort((a, b) => a.zIndex - b.zIndex);

    let imageActive = false;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const imageBlock of imageBlocks) {
      if (
        imageBlock.x + imageBlock.width < block.x ||
        imageBlock.x > block.x + block.width
      )
        continue;
      if (
        imageBlock.y + imageBlock.height < block.y ||
        imageBlock.y > block.y + block.height
      )
        continue;
      imageActive = true;
      minX = Math.min(minX, imageBlock.x - block.x);
      minY = Math.min(minY, imageBlock.y - block.y);
      maxX = Math.max(maxX, imageBlock.x - block.x + imageBlock.width);
      maxY = Math.max(maxY, imageBlock.y - block.y + imageBlock.height);
      const image = await loadImage(await appletResolveImage(imageBlock.src));
      ctx.drawImage(
        image,
        imageBlock.x - block.x,
        imageBlock.y - block.y,
        imageBlock.width,
        imageBlock.height,
      );
    }

    let image = canvas.toDataURL();
    let croppedImage = null;
    let blurredImage = null;
    if (imageActive) {
      croppedImage = document.createElement("canvas");
      croppedImage.width = maxX - minX;
      croppedImage.height = maxY - minY;
      const croppedCtx = croppedImage.getContext("2d")!;
      croppedCtx.drawImage(
        canvas,
        minX,
        minY,
        maxX - minX,
        maxY - minY,
        0,
        0,
        maxX - minX,
        maxY - minY,
      );
      image = croppedImage.toDataURL();

      const blurredCanvas = document.createElement("canvas");
      blurredCanvas.width = croppedImage.width;
      blurredCanvas.height = croppedImage.height;
      const blurredCtx = blurredCanvas.getContext("2d")!;
      blurredCtx.filter = "blur(16px)";
      blurredCtx.drawImage(croppedImage, 0, 0);
      blurredImage = blurredCanvas.toDataURL();
    }

    // update to use for labels
    // function textWrap(text: string, maxWidth: number) {
    //   const words = text.split(" ");
    //   const lines: string[] = [];
    //   let line = "";
    //   for (const word of words) {
    //     const testLine = line + word + " ";
    //     const testWidth = ctx.measureText(testLine).width;
    //     if (testWidth > maxWidth) {
    //       lines.push(line);
    //       line = word + " ";
    //     } else {
    //       line = testLine;
    //     }
    //   }
    //   lines.push(line);
    //   return lines;
    // }
    // const promptBlocks = blockIds
    //   .map((id) => blockMap[id])
    //   .filter((block) => block.type === "prompt");
    // for (const promptBlock of promptBlocks) {
    //   if (
    //     promptBlock.x + promptBlock.width < block.x ||
    //     promptBlock.x > block.x + block.width
    //   )
    //     continue;
    //   if (
    //     promptBlock.y + promptBlock.height < block.y ||
    //     promptBlock.y > block.y + block.height
    //   )
    //     continue;
    //   ctx.font = "16px sans-serif";
    //   ctx.fillStyle = "white";
    //   const lines = textWrap(promptBlock.text, promptBlock.width);
    //   for (let i = 0; i < lines.length; i++) {
    //     ctx.fillText(
    //       lines[i],
    //       promptBlock.x - block.x,
    //       promptBlock.y - block.y + 16 * (i + 1),
    //     );
    //   }
    // }

    let activePrompts = [];
    const promptBlocks = blockIds
      .map((id) => blockMap[id])
      .filter((block) => block.type === "prompt");
    for (const promptBlock of promptBlocks) {
      if (
        promptBlock.x + promptBlock.width < block.x ||
        promptBlock.x > block.x + block.width
      )
        continue;
      if (
        promptBlock.y + promptBlock.height < block.y ||
        promptBlock.y > block.y + block.height
      )
        continue;
      activePrompts.push(promptBlock.text);
    }

    const id = uuid();

    // visualize debug
    createBlock({
      id,
      type: "image",
      src: blurredImage || image,
      x: block.x + block.width + 16,
      y: block.y,
      width: croppedImage ? croppedImage.width : block.width,
      height: croppedImage ? croppedImage.height : block.height,
      zIndex: makeZIndex(),
    });

    let contents: GenerateContentRequest = {
      contents: [
        {
          parts: [],
          role: "user",
        },
      ],
    };

    if (imageActive) {
      contents.contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: croppedImage!.toDataURL().split(",")[1],
        },
      });
    }

    contents.contents[0].parts.push({
      text: "Instructions: " + systemInstruction,
    });

    if (activePrompts.length > 0) {
      for (const prompt of activePrompts) {
        contents.contents[0].parts.push({
          text: prompt,
        });
      }
    }

    const responseParts = await predict({
      contents,
    });
    console.log(responseParts)
    return

    let lastImagePart = null;

    for (const part of responseParts) {
      if (part.inlineData) {
        lastImagePart = part;
      }
    }

    if (lastImagePart) {
      const generatedImageSrc =
        "data:" +
        lastImagePart.inlineData.mimeType +
        ";base64," +
        lastImagePart.inlineData.data;
      const generatedImage = await loadImage(generatedImageSrc);
      const newCanvas = document.createElement("canvas");
      const scale = Math.min(
        maxSize / generatedImage.width,
        maxSize / generatedImage.height,
      );
      newCanvas.width = generatedImage.width * scale;
      newCanvas.height = generatedImage.height * scale;
      const newCtx = newCanvas.getContext("2d")!;
      newCtx.drawImage(
        generatedImage,
        0,
        0,
        generatedImage.width,
        generatedImage.height,
        0,
        0,
        newCanvas.width,
        newCanvas.height,
      );
      updateBlock(id, {
        type: "image",
        src: newCanvas.toDataURL(),
        width: newCanvas.width,
        height: newCanvas.height,
        zIndex: makeZIndex(),
      });
    }
  }

  return (
    <div
      className="border-2 border-red-500 absolute"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <button
        className="absolute pointer-events-auto -bottom-9 right-0 px-3 py-1 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white"
        onClick={handleRender}
      >
        Render
      </button>
      {sides.map((side) => (
        <div
          key={side}
          className="absolute cursor-move pointer-events-auto"
          style={{
            [side]: -8,
            width: side === "top" || side === "bottom" ? "100%" : 16,
            height: side === "top" || side === "bottom" ? 16 : "100%",
          }}
        />
      ))}
    </div>
  );
}
