import { gql } from "@apollo/client";

export const GET_PAGINATED_MODULES = gql`
  query GetPaginatedModules(
  ) {
    getPaginatedModules(
    ) {
      modules {
        id
        moduleName
        description
        route
        moduleIcon
        status
        createdAt
        updatedAt
      }
      totalModulesCount
    }
  }
`;

export const DELETE_MODULES = gql`
  mutation DeleteModules($ids: [String!]!) {
    deleteModules(ids: $ids) {
      success
      message
    }
  }
`;

export const CREATE_MODULE = gql`
  mutation CreateModule($input: CreateModuleInput!) {
    createModule(input: $input) {
      id
      moduleName
      status
      createdAt
    }
  }
`;

export const UPDATE_MODULE = gql`
  mutation UpdateModule($id: String!, $input: UpdateModuleInput!) {
    updateModule(id: $id, input: $input) {
      id
      moduleName
      status
      updatedAt
    }
  }
`;