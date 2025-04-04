import { useAtom } from "jotai";
import { useRef, useEffect } from "react";
import { ModeAtom } from "./atoms";
import { ModeType } from "./types";

export function Toolbar() {
  const [mode, setMode] = useAtom(ModeAtom);

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
        <div className="px-3 py-3">Blocks Lite</div>
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
      </div>
    </>
  );
}
