import { useAtom } from "jotai";
import { v4 as uuid } from "uuid";
import { BlockIdsAtom, BlockMapAtom, ModeAtom, RenderPromptAtom, StateRefAtom } from "./atoms";
import { maxSize } from "./consts";
import { useCreateBlock, useUpdateBlock } from "./hooks";
import { predict } from "./modelUtils";
import { RenderBlockType } from "./types";
import { appletResolveImage, loadImage, makeZIndex } from "./utils";
import { Part } from "@google/genai";

const sides = ["top", "right", "bottom", "left"] as const;

export function RenderBlock({ block }: { block: RenderBlockType }) {
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const [systemInstruction] = useAtom(RenderPromptAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setMode] = useAtom(ModeAtom);

  async function handleRender() {
    if (stateRef.mode === "frame") {
      setMode("move");
    }

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

    // update to use for labels
    function textWrap(text: string, maxWidth: number) {
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const testLine = line + word + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth) {
          lines.push(line);
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      return lines;
    }

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

    let image = canvas.toDataURL();
    let croppedImage = null;
    let blurredCanvas = document.createElement("canvas");
    let blurredImage = null;

    blurredCanvas.width = block.width;
    blurredCanvas.height = block.height;
    const blurredCtx = blurredCanvas.getContext("2d")!;
    blurredCtx.fillStyle = "black";
    blurredCtx.fillRect(0, 0, block.width, block.height);

    if (imageActive) {
      croppedImage = document.createElement("canvas");
      croppedImage.width = block.width;
      croppedImage.height = block.height;
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
    }

    if (croppedImage) {
      blurredCanvas.width = croppedImage.width;
      blurredCanvas.height = croppedImage.height;
      blurredCtx.filter = "blur(16px)";
      blurredCtx.drawImage(croppedImage, 0, 0);
    }

    blurredCtx.filter = "none";
    blurredCtx.font = "16px sans-serif";
    blurredCtx.fillStyle = "orange";
    const padding = 16;
    blurredCtx.fillText("Rendering...", padding, 8 + 16);
    let yTrack = 8 + 16;
    for (const activePrompt of activePrompts) {
      const lines = textWrap(activePrompt, blurredCanvas.width - padding * 2);
      for (let i = 0; i < lines.length; i++) {
        blurredCtx.fillText(lines[i], padding, yTrack + 16 * (i + 1));
        yTrack += 16;
      }
    }
    blurredImage = blurredCanvas.toDataURL();

    const id = uuid();

    // visualize debug
    createBlock({
      id,
      type: "image",
      src: blurredImage || image,
      // x: block.x + (croppedImage ? (block.width - croppedImage!.width) / 2 : 0),
      // y:
      //   block.y +
      //   (croppedImage ? (block.height - croppedImage!.height) / 2 : 0),
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
      contents: contents.contents,
    });

    let lastImagePart: Part | null = null;
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
        className="absolute pointer-events-auto -bottom-9 -right-1 px-3 py-1 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white"
        onClick={handleRender}
      >
        Render
      </button>
      {sides.map((side) => (
        <div
          key={side}
          className="absolute pointer-events-auto"
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
