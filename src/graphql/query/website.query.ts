import { gql } from '@apollo/client';

export const GET_PAGINATED_WEBSITES = gql`
  query GetPaginatedWebsites(
    $page: Int
    $limit: Int
    $status: WebsiteStatus
    $search: String
    $companyId: String
  ) {
    getPaginatedWebsites(
      page: $page
      limit: $limit
      status: $status
      search: $search
      companyId: $companyId
    ) {
      websites {
        id
        companyId
        name
        domain
        status
        database {
          name
          type
          host
          port
          username
          password
        }
        cloudinary {
          folderName
          cloudinaryName
          cloudinaryNameApiKey
          cloudinaryNameApiKeySecret
        }
        createdAt
        updatedAt
      }
      totalWebsitesCount
    }
  }
`;

export const CREATE_WEBSITE = gql`
  mutation CreateWebsite($input: CreateWebsiteInput!) {
    createWebsite(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_WEBSITE = gql`
  mutation UpdateWebsite($id: String!, $input: UpdateWebsiteInput!) {
    updateWebsite(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_WEBSITES = gql`
  mutation DeleteWebsites($ids: [String!]!) {
    deleteWebsites(ids: $ids) {
      success
      message
    }
  }
`;


export const GET_WEBSITES_BY_COMPANY_ID = gql`
  query GetWebsitesByCompanyId($companyId: String!) {
    getWebsitesByCompanyId(companyId: $companyId) {
      id
      name
      domain
      createdAt
      updatedAt
    }
  }
`;

export const GET_WEBSITE_BY_ID = gql`
  query GetWebsiteById($id: String!) {
    getWebsiteById(id: $id) {
      name
      domain
      createdAt
      updatedAt
    }
  }
`;