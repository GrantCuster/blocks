import { useAtom } from "jotai";
import { useEffect } from "react";
import { BlockIdsAtom, BlockMapAtom, StateRefAtom } from "./atoms";

export function Keyboard() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);

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
    // TODO: fill in
  }

  useEffect(() => {
    // keyboard shortcuts
    function handleKeyDown(event: KeyboardEvent) {
      // TODO: update to work
      const isCmdOrCtrl = event.altKey;
      if (event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelectedBlocks();
      }
      if (isCmdOrCtrl && event.key === "d") {
        handleDuplicateBlocks();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
