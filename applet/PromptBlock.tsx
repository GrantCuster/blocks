import { useSetAtom } from "jotai";
import { BlockMapAtom } from "./atoms";
import { PromptBlockType } from "./types";
import { useLayoutEffect, useRef } from "react";

export function PromptBlock({ block }: { block: PromptBlockType }) {
  const setBlockMap = useSetAtom(BlockMapAtom);
  const doubleClickedRef = useRef(false);

  function updateBlock(id: string, updates: Partial<PromptBlockType>) {
    setBlockMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates } as PromptBlockType,
    }));
  }

  const setBlock = (updates: Partial<PromptBlockType>) => {
    setBlockMap((prev) => ({
      ...prev,
      [block.id]: { ...block, ...updates },
    }));
  };

  const textSizingRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!textSizingRef.current) return;
    const height = textSizingRef.current.offsetHeight;
    const topBar = 0;
    if (block.height < height + topBar) {
      updateBlock(block.id, { height: height + topBar });
    }
  }, [block.text, block.width, block.height]);

  // TODO placeholder text
  return (
    <div
      className="absolute overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    >
      <div className="absolute inset-0 flex flex-col bg-neutral-800 bg-opacity-80 rounded-xl">
        <div className="uppercase hidden text-xs px-3 pt-2">PROMPT</div>
        <div
          className="absolute pointer-events-none left-0 top-0 w-full px-3 py-2 whitespace-pre-wrap break-words select-none opacity-0 rounded-xl"
          ref={textSizingRef}
        >
          {block.text}&#xfeff;
        </div>
        <div className="relative grow">
          {block.editing ? (
            <textarea
              autoFocus
              className="absolute left-0 top-0 px-3 py-2 w-full h-full focus:bg-transparent focus:outline-none resize-none"
              placeholder="Your prompt"
              value={block.text}
              onFocus={(e) => {
                if (doubleClickedRef.current) {
                  // put cursor at end of text
                  e.target.selectionStart = e.target.selectionEnd =
                    e.target.value.length;
                  doubleClickedRef.current = false;
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => setBlock({ text: e.target.value })}
              onBlur={() => setBlock({ editing: false })}
            />
          ) : (
            <div
              className={`absolute left-0 top-0 w-full px-3 py-2 whitespace-pre-wrap break-words h-full select-none ${block.text.length > 0 ? "opacity-100" : "opacity-50"}`}
              onDoubleClick={() => {
                doubleClickedRef.current = true;
                setBlock({ editing: true });
              }}
            >
              <div className="">{block.text.length > 0 ? block.text : "Your prompt"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
