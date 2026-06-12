// store/slices/currentCompanySlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Address = {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
};

export type Company = {
    id: string;
    ownerId?: string;
    companyName: string;
    companyEmail: string;
    companyNumber: string;
    isActive: boolean;
    logo?: string;
    address?: Address;
    createdAt: string;  // better as string (comes from API)
    updatedAt: string;
};

interface CurrentCompanyState {
    loading: boolean;
    company: Company | null;
}

const initialState: CurrentCompanyState = {
    loading: false,
    company: null,
};

const currentCompanySlice = createSlice({
    name: "currentCompany",
    initialState,
    reducers: {
        setCompany: (state, action: PayloadAction<Company>) => {
            state.company = action.payload;
            state.loading = false;
        },

        clearCompany: (state) => {
            state.company = null;
            state.loading = false;
        },

        startLoading: (state) => {
            state.loading = true;
        },
    },
});

export const { setCompany, clearCompany, startLoading } =
    currentCompanySlice.actions;

export default currentCompanySlice.reducer;
