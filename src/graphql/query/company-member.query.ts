import { gql } from "@apollo/client";

export const GET_PAGINATED_COMPANY_MEMBERS = gql`
  query GetPaginatedCompanyMembers(
    $companyId: String!
    $page: Float!
    $limit: Float!
    $role: CompanyMemberRole
    $status: MemberStatus
    $search: String
  ) {
    getPaginatedCompanyMembers(
      companyId: $companyId
      page: $page
      limit: $limit
      role: $role
      status: $status
      search: $search
    ) {
      companyMembers {
        id
        member {
          id
          email
          username
          phone
          avatar
        }
        company {
          id
          name
        }
        role
        status
        modules {
          name
          canAccess
          permissions
        }
        websites
        createdAt
        updatedAt
      }
      totalCompanyMembersCount
    }
  }
`;

export const REMOVE_COMPANY_MEMBERS = gql`
  mutation RemoveCompanyMembers($ids: [String!]!) {
    removeCompanyMembers(ids: $ids) {
      success
      message
    }
  }
`;

export const CREATE_COMPANY_MEMBER = gql`
  mutation CreateCompanyMember($input: CreateCompanyMemberInput!) {
    createCompanyMember(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_COMPANY_MEMBER = gql`
  mutation UpdateCompanyMember($id: String!, $input: UpdateCompanyMemberInput!) {
    updateCompanyMember(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const GET_COMPANY_MEMBERS = gql`
query {
    getCompanyMember{
        id
        member {
          id
          email
          firstName
          lastName
          fullName
          phone
          avatar
        }
        company {
          id
          name
        }
        role
        status
        modules {
          name
          canAccess
          permissions
        }
        websites {
          id
          name
          domain
        }
        createdAt
        updatedAt
    }
}
`

export const GET_COMPANIES_OF_CURRENT_MEMBER_BY_ID = gql`
query GetCompaniesOfCurrentMemberById($id: String!) {
  getCompaniesOfCurrentMemberById(id: $id) {
    companyMembers {
      id
      member {
      id
      username
      email
      }
      company {
      id
      name
      }
      role
      status
      websites
      modules {
          module {
            id
            moduleName
            route
            moduleIcon
            description
            status
          }
          isActive
          permissions
        }
      createdAt
      updatedAt
    }
    totalCompanyMembersCount
  }
}
`