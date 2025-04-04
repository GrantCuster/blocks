import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  RenderCreatorAtom,
  ModeAtom,
  ZoomContainerAtom,
} from "./atoms";
import { useEffect, useRef } from "react";
import { screenToCanvas } from "./Camera";
import { useCreateBlock } from "./hooks";
import { v4 as uuid } from "uuid";
import { makeZIndex } from "./utils";

export function RenderCreator() {
  const [mode, setMode] = useAtom(ModeAtom);
  const [renderCreator, setRenderCreator] = useAtom(RenderCreatorAtom);
  const createBlock = useCreateBlock();

  const [camera] = useAtom(CameraAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  zoomContainerRef.current = zoomContainer;

  const pointRef = useRef<{ x: number; y: number } | null>(null);

  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);

  const blocks = blockIds.map((id) => blockMap[id]);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => {
    if (mode !== "render") return;
    function handlePointerDown(e: PointerEvent) {
      (e.target as Element).setPointerCapture(e.pointerId);
      const point = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        cameraRef.current,
        zoomContainerRef.current!,
      );
      const overBlocks = blocksRef.current
        .filter((block) => block.type === "render")
        .filter((block) => {
          return (
            point.x > block.x &&
            point.x < block.x + block.width &&
            point.y > block.y &&
            point.y < block.y + block.height
          );
        })
        .sort((a, b) => b.zIndex - a.zIndex);

      if (overBlocks.length === 0) {
        pointRef.current = { x: point.x, y: point.y };
      }
    }
    function handlePointerMove(e: PointerEvent) {
      if (e.buttons !== 1) return;
      if (!pointRef.current) return;
      const canvasPoint = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        cameraRef.current,
        zoomContainerRef.current!,
      );
      const x = Math.min(canvasPoint.x, pointRef.current.x);
      const y = Math.min(canvasPoint.y, pointRef.current.y);
      const width = Math.abs(canvasPoint.x - pointRef.current.x);
      const height = Math.abs(canvasPoint.y - pointRef.current.y);
      setRenderCreator({ x, y, width, height });
    }
    function handlePointerUp(e: PointerEvent) {
      (e.target as Element).releasePointerCapture(e.pointerId);

      if (!pointRef.current) return;
      const canvasPoint = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        cameraRef.current,
        zoomContainerRef.current!,
      );
      const x = Math.min(canvasPoint.x, pointRef.current.x);
      const y = Math.min(canvasPoint.y, pointRef.current.y);
      const width = Math.max(Math.abs(canvasPoint.x - pointRef.current.x), 96);
      const height = Math.max(Math.abs(canvasPoint.y - pointRef.current.y), 48);
      pointRef.current = null;

      createBlock({
        id: uuid(),
        type: "render",
        x,
        y,
        width,
        height,
        prompt: "make image",
        zIndex: makeZIndex(),
      });
      setRenderCreator(null);
      setMode("move");
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [mode, zoomContainer]);

  return renderCreator ? (
    <div
      className="border-2 border-blue-500"
      style={{
        position: "absolute",
        left: renderCreator.x,
        top: renderCreator.y,
        width: renderCreator.width,
        height: renderCreator.height,
      }}
    />
  ) : null;
}
