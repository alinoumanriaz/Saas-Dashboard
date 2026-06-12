import { gql } from "@apollo/client";

// Query: Get Paginated Styles
export const GET_PAGINATED_STYLES = gql`
  query GetPaginatedStyles($page: Int!, $limit: Int!, $search: String) {
    getPaginatedStyles(page: $page, limit: $limit, search: $search) {
      styles {
        _id
        name
        slug
        iconImageUrl
        imageUrl
        bannerImage
        description
        content
        faqs {
          question
          answer
          order
        }
        createdAt
        updatedAt
      }
      totalStyles
    }
  }
`;

// Mutation: Create Style
export const CREATE_STYLE = gql`
  mutation CreateStyle($input: CreateStyleInput!) {
    createStyle(input: $input) {
      success
      message
    }
  }
`;

// Mutation: Update Style
export const UPDATE_STYLE = gql`
  mutation UpdateStyle($id: ID!, $input: UpdateStyleInput!) {
    updateStyle(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Mutation: Delete Styles
export const DELETE_STYLE = gql`
  mutation DeleteStyles($ids: [ID!]!) {
    deleteStyles(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_ALL_STYLE = gql`
  query {
    getAllStyle {
      _id
      name
      slug
      iconImageUrl
      imageUrl
      bannerImage
      description
      content
      faqs {
        question
        answer
        order
      }
      createdAt
      updatedAt
    }
  }
`;
