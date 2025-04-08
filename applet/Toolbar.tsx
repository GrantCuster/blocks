import { useAtom } from "jotai";
import { useRef, useEffect } from "react";
import { ModeAtom, ShowTipsAtom } from "./atoms";
import { ModeType } from "./types";
import { useHandleUploadImage } from "./hooks";
import { tipsContent } from "./consts";

export function Toolbar() {
  const [mode, setMode] = useAtom(ModeAtom);
  const [showTips, setShowTips] = useAtom(ShowTipsAtom);
  const handleImageUpload = useHandleUploadImage();

  const lastModeRef = useRef<ModeType>(mode);
  useEffect(() => {
    function handleModifierDown(event: KeyboardEvent) {
      if (event.key === "Shift") {
        lastModeRef.current = mode;
        setMode("segment");
      }
    }
    function handleModifierUp(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setMode(lastModeRef.current);
      }
    }
    window.addEventListener("keydown", handleModifierDown);
    window.addEventListener("keyup", handleModifierUp);
    return () => {
      window.removeEventListener("keydown", handleModifierDown);
      window.removeEventListener("keyup", handleModifierUp);
    };
  }, [mode, setMode]);

  return (
    <>
      <div className="absolute left-0 top-0 pointer-events-none">
        <div className="px-3 py-3">Blocks</div>
      </div>
      <div className="absolute right-0 top-0 pointer-events-none">
        <div className="px-3 text-sm py-3 flex gap-2">
          <button className="py-1 px-2 bg-neutral-700 rounded-md">
            Settings
          </button>
          <button
            className={`py-1 px-2 pointer-events-auto brounded-md ${showTips ? "bg-neutral-800" : "bg-neutral-700"}`}
            onClick={() => {
              setShowTips(!showTips)
            }}
          >
            Tips
          </button>
          <button className="py-1 px-2 bg-neutral-700 rounded-md">About</button>
        </div>
        {showTips ? <Tips /> : null}
      </div>
      <div className="flex gap-2 absolute bottom-4 left-1/2 -translate-x-1/2">
        <button
          className={`${mode === "move" ? "bg-neutral-800" : "bg-neutral-700"} px-3 py-1 rounded-lg`}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            setMode("move");
          }}
        >
          Move
        </button>
        <button
          className={`${mode === "prompt" ? "bg-neutral-800" : "bg-neutral-700"} px-3 py-1 rounded-lg`}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            setMode("prompt");
          }}
        >
          Prompt
        </button>
        <button
          className={`${mode === "segment" ? "bg-neutral-800" : "bg-neutral-700"} px-3 py-1 rounded-lg`}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            setMode("segment");
          }}
        >
          Segment
        </button>
        <label className={`block bg-neutral-700 px-3 py-1 rounded-lg`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          Image
        </label>
        <button
          className={`${mode === "frame" ? "bg-neutral-800" : "bg-neutral-700"} px-3 py-1 rounded-lg`}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            setMode("frame");
          }}
        >
          Frame
        </button>
      </div>
    </>
  );
}

function Tips() {
  const [mode] = useAtom(ModeAtom);

  return (
    <div className="absolute top-12 right-2 w-[220px] text-sm bg-neutral-800 bg-opacity-90 rounded-lg">
      <div className="flex gap-2 text-xs px-3 pt-2 uppercase text-neutral-400">
        <div>Tip:</div>
        <div>{mode}</div>
      </div>
      <div className="px-3 pt-1 leading-5 pb-3 text-xs testn-neutral-600">{tipsContent[mode]}</div>
    </div>
  );
}
