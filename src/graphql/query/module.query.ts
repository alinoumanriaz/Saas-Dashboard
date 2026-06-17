import { gql } from "@apollo/client";

export const CREATE_CUSTOM_MODULE = gql`
  mutation CreateCustomModule($input: CreateCustomModuleInput!) {
    createCustomModule(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_CUSTOM_MODULE = gql`
  mutation UpdateCustomModule($id: ID!, $input: UpdateCustomModuleInput!) {
    updateCustomModule(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_CUSTOM_MODULES = gql`
  mutation DeleteCustomModules($ids: [ID!]!) {
    deleteCustomModules(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_CUSTOM_MODULES = gql`
  query GetCustomModules($filter: ModuleFilterInput) {
    getCustomModules(filter: $filter) {
      id
      moduleName
      route
      description
      moduleIcon
      status
      parentModule
      order
      isDefaultForOwner
      isDefaultForAdmin
      isDefaultForSuperAdmin
      createdAt
      updatedAt
    }
  }
`;

export const GET_PAGINATED_CUSTOM_MODULES = gql`
  query GetPaginatedCustomModules($page: Int!, $limit: Int!) {
    getPaginatedCustomModules(page: $page, limit: $limit) {
      customModules {
        id
        moduleName
        route
        description
        moduleIcon
        status
        parentModule
        order
        isDefaultForOwner
        isDefaultForAdmin
        isDefaultForSuperAdmin
        createdAt
        updatedAt
      }
      totalCustomModulesCount
    }
  }
`;