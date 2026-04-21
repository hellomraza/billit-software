import { create } from "zustand";

type GstStore = {
  gstEnabled: boolean;
  actions: {
    toggleGst: () => void;
  };
};
const useGstStore = create<GstStore>((set) => ({
  gstEnabled: true,
  actions: {
    toggleGst: () => set((state) => ({ gstEnabled: !state.gstEnabled })),
  },
}));

export const useIsGstEnabled = () => useGstStore((state) => state.gstEnabled);

export const useGstActions = () => useGstStore((state) => state.actions);
