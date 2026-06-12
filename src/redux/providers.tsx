"use client";
import { Provider } from "react-redux";
import { store } from "./store";
// import { ReduxInit } from "./ReduxInit";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {/* <ReduxInit /> */}
      {children}
    </Provider>
  );
}
