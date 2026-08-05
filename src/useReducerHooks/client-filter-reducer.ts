export interface FilterState {
  currentPage: number;
  priority?: string; 
  status?: string; 
  searchText: string;
}

export const initialFilterState: FilterState = {
  currentPage: 1,
  priority: undefined,
  status: undefined,
  searchText: "",
};

export type FilterAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PRIORITY"; payload: string | undefined }
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
    case "SET_PRIORITY":
      return { ...state, priority: action.payload, currentPage: 1 };
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