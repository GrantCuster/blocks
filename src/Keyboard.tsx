import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "./atoms";
import { v4 as uuid } from "uuid";

export function Keyboard() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  function handleDeleteSelectedBlocks() {
    if (stateRef.selectedBlockIds.length > 0) {
      setBlockIds((prev) =>
        prev.filter((id) => !stateRef.selectedBlockIds.includes(id)),
      );
      setBlockMap((prev) => {
        const newMap = { ...prev };
        stateRef.selectedBlockIds.forEach((id) => {
          delete newMap[id];
        });
        return newMap;
      });
    }
  }

  function handleDuplicateBlocks() {
    const newBlockMap = { ...stateRef.blockMap };
    const newBlockIds = [...stateRef.blockIds];
    let newSelectedBlockIds: string[] = []
    stateRef.selectedBlockIds.forEach((id) => {
      const block = stateRef.blockMap[id];
      if (block) {
        const newBlock = {
          ...block,
          id: uuid(),
          x: block.x + 16,
          y: block.y + 16,
        };
        newBlockMap[newBlock.id] = newBlock;
        newBlockIds.push(newBlock.id);
        newSelectedBlockIds.push(newBlock.id);
      }
    });
    setBlockMap(newBlockMap);
    setBlockIds(newBlockIds);
    setSelectedBlockIds(newSelectedBlockIds);
  }

  useEffect(() => {
    let isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    function handleKeyDown(event: KeyboardEvent) {
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
      if (event.key === "Backspace") {
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA")
        ) {
          return;
        }
        handleDeleteSelectedBlocks();
      }
      if (isCmdOrCtrl && event.key === "d") {
        event.preventDefault();
        handleDuplicateBlocks();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
