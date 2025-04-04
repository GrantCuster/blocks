import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ZoomContainerAtom,
} from "./atoms";
import { BlockType } from "./types";
import { useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { screenToCanvas } from "./Camera";
import { loadImage, makeZIndex } from "./utils";
import { maxSize } from "./consts";

export function useCreateBlock() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);

  return (block: BlockType) => {
    setBlockIds((prev) => [...prev, block.id]);
    setBlockMap((prev) => ({ ...prev, [block.id]: block }));
  };
}

export function useUpdateBlock() {
  const [, setBlockMap] = useAtom(BlockMapAtom);

  return (id: string, updates: Partial<BlockType>) => {
    setBlockMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates } as BlockType,
    }));
  };
}

export function useHandleDropImage() {
  const createBlock = useCreateBlock();
  const [camera] = useAtom(CameraAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);

  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  zoomContainerRef.current = zoomContainer;

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDropImage(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        const image = await loadImage(src);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        const canvasPoint = screenToCanvas(
          { x: event.clientX, y: event.clientY },
          cameraRef.current,
          zoomContainerRef.current!,
        );
        createBlock({
          id: uuid(),
          type: "image",
          src,
          x: canvasPoint.x - (image.width * scale) / 2,
          y: canvasPoint.y - (image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
          zIndex: makeZIndex(),
        });
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    window.addEventListener("drop", handleDropImage);
    window.addEventListener("dragover", handleDragOver);
    return () => {
      window.removeEventListener("drop", handleDropImage);
      window.removeEventListener("dragover", handleDragOver);
    };
  }, []);
}

export function useHandlePasteImage() {
  const createBlock = useCreateBlock();
  const [camera] = useAtom(CameraAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);

  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  zoomContainerRef.current = zoomContainer;

  function handlePasteImage(event: ClipboardEvent) {
    const file = event.clipboardData?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        const image = await loadImage(src);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        const canvasPoint = screenToCanvas(
          {
            x: zoomContainerRef.current!.clientWidth / 2,
            y: zoomContainerRef.current!.clientHeight / 2,
          },
          cameraRef.current,
          zoomContainerRef.current!,
        );
        createBlock({
          id: uuid(),
          type: "image",
          src,
          x: canvasPoint.x - (image.width * scale) / 2,
          y: canvasPoint.y - (image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
          zIndex: makeZIndex(),
        });
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    window.addEventListener("paste", handlePasteImage);
    return () => {
      window.removeEventListener("paste", handlePasteImage);
    };
  }, []);
}
