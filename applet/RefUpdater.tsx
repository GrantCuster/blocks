import { useAtom } from "jotai";
import { BlockIdsAtom, BlockMapAtom, BlockSelectorAtom, CameraAtom, ModeAtom, SelectedBlockIdsAtom, StateRefAtom, ZoomContainerAtom } from "./atoms";
import { useEffect } from "react";

export function RefUpdater() {
  const [stateRef] = useAtom(StateRefAtom);
  const [camera] = useAtom(CameraAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const [mode] = useAtom(ModeAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [blockSelector] = useAtom(BlockSelectorAtom);

  // If you add a new entry make sure you add it to the dependency array
  useEffect(() => {
    stateRef.camera = camera;
    stateRef.blockIds = blockIds;
    stateRef.blockMap = blockMap;
    stateRef.mode = mode;
    stateRef.zoomContainer = zoomContainer;
    stateRef.selectedBlockIds = selectedBlockIds;
  }, [camera, blockIds, blockMap, mode, zoomContainer, selectedBlockIds, blockSelector]);

  return null
}
