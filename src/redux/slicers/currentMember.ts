import { Member } from "@/Types/member.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface CurrentMemberState {
  loading: boolean;
  member: Member | null;
  // token: string | null;
}

interface SetMemberPayload {
  member: Member;
  token: string;
}

const initialState: CurrentMemberState = {
  loading: true, // true initially because you're fetching on mount
  member: null,
  // token: typeof window !== "undefined" ? localStorage.getItem("token") : null,

};

const currentMemberSlice = createSlice({
  name: "currentMember",
  initialState,
  reducers: {
    setMember: (state, action: PayloadAction<SetMemberPayload>) => {
      state.member = action.payload.member;
      state.loading = false;
      // state.token = action.payload.token;
      // localStorage.setItem("token", action.payload.token);
    },
    clearMember: (state) => {
      state.member = null;
      state.loading = false;
      // localStorage.removeItem("token");
    },
    startLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setMember, clearMember, startLoading } = currentMemberSlice.actions;
export default currentMemberSlice.reducer;
