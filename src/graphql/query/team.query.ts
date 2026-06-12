import { gql } from "@apollo/client";

// Query to get all teams for a company
export const GET_TEAMS_BY_COMPANY = gql`
  query GetTeamsByCompany($companyId: String!) {
    getTeamsByCompany(companyId: $companyId) {
      id
      name
      description
      companyId
      createdBy {
        id
        username
        email
      }
      modules {
        moduleName
        description
        canAccess
        isActive
        permissions
      }
      isActive
      createdAt
      updatedAt
    }
  }
`;

// Query to get a single team by ID
export const GET_TEAM_BY_ID = gql`
  query GetTeamById($id: String!) {
    getTeamById(id: $id) {
      id
      name
      description
      companyId
      createdBy {
        id
        username
        email
      }
      modules {
        moduleName
        description
        canAccess
        isActive
        permissions
      }
      isActive
      createdAt
      updatedAt
    }
  }
`;

// Query to get paginated teams
export const GET_PAGINATED_TEAMS = gql`
  query GetPaginatedTeams(
    $companyId: String!
    $page: Float!
    $limit: Float!
    $search: String
    $isActive: Boolean
  ) {
    getPaginatedTeams(
      companyId: $companyId
      page: $page
      limit: $limit
      search: $search
      isActive: $isActive
    ) {
      teams {
        id
        name
        description
        companyId
        createdBy {
          id
          username
          email
        }
        modules {
          moduleName
          description
          canAccess
          isActive
          permissions
        }
        isActive
        createdAt
        updatedAt
      }
      totalTeamsCount
    }
  }
`;

// Query to get team members
export const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers($teamId: String!) {
    getTeamMembers(teamId: $teamId) {
      id
      member {
        id
        email
        username
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
        moduleName
        canAccess
        permissions
      }
      websites
      createdAt
      updatedAt
    }
  }
`;

// Mutation to create a new team
export const CREATE_TEAM = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      success
      message
      team {
        id
        name
        description
        companyId
        createdBy {
          id
          username
          email
        }
        modules {
          moduleName
          description
          canAccess
          isActive
          permissions
        }
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

// Mutation to update a team
export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: String!, $input: UpdateTeamInput!) {
    updateTeam(id: $id, input: $input) {
      success
      message
      team {
        id
        name
        description
        companyId
        createdBy {
          id
          username
          email
        }
        modules {
          moduleName
          description
          canAccess
          isActive
          permissions
        }
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

// Mutation to delete a team
export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: String!) {
    deleteTeam(id: $id) {
      success
      message
    }
  }
`;

// Mutation to add members to a team
export const ADD_MEMBERS_TO_TEAM = gql`
  mutation AddMembersToTeam($teamId: String!, $memberIds: [String!]!) {
    addMembersToTeam(teamId: $teamId, memberIds: $memberIds) {
      success
      message
      team {
        id
        name
        members {
          id
          member {
            id
            username
            email
          }
        }
      }
    }
  }
`;

// Mutation to remove members from a team
export const REMOVE_MEMBERS_FROM_TEAM = gql`
  mutation RemoveMembersFromTeam($teamId: String!, $memberIds: [String!]!) {
    removeMembersFromTeam(teamId: $teamId, memberIds: $memberIds) {
      success
      message
    }
  }
`;

// Mutation to update team modules/permissions
export const UPDATE_TEAM_MODULES = gql`
  mutation UpdateTeamModules($teamId: String!, $modules: [ModuleAccessInput!]!) {
    updateTeamModules(teamId: $teamId, modules: $modules) {
      success
      message
      team {
        id
        modules {
          moduleName
          description
          canAccess
          isActive
          permissions
        }
      }
    }
  }
`;

// Mutation to assign team to a company member
export const ASSIGN_TEAM_TO_MEMBER = gql`
  mutation AssignTeamToMember($companyMemberId: String!, $teamId: String!) {
    assignTeamToMember(companyMemberId: $companyMemberId, teamId: $teamId) {
      success
      message
      companyMember {
        id
        team {
          id
          name
        }
      }
    }
  }
`;

// Mutation to remove team from a company member
export const REMOVE_TEAM_FROM_MEMBER = gql`
  mutation RemoveTeamFromMember($companyMemberId: String!) {
    removeTeamFromMember(companyMemberId: $companyMemberId) {
      success
      message
      companyMember {
        id
        team {
          id
          name
        }
      }
    }
  }
`;

// Mutation to bulk assign teams to members
export const BULK_ASSIGN_TEAM_TO_MEMBERS = gql`
  mutation BulkAssignTeamToMembers($teamId: String!, $memberIds: [String!]!) {
    bulkAssignTeamToMembers(teamId: $teamId, memberIds: $memberIds) {
      success
      message
      updatedCount
    }
  }
`;

// Query to get company members not in a specific team
export const GET_MEMBERS_NOT_IN_TEAM = gql`
  query GetMembersNotInTeam($companyId: String!, $teamId: String!, $search: String) {
    getMembersNotInTeam(companyId: $companyId, teamId: $teamId, search: $search) {
      id
      member {
        id
        username
        email
        avatar
      }
      role
      status
    }
  }
`;

// Query to get team statistics
export const GET_TEAM_STATISTICS = gql`
  query GetTeamStatistics($companyId: String!) {
    getTeamStatistics(companyId: $companyId) {
      totalTeams
      totalTeamMembers
      averageTeamSize
      teamsByDepartment {
        teamId
        teamName
        memberCount
      }
      activeTeams
      inactiveTeams
    }
  }
`;