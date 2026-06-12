// src/useReducerHooks/company-member-filter-reducer.ts

export interface FilterState {
  currentPage: number;
  role: string | undefined;
  status: string | undefined;
  searchText: string;
}

export const initialFilterState: FilterState = {
  currentPage: 1,
  role: undefined,
  status: undefined,
  searchText: "",
};

export type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ROLE"; payload: string | undefined }
  | { type: "SET_STATUS"; payload: string | undefined }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET_FILTERS" };

export const filterReducer = (
  state: FilterState,
  action: FilterAction
): FilterState => {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ROLE":
      return { ...state, role: action.payload, currentPage: 1 };
    case "SET_STATUS":
      return { ...state, status: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "RESET_FILTERS":
      return {
        ...initialFilterState,
        currentPage: 1,
      };
    default:
      return state;
  }
};