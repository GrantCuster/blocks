import { useAtom } from "jotai";
import { useEffect } from "react";
import { BlockSelectorAtom, CameraAtom, ZoomContainerAtom } from "./atoms";
import { Blocks } from "./Blocks";
import { useHandleDropImage, useHandlePasteImage, useSerializeBlocks } from "./hooks";
import { RenderCreator } from "./RenderCreator";
import { PromptCreator } from "./PromptCreator";
import { panCamera, zoomCamera } from "./Camera";
import { useDragAndSelect } from "./useDragAndSelect";

export function Zoom() {
  const [camera, setCamera] = useAtom(CameraAtom);
  const [zoomContainer, setZoomContainer] = useAtom(ZoomContainerAtom);
  useHandleDropImage();
  useHandlePasteImage();
  const useDragBind = useDragAndSelect();
  const serializeBlocks = useSerializeBlocks();

  useEffect(() => {
    window.serializeBlocks = () => {
      serializeBlocks();
    }
  }, [serializeBlocks]);

  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      if (zoomContainer) {
        event.preventDefault();

        const { clientX: x, clientY: y, deltaX, deltaY, ctrlKey } = event;

        if (ctrlKey) {
          setCamera((camera) =>
            zoomCamera(camera, { x, y }, deltaY / 400, zoomContainer),
          );
        } else {
          setCamera((camera) => panCamera(camera, deltaX, deltaY));
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [zoomContainer, setCamera]);

  return (
    <div
      {...useDragBind()}
      className="absolute inset-0 touch-none"
      ref={(div) => {
        if (div) {
          setZoomContainer(div);
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "100%",
          transformOrigin: "0 0",
          transform: `scale(${camera.z}) translate(-50%, -50%) translate(${camera.x}px, ${camera.y}px)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="relative pointer-events-none">
          <Blocks />
          <RenderCreator />
          <PromptCreator />
          <BlockSelector />
        </div>
      </div>
    </div>
  );
}

function BlockSelector() {
  const [blockSelector] = useAtom(BlockSelectorAtom);

  return blockSelector ? (
    <div
      className="absolute pointer-events-none border-[2px] border-blue-500"
      style={{
        left: blockSelector.x,
        top: blockSelector.y,
        width: blockSelector.width,
        height: blockSelector.height,
      }}
    />
  ) : null;
}
