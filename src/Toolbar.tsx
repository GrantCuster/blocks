import { useAtom } from "jotai";
import { useRef, useEffect } from "react";
import {
  ModeAtom,
  RenderPromptAtom,
  ShowSettingsAtom,
  ShowTipsAtom,
} from "./atoms";
import { ModeType } from "./types";
import { useHandleUploadImage } from "./hooks";
import { defaultRenderPrompt, tipsContent } from "./consts";

export function Toolbar() {
  const [mode, setMode] = useAtom(ModeAtom);
  const [showTips, setShowTips] = useAtom(ShowTipsAtom);
  const [showSettings, setShowSettings] = useAtom(ShowSettingsAtom);
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
        <div className="px-3 py-3">
          <div>Blocks</div>
          <div className="text-neutral-400 text-sm">
            powered by Gemini Image Generation
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-0 pointer-events-none">
        <div className="px-3 text-sm py-3 flex gap-2">
          <button
            className="py-1 px-2 bg-neutral-700 rounded-md pointer-events-auto"
            onClick={() => {
              setShowSettings(!showSettings);
            }}
          >
            Settings
          </button>
          <button
            className={`py-1 px-2 pointer-events-auto brounded-md ${showTips ? "bg-neutral-800" : "bg-neutral-700"}`}
            onClick={() => {
              setShowTips(!showTips);
            }}
          >
            Tips
          </button>
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
      {showSettings ? <SettingsModal /> : null}
    </>
  );
}

function SettingsModal() {
  const [showSettings, setShowSettings] = useAtom(ShowSettingsAtom);
  const [renderPrompt, setRenderPrompt] = useAtom(RenderPromptAtom);

  return (
    <div
      className="fixed inset-0 flex justify-center items-center pointer-events-auto"
      onClick={() => {
        setShowSettings(!showSettings);
      }}
    >
      <div
        className="w-[500px] relative bg-neutral-800 bg-opacity-90 flex flex-col gap-2 py-2"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex justify-between items-center">
          <div className="px-3 text-sm uppercase">Settings</div>
          <button
            className="w-6 h-6 mr-2 flex justify-center items-center"
            onClick={() => {
              setShowSettings(!showSettings);
            }}
          >
            <div>&times;</div>
          </button>
        </div>
        <div className="flex justify-between">
          <div className="px-3 text-sm">Render prompt</div>
          {defaultRenderPrompt !== renderPrompt ? (
            <button
              className="bg-neutral-700 hover:bg-neutral-600 text-xs px-3 mr-3 rounded-lg"
              onClick={() => {
                setRenderPrompt(defaultRenderPrompt);
              }}
            >
              {" "}
              Reset to default
            </button>
          ) : null}
        </div>
        <div className="text-neutral-400 px-3 text-xs -mt-1">
          sent as instruction with the frame contents when you click render
        </div>
        <div className="w-full px-3">
          <textarea
            className="bg-neutral-900 focus:outline-none px-3 py-2 text-sm h-36 w-full resize-none"
            value={renderPrompt}
            onChange={(e) => {
              setRenderPrompt((e.target as HTMLTextAreaElement).value);
            }}
          />
        </div>
      </div>
    </div>
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
      <div className="px-3 pt-1 leading-5 pb-3 text-xs testn-neutral-600">
        {tipsContent[mode]}
      </div>
    </div>
  );
}
