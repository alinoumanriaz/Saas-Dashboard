import { Website } from "@/Types/website.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CompanyCurrentWebsiteState {
    loading: boolean;
    companyWebsite: Website | null;
}

const initialState: CompanyCurrentWebsiteState = {
    loading: false,
    companyWebsite: null,
};

const companyCurrentWebsiteSlice = createSlice({
    name: "companyCurrentWebsite",
    initialState,
    reducers: {
        setCompanyCurrentWebsite: (state, action: PayloadAction<Website>) => {
            state.companyWebsite = action.payload;
            state.loading = false;
        },

        clearCompanyCurrentWebsite: (state) => {
            state.companyWebsite = null;
            state.loading = false;
        },

        startLoading: (state) => {
            state.loading = true;
        },
    },
});

export const { setCompanyCurrentWebsite, clearCompanyCurrentWebsite, startLoading } =
    companyCurrentWebsiteSlice.actions;

export default companyCurrentWebsiteSlice.reducer;
