import { ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: "http://localhost:3000/graphql",
  credentials: "include", // sends cookies automatically
});

const authLink = setContext((_, { headers }) => {
  const websiteId =
    localStorage.getItem('websiteId');

  return {
    headers: {
      ...headers,
      'x-website-id': websiteId || '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    mutate: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
  },
});
