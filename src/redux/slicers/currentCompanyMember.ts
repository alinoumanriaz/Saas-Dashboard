import { CompanyMember } from "@/Types/companyMember.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface CurrentCompanyState {
    loading: boolean;
    companyMember: CompanyMember | null;
}

const initialState: CurrentCompanyState = {
    loading: false,
    companyMember: null,
};

const currentCompanyMemberSlice = createSlice({
    name: "currentCompanyMember",
    initialState,
    reducers: {
        setCompanyMember: (state, action: PayloadAction<CompanyMember>) => {
            state.companyMember = action.payload;
            state.loading = false;
        },

        clearCompanyMember: (state) => {
            state.companyMember = null;
            state.loading = false;
        },

        startLoading: (state) => {
            state.loading = true;
        },
    },
});

export const { setCompanyMember, clearCompanyMember, startLoading } = currentCompanyMemberSlice.actions;

export default currentCompanyMemberSlice.reducer;
