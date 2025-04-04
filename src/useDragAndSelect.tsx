import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  BlockSelectorAtom,
  ModeAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "./atoms";
import { useRef } from "react";
import { screenToCanvas } from "./Camera";
import {
  blockIntersectBlocks,
  loadImage,
  makeZIndex,
  pointIntersectBlocks,
} from "./utils";
import { BlockType, ImageBlockType, PointType } from "./types";
import { v4 as uuid } from "uuid";
import { FilesetResolver, InteractiveSegmenter } from "@mediapipe/tasks-vision";

let interactiveSegmenter: InteractiveSegmenter;
const createSegmenter = async () => {
  // Move to CDN
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
  );
  interactiveSegmenter = await InteractiveSegmenter.createFromOptions(
    filesetResolver,
    {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite`,
        delegate: "GPU",
      },
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    },
  );
};
createSegmenter();

export function useDragAndSelect() {
  const [, setBlockSelector] = useAtom(BlockSelectorAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setMode] = useAtom(ModeAtom);

  const initialPositionsRef = useRef<PointType[]>([]);
  const initialPointRef = useRef({ x: 0, y: 0 });

  return useDrag(async ({ first, last, xy: [x, y] }) => {
    const canvasPoint = screenToCanvas(
      { x, y },
      stateRef.camera,
      stateRef.zoomContainer!,
    );
    const currentBlocks = stateRef.blockIds.map((id) => stateRef.blockMap[id]);
    if (first) {
      initialPointRef.current = { x: canvasPoint.x, y: canvasPoint.y };
    }

    switch (stateRef.mode) {
      case "move": {
        if (first) {
          const intersected = pointIntersectBlocks(canvasPoint, currentBlocks);

          if (intersected.length > 0) {
            let promptBlocks = intersected.filter(
              (block) => block.type === "prompt",
            );
            promptBlocks = promptBlocks.sort((a, b) => b.zIndex - a.zIndex);
            let imageBlocks = intersected.filter(
              (block) => block.type === "image",
            );
            imageBlocks = imageBlocks.sort((a, b) => b.zIndex - a.zIndex);
            const sortedBlocks = [...promptBlocks, ...imageBlocks];

            const topBlock = sortedBlocks[0].id;

            if (stateRef.selectedBlockIds.includes(topBlock)) {
              // keep selection
            } else {
              stateRef.selectedBlockIds = [topBlock];
              setSelectedBlockIds([topBlock]);
            }
            initialPositionsRef.current = stateRef.selectedBlockIds.map(
              (id) => {
                const block = stateRef.blockMap[id];
                return {
                  x: block.x,
                  y: block.y,
                };
              },
            );
          } else {
            stateRef.selectedBlockIds = [];
            setSelectedBlockIds([]);
          }
        }

        if (stateRef.selectedBlockIds.length === 0) {
          const minX = Math.min(canvasPoint.x, initialPointRef.current.x);
          const minY = Math.min(canvasPoint.y, initialPointRef.current.y);
          const maxX = Math.max(canvasPoint.x, initialPointRef.current.x);
          const maxY = Math.max(canvasPoint.y, initialPointRef.current.y);
          const blockSelector = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };
          stateRef.blockSelector = blockSelector;
          setBlockSelector(blockSelector);
        } else {
          // moveBlocks
          const selectedBlocks = stateRef.selectedBlockIds.map(
            (id) => stateRef.blockMap[id],
          );
          let newBlockObj: Record<string, BlockType> = {};
          for (let i = 0; i < selectedBlocks.length; i++) {
            const block = selectedBlocks[i];
            newBlockObj[block.id] = {
              ...block,
              x:
                initialPositionsRef.current[i].x +
                (canvasPoint.x - initialPointRef.current.x),
              y:
                initialPositionsRef.current[i].y +
                (canvasPoint.y - initialPointRef.current.y),
              zIndex: makeZIndex() + 1,
            } as BlockType;
          }
          setBlockMap((prev) => {
            return { ...prev, ...newBlockObj };
          });
        }

        if (last) {
          if (stateRef.blockSelector) {
            const _selectedBlocks = blockIntersectBlocks(
              stateRef.blockSelector as BlockType,
              currentBlocks,
            );
            let promptBlocks = _selectedBlocks.filter(
              (block) => block.type === "prompt",
            );
            promptBlocks = promptBlocks.sort((a, b) => b.zIndex - a.zIndex);
            let imageBlocks = _selectedBlocks.filter(
              (block) => block.type === "image",
            );
            imageBlocks = imageBlocks.sort((a, b) => b.zIndex - a.zIndex);
            const sortedBlocks = [...promptBlocks, ...imageBlocks];
            const sortedBlocksIds = sortedBlocks.map((block) => block.id);

            stateRef.selectedBlockIds = sortedBlocksIds;
            setSelectedBlockIds(sortedBlocksIds);
            stateRef.blockSelector = null;
            setBlockSelector(null);
          }
        }
        break;
      }
      case "segment": {
        if (first) {
          const intersected = pointIntersectBlocks(canvasPoint, currentBlocks);
          let intersectedImages = intersected.filter(
            (block) => block.type === "image",
          );

          if (intersectedImages.length > 0) {
            intersectedImages = intersectedImages.sort(
              (a, b) => b.zIndex - a.zIndex,
            );
            const topBlock = intersectedImages[0];

            const imageCanvas = document.createElement("canvas");
            imageCanvas.width = topBlock.width;
            imageCanvas.height = topBlock.height;

            const image = await loadImage(topBlock.src);
            const ctx = imageCanvas.getContext("2d")!;
            ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);

            const imageData = ctx.getImageData(
              0,
              0,
              imageCanvas.width,
              imageCanvas.height,
            );

            interactiveSegmenter.segment(
              imageCanvas,
              {
                keypoint: {
                  x: (canvasPoint.x - topBlock.x) / topBlock.width,
                  y: (canvasPoint.y - topBlock.y) / topBlock.height,
                },
              },
              (result) => {
                const mask = result.categoryMask;
                if (!mask) return;
                const resultCanvas = document.createElement("canvas");
                resultCanvas.width = topBlock.width;
                resultCanvas.height = topBlock.height;
                const resultCtx = resultCanvas.getContext("2d")!;
                resultCtx.drawImage(
                  imageCanvas,
                  0,
                  0,
                  topBlock.width,
                  topBlock.height,
                );
                const tempData = resultCtx.getImageData(
                  0,
                  0,
                  resultCanvas.width,
                  resultCanvas.height,
                );
                let minX = resultCanvas.width;
                let minY = resultCanvas.height;
                let maxX = 0;
                let maxY = 0;
                const maskData = mask.getAsFloat32Array();
                for (let i = 0; i < tempData.data.length; i += 4) {
                  if (Math.round(maskData[i / 4] * 255.0) === 0) {
                    const x = (i / 4) % resultCanvas.width;
                    const y = Math.floor(i / 4 / resultCanvas.width);
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    tempData.data[i] = imageData.data[i];
                    tempData.data[i + 1] = imageData.data[i + 1];
                    tempData.data[i + 2] = imageData.data[i + 2];
                  } else {
                    tempData.data[i + 3] = 0;
                  }
                }
                resultCtx.putImageData(tempData, 0, 0);

                const finalCanvas = document.createElement("canvas");
                finalCanvas.width = maxX - minX;
                finalCanvas.height = maxY - minY;
                const finalCtx = finalCanvas.getContext("2d")!;
                finalCtx.drawImage(
                  resultCanvas,
                  minX,
                  minY,
                  finalCanvas.width,
                  finalCanvas.height,
                  0,
                  0,
                  finalCanvas.width,
                  finalCanvas.height,
                );
                const finalSrc = finalCanvas.toDataURL();

                const newId = uuid();

                const newBlock = {
                  id: newId,
                  type: "image",
                  src: finalSrc,
                  x: topBlock.x + minX,
                  y: topBlock.y + minY,
                  width: maxX - minX,
                  height: maxY - minY,
                  zIndex: makeZIndex(),
                } as ImageBlockType;

                const newMap = { ...stateRef.blockMap, [newId]: newBlock };
                const newIds = [...stateRef.blockIds, newId];
                stateRef.blockMap = newMap;
                setBlockMap(newMap);
                stateRef.blockIds = newIds;
                setBlockIds(newIds);
                stateRef.selectedBlockIds = [newId];
                setSelectedBlockIds([newId]);
                initialPositionsRef.current = [
                  {
                    x: topBlock.x + minX,
                    y: topBlock.y + minY,
                  },
                ];
                stateRef.mode = "move";
                setMode("move");
              },
            );
          }
        }
        break;
      }
      default: {
        break;
      }
    }
  });
}
