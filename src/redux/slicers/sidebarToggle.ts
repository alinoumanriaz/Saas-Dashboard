import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const sidebarToggleSlice = createSlice({
  name: "sidebarToggle",
  initialState: true,
  reducers: {
    toggle: (state) => !state,
    setSidebar: (_, action: PayloadAction<boolean>) => action.payload, // optional setter
  },
});

export const { toggle, setSidebar } = sidebarToggleSlice.actions;
export default sidebarToggleSlice.reducer;
