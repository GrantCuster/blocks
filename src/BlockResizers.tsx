import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import { BlockMapAtom, CameraAtom, ZoomContainerAtom } from "./atoms";
import { makeZIndex } from "./utils";
import { screenToCanvas } from "./Camera";

export function BlockResizers({ id }: { id: string }) {
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  const [camera] = useAtom(CameraAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const zoomContainerRef = useRef(zoomContainer);
  zoomContainerRef.current = zoomContainer;

  const preserveAspectRatio = block.type === "image";

  const size = 24;

  const keepCornerRef = useRef({ x: block.x, y: block.y });

  const dirs = ["nw", "ne", "sw", "se"];
  const binds = dirs.map((dir) => {
    return useDrag(({ first, event, xy: [x, y] }) => {
      event.stopPropagation();

      if (first) {
        if (dir === "nw") {
          keepCornerRef.current = {
            x: block.x + block.width,
            y: block.y + block.height,
          };
        } else if (dir === "ne") {
          keepCornerRef.current = {
            x: block.x,
            y: block.y + block.height,
          };
        } else if (dir === "sw") {
          keepCornerRef.current = {
            x: block.x + block.width,
            y: block.y,
          };
        } else if (dir === "se") {
          keepCornerRef.current = {
            x: block.x,
            y: block.y,
          };
        }
      } else {
        const canvasPoint = screenToCanvas(
          { x, y },
          cameraRef.current,
          zoomContainerRef.current!,
        );

        const minX =
          dir === "ne" || dir === "se"
            ? keepCornerRef.current.x
            : canvasPoint.x;
        const minY =
          dir === "sw" || dir === "se"
            ? keepCornerRef.current.y
            : canvasPoint.y;
        const maxX =
          dir === "nw" || dir === "sw"
            ? keepCornerRef.current.x
            : canvasPoint.x;
        const maxY =
          dir === "nw" || dir === "ne"
            ? keepCornerRef.current.y
            : canvasPoint.y;

        let startX = minX;
        let startY = minY;
        let endX = maxX;
        let endY = maxY;

        if (preserveAspectRatio) {
          const aspectRatio = block.width / block.height;
          const newWidth = endX - startX;
          const newHeight = endY - startY;
          const newAspectRatio = newWidth / newHeight;
          if (newAspectRatio > aspectRatio) {
            if (dir === "nw" || dir === "sw") {
              startX = endX - newHeight * aspectRatio;
            } else {
              endX = startX + newHeight * aspectRatio;
            }
          } else {
            if (dir === "nw" || dir === "ne") {
              startY = endY - newWidth / aspectRatio;
            } else {
              endY = startY + newWidth / aspectRatio;
            }
          }
        }

        let width = endX - startX;
        let height = endY - startY;
        const minSize = 48;

        if (width < minSize) {
          if (dir === "nw" || dir === "sw") {
            startX = endX - minSize;
          } else {
            endX = startX + minSize;
          }
          width = endX - startX;
        }
        if (height < minSize) {
          if (dir === "nw" || dir === "ne") {
            startY = endY - minSize;
          } else {
            endY = startY + minSize;
          }
          height = endY - startY;
        }

        setBlockMap((prev) => ({
          ...prev,
          [id]: {
            ...block,
            x: startX,
            y: startY,
            width,
            height,
            zIndex: makeZIndex(),
          },
        }));
      }
    });
  });

  return (
    <>
      <div
        {...binds[0]()}
        className="absolute touch-none pointer-events-auto"
        style={{
          left: -size / 2,
          top: -size / 2,
          cursor: "nwse-resize",
          width: size,
          height: size,
        }}
      />
      <div
        {...binds[1]()}
        className="absolute touch-none pointer-events-auto"
        style={{
          right: -size / 2,
          top: -size / 2,
          cursor: "nesw-resize",
          width: size,
          height: size,
        }}
      />
      <div
        {...binds[2]()}
        className="absolute touch-none pointer-events-auto"
        style={{
          left: -size / 2,
          bottom: -size / 2,
          cursor: "nesw-resize",
          width: size,
          height: size,
        }}
      />
      <div
        {...binds[3]()}
        className="absolute touch-none pointer-events-auto"
        style={{
          right: -size / 2,
          bottom: -size / 2,
          cursor: "nwse-resize",
          width: size,
          height: size,
        }}
      />
    </>
  );
}
