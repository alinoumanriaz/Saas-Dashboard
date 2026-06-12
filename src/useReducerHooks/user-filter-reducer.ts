// src/reducers/filterReducer.ts
export type FilterState = {
  currentPage: number;
  role?: string;
  status?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  searchText: string;
};

export type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ROLE"; payload?: string }
  | { type: "SET_STATUS"; payload?: string }
  | { type: "SET_VERIFIED"; payload?: boolean }
  | { type: "SET_FEATURED"; payload?: boolean }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET_FILTERS" };

export const initialFilterState: FilterState = {
  currentPage: 1,
  role: undefined,
  status: undefined,
  isVerified: undefined,
  isFeatured: undefined,
  searchText: "",
};

export function filterReducer(
  state: FilterState,
  action: FilterAction
): FilterState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_ROLE":
      return { ...state, role: action.payload, currentPage: 1 };
    case "SET_STATUS":
      return { ...state, status: action.payload, currentPage: 1 };
    case "SET_VERIFIED":
      return { ...state, isVerified: action.payload, currentPage: 1 };
    case "SET_FEATURED":
      return { ...state, isFeatured: action.payload, currentPage: 1 };
    case "SET_SEARCH":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
}
