import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloLink,
} from "@apollo/client";

import { SetContextLink } from "@apollo/client/link/context";
import { store } from "@/redux/store";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3000/graphql",
  credentials: "include",
});

const authLink = new SetContextLink((prevContext) => {
  const websiteId =
    store.getState().companyCurrentWebsite.companyWebsite?.id;

  return {
    headers: {
      ...prevContext.headers,
      ...(websiteId && {
        "x-website-id": websiteId,
      }),
    },
  };
});

export const client = new ApolloClient({
  link: ApolloLink.from([
    authLink,
    httpLink,
  ]),
  cache: new InMemoryCache(),
});