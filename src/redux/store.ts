import { configureStore } from '@reduxjs/toolkit';
import currentMemberReducer from './slicers/currentMember';
import currentCompanyReducer from './slicers/currentCompany';
import currentCompanyMemberReducer from './slicers/currentCompanyMember';
import companyCurrentWebsiteReducer from './slicers/companyCurrentWebsite';
import sidebarToggleReducer from './slicers/sidebarToggle';
// import openConversationReducer from './slicers/openConversation'
// import updaterReducer from './slicers/updater'
export const store = configureStore({
  reducer: {
    currentMember: currentMemberReducer,
    currentCompany: currentCompanyReducer,
    currentCompanyMember: currentCompanyMemberReducer,
    companyCurrentWebsite: companyCurrentWebsiteReducer,
    sidebarToggle: sidebarToggleReducer,
    // openConversation: openConversationReducer,
    // updater: updaterReducer
    // add more reducers here if needed
  },
});

// Inferred types:
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
