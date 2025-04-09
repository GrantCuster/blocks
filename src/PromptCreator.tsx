import { useAtom } from "jotai";
import {
  CameraAtom,
  ModeAtom,
  PromptCreatorAtom,
  ZoomContainerAtom,
} from "./atoms";
import { useEffect, useRef } from "react";
import { screenToCanvas } from "./Camera";
import { useCreateBlock } from "./hooks";
import { v4 as uuid } from "uuid";
import { makeZIndex } from "./utils";

export function PromptCreator() {
  const [mode, setMode] = useAtom(ModeAtom);
  const [promptCreator, setPromptCreator] = useAtom(PromptCreatorAtom);
  const createBlock = useCreateBlock();

  const [camera] = useAtom(CameraAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  zoomContainerRef.current = zoomContainer;

  const pointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode !== "prompt") return;
    function handlePointerDown(e: PointerEvent) {
      (e.target as Element).setPointerCapture(e.pointerId);
      const canvasPoint = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        cameraRef.current,
        zoomContainerRef.current!,
      );
      pointRef.current = { x: canvasPoint.x, y: canvasPoint.y };
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
      setPromptCreator({ x, y, width, height });
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
      const width = Math.max(Math.abs(canvasPoint.x - pointRef.current.x), 180)
      const height = Math.max(Math.abs(canvasPoint.y - pointRef.current.y), 32)
      pointRef.current = null;

      createBlock({
        id: uuid(),
        type: "prompt",
        x,
        y,
        width,
        height,
        text: "",
        editing: true,
        zIndex: makeZIndex(),
      });
      setPromptCreator(null);
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

  return promptCreator ? (
    <div
      className="border-2 border-blue-500"
      style={{
        position: "absolute",
        left: promptCreator.x,
        top: promptCreator.y,
        width: promptCreator.width,
        height: promptCreator.height,
      }}
    />
  ) : null;
}
