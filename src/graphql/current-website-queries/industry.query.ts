import { gql } from "@apollo/client";

// Query: Get Paginated Industries
export const GET_PAGINATED_INDUSTRIES = gql`
  query GetPaginatedIndustries($page: Int!, $limit: Int!, $search: String) {
    getPaginatedIndustries(page: $page, limit: $limit, search: $search) {
      industries {
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
      totalIndustries
    }
  }
`;

// Mutation: Create Industry
export const CREATE_INDUSTRY = gql`
  mutation CreateIndustry($input: CreateIndustryInput!) {
    createIndustry(input: $input) {
      success
      message
    }
  }
`;

// Mutation: Update Industry
export const UPDATE_INDUSTRY = gql`
  mutation UpdateIndustry($id: ID!, $input: UpdateIndustryInput!) {
    updateIndustry(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Mutation: Delete Industries
export const DELETE_INDUSTRIES = gql`
  mutation DeleteIndustries($ids: [ID!]!) {
    deleteIndustries(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_ALL_INDUSTRY = gql`
  query {
    getAllIndustry {
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

export const CHECK_INDUSTRY_SLUG_UNIQUE = gql`
  query CheckIndustrySlugUnique($slug: String!, $excludeId: String) {
    checkIndustrySlugUnique(slug: $slug, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_INDUSTRY_H1_TAG_UNIQUE = gql`
  query CheckIndustryH1TagUnique($h1Tag: String!, $excludeId: String) {
    checkIndustryH1TagUnique(h1Tag: $h1Tag, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_INDUSTRY_META_TITLE_UNIQUE = gql`
  query CheckIndustryMetaTitleUnique($metaTitle: String!, $excludeId: String) {
    checkIndustryMetaTitleUnique(metaTitle: $metaTitle, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;