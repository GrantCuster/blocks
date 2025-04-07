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

  useEffect(() => {
    // keyboard shortcuts
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelectedBlocks();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
