import { gql } from '@apollo/client';

export const GET_PAGINATED_COMPANIES = gql`
  query GetPaginatedCompanies(
    $page: Int
    $limit: Int
    $isActive: Boolean
    $search: String
  ) {
    getPaginatedCompanies(
      page: $page
      limit: $limit
      isActive: $isActive
      search: $search
    ) {
      companies {
        id
        name
        logo
        email
        number
        isActive
        address {
          street
          city
          state
          zip
          country
        }
        ownerIds {
         id
         username
         email
        }
        createdAt
        updatedAt
      }
      totalCompaniesCount
    }
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: String!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_COMPANIES = gql`
  mutation DeleteCompanies($ids: [String!]!) {
    deleteCompanies(ids: $ids) {
      success
      message
    }
  }
`;


export const GET_COMPANIES_BY_OWNER = gql`
  query GetCompaniesByOwner($ownerId: String!) {
    getCompaniesByOwner(ownerId: $ownerId) {
      id
      ownerIds
      companyName
      companyEmail
      companyNumber
      isActive
      logo
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMPANY_BY_ID = gql`
  query GetCompanyById($id: String!) {
    getCompanyById(id: $id) {
      id
      ownerIds
      name
      email
      number
      isActive
      logo
      createdAt
      updatedAt
    }
  }
`;

