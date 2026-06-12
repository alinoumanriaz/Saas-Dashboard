import { gql } from "@apollo/client";

// Query: Get Paginated Industries
export const GET_PAGINATED_INDUSTRIES = gql`
  query GetPaginatedIndustries($page: Int!, $limit: Int!, $search: String) {
    getPaginatedIndustries(page: $page, limit: $limit, search: $search) {
      industries {
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
