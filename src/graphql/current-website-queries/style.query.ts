import { gql } from "@apollo/client";

// Query: Get Paginated Styles
export const GET_PAGINATED_STYLES = gql`
  query GetPaginatedStyles($page: Int!, $limit: Int!, $search: String) {
    getPaginatedStyles(page: $page, limit: $limit, search: $search) {
      styles {
        id
        name
        slug
        description
        h1Tag
        metaDescription
        metaTitle
        imageUrl {
          url
          alt
        }
        bannerImage {
        url
        alt
        }
        iconImageUrl {
        url
        alt
        }
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
export const DELETE_STYLES = gql`
  mutation DeleteStyles($ids: [ID!]!) {
    deleteStyles(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_ALL_STYLES = gql`
  query {
    getAllStyles {
      id
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

export const CHECK_STYLE_SLUG_UNIQUE = gql`
  query CheckStyleSlugUnique($slug: String!, $excludeId: String) {
    checkStyleSlugUnique(slug: $slug, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_STYLE_H1_TAG_UNIQUE = gql`
  query CheckStyleH1TagUnique($h1Tag: String!, $excludeId: String) {
    checkStyleH1TagUnique(h1Tag: $h1Tag, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_STYLE_META_TITLE_UNIQUE = gql`
  query CheckStyleMetaTitleUnique($metaTitle: String!, $excludeId: String) {
    checkStyleMetaTitleUnique(metaTitle: $metaTitle, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;