import { gql } from "@apollo/client";

export const GET_PAGE_CONTENT = gql`
  query GetPageContent($slug: String!) {
    getPageContent(slug: $slug) {
      success
      message
      data {
        _id
        slug
        content
        author {
          _id
          username
          email
        }
        createdAt
        updatedAt
      }
    }
  }
`;

// UPDATE Page Content Mutation
export const UPDATE_PAGE_CONTENT = gql`
  mutation UpdatePageContent($id: ID!, $input: UpdateContentInput!) {
    updatePageContent(id: $id, input: $input) {
      success
      message
      data {
        _id
        slug
        content
        author {
          _id
          username
          email
        }
        createdAt
        updatedAt
      }
    }
  }
`;
