import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CameraSettingsType } from "./types";

export const cameraSettingsAtom = atomWithStorage<
  Record<string, CameraSettingsType>
>("camera-settings", {});

export const mediaStreamAtom = atom<MediaStream | null>(null);

