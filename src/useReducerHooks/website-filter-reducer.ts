// src/useReducerHooks/website-filter-reducer.ts

export interface FilterState {
  currentPage: number;
  status: string | undefined;
  searchText: string;
  companyId: string | undefined;
}

export const initialFilterState: FilterState = {
  currentPage: 1,
  status: undefined,
  searchText: "",
  companyId: undefined,
};

export type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_STATUS"; payload: string | undefined }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_COMPANY"; payload: string | undefined }
  | { type: "RESET_FILTERS" };

export const filterReducer = (
  state: FilterState,
  action: FilterAction
): FilterState => {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "SET_COMPANY":
      return { ...state, companyId: action.payload, currentPage: 1 };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
};