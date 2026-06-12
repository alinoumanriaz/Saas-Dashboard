import { gql } from "@apollo/client";

export const GET_PAGINATED_USERS = gql`
  query GetPaginatedUsers(
    $page: Int!
    $limit: Int!
    $role: UserRole
    $isVerified: Boolean
    $search: String
  ) {
    getPaginatedUsers(
      page: $page
      limit: $limit
      role: $role
      isVerified: $isVerified
      search: $search
    ) {
      users {
        id
        username
        email
        phone
        role
        isVerified
        createdAt
        updatedAt
      }
      totalUsersCount
    }
  }
`;

export const DELETE_USERS = gql`
  mutation DeleteUsers($ids: [ID!]!) {
    deleteUsers(ids: $ids) {
      success
      message
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
    }
  }
`;

export const USER_REGISTER = gql`
  mutation RegisterUser($input: UserRegisterInput!) {
    registerUser(input: $input) {
      token
      user {
        _id
        username
        email
        role
        isVerified
        userImage
      }
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      token
      user {
        _id
        username
        role
        isVerified
        imageUrl
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: UserLoginInput!) {
    loginUser(input: $input) {
      token
      user {
        _id
        username
        role
        isVerified
        imageUrl
      }
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation LogoutUser {
    logoutUser
  }
`;
