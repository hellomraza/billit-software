import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";

type GstStore = {
  gstEnabled: boolean;
  toggleGst: () => void;
};
const useGstStore = create<GstStore>()(
  persist(
    (set) => ({
      gstEnabled: true,
      toggleGst: () => set((state) => ({ gstEnabled: !state.gstEnabled })),
    }),
    {
      name: "gst-storage",
      partialize: (state) => ({ gstEnabled: state.gstEnabled }),
    },
  ),
);

export const useIsGstEnabled = () => useGstStore((state) => state.gstEnabled);

export const useGstActions = () =>
  useGstStore(
    useShallow((state) => {
      return { toggleGst: state.toggleGst };
    }),
  );
