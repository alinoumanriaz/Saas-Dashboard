// src/reducers/filterReducer.ts
export type FilterState = {
  currentPage: number;
  searchText: string;
};

export type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET_FILTERS" };

export const initialFilterState: FilterState = {
  currentPage: 1,
  searchText: "",
};

export function filterReducer(
  state: FilterState,
  action: FilterAction
): FilterState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_SEARCH":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
}
