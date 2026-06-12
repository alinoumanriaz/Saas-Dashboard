// // src/useReducerHooks/company-filter-reducer.ts
// export interface FilterState {
//   currentPage: number;
//   status?: string;
//   subscriptionPlan?: string;
//   searchText: string;
// }

// export const initialFilterState: FilterState = {
//   currentPage: 1,
//   status: "",
//   subscriptionPlan: "",
//   searchText: "",
// };

// export type FilterAction =
//   | { type: "SET_PAGE"; payload: number }
//   | { type: "SET_STATUS"; payload?: string }
//   | { type: "SET_SUBSCRIPTION_PLAN"; payload?: string }
//   | { type: "SET_SEARCH"; payload: string }
//   | { type: "RESET_FILTERS" };

// export const filterReducer = (
//   state: FilterState,
//   action: FilterAction
// ): FilterState => {
//   switch (action.type) {
//     case "SET_PAGE":
//       return { ...state, currentPage: action.payload };
//     case "SET_STATUS":
//       return { ...state, status: action.payload, currentPage: 1 };
//     case "SET_SUBSCRIPTION_PLAN":
//       return { ...state, subscriptionPlan: action.payload, currentPage: 1 };
//     case "SET_SEARCH":
//       return { ...state, searchText: action.payload, currentPage: 1 };
//     case "RESET_FILTERS":
//       return {
//         ...initialFilterState,
//         currentPage: state.currentPage,
//       };
//     default:
//       return state;
//   }
// };


// src/useReducerHooks/company-filter-reducer.ts
export interface FilterState {
  currentPage: number;
  isActive?: boolean;
  tenantId?: string;
  searchText: string;
}

export const initialFilterState: FilterState = {
  currentPage: 1,
  isActive: undefined,
  tenantId: undefined,
  searchText: "",
};

type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ACTIVE"; payload?: boolean }
  | { type: "SET_TENANT_ID"; payload?: string }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET_FILTERS" };

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ACTIVE":
      return { ...state, isActive: action.payload, currentPage: 1 };
    case "SET_TENANT_ID":
      return { ...state, tenantId: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
}