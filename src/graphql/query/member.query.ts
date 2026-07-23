import { gql } from "@apollo/client";


export const GET_PAGINATED_MEMBERS = gql`
  query GetPaginatedMembers(
    $page: Int!
    $limit: Int!
    $role: PlatformRole
    $status: Boolean
    $search: String
  ) {
    getPaginatedMembers(
      page: $page
      limit: $limit
      role: $role
      status: $status
      search: $search
    ) {
      members {
        id
        firstName
        lastName
        username
        email
        phone
        avatar
        subscription {
          plan
          startDate
          endDate
          SubscriptionStatus
          paymentMethod
        }
        address {
          street
          city
          state
          zip
          country
        }
        status
        role
        isVerified
        createdAt
        updatedAt
      }
      totalMembersCount
    }
  }
`;

export const DELETE_MEMBERS = gql`
  mutation DeleteMembers($ids: [ID!]!) {
    deleteMembers(ids: $ids) {
      success
      message
    }
  }
`;

export const UPDATE_MEMBER = gql`
  mutation UpdateMember($id: ID!, $input: UpdateMemberInput!) {
    updateMember(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const CREATE_MEMBER = gql`
  mutation CreateMember($input: CreateMemberInput!) {
    createMember(input: $input) {
      success
      message
    }
  }
`;

export const MEMBER_REGISTER = gql`
  mutation RegisterMember($input: MemberRegisterInput!) {
    registerMember(input: $input) {
      token
      member {
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

export const GET_CURRENT_MEMBER = gql`
  query GetCurrentMember {
    getCurrentMember {
      token
      member {
        id
        firstName
        lastName  
        username
        email
        phone
        avatar
        role
        isVerified
        modules {
          moduleId {
            id
            moduleName
            route
            order
            moduleIcon
            moduleType
            description
            status
          }
          isActive
          permissions
        }
        subscription {
          plan
          startDate
          endDate
          SubscriptionStatus
          paymentMethod
        }
        address {
          street
          city
          state
          zip
          country
        }
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const LOGIN_MEMBER = gql`
  mutation LoginMember($input: MemberLoginInput!) {
    loginMember(input: $input) {
      member {
        id
        firstName
        lastName
        username
        email
        role
      }
      token
    }
  }
`;

export const LOGOUT_MEMBER = gql`
  mutation LogoutMember {
    logoutMember
  }
`;

export const GET_MEMBER_PROFILE = gql`
  query GetMemberById($id: String!) {
    getMemberById(id: $id) {
      id
      firstName
      lastName
      username
      email
      phone
      isVerified
      role
      status
      avatar
      createdAt
      updatedAt
      address {
        street
        city
        state
        zip
        country
      }
      modules {
        moduleId
        isActive
        permissions
      }
      subscription {
        plan
        startDate
        endDate
        isActive
        paymentMethod
      }
    }
  }
`;

export const UPDATE_MEMBER_PROFILE = gql`
  mutation UpdateMember($id: String!, $input: UpdateMemberInput!) {
    updateMember(id: $id, input: $input) {
      _id
      id
      firstName
      lastName
      phone
      avatar
      address {
        street
        city
        state
        zip
        country
      }
      updatedAt
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

export const GET_GLOBLE_MEMBERS = gql`
  query GetGlobleMember($excludeCurrentMember: String!, $email: String!) {
    getGlobleMember(
      excludeCurrentMember: $excludeCurrentMember, 
      email: $email,
      ) {
      id
      username
      avatar
      email
      isVerified
    }
  }
`;

export const REGISTER_MEMBER = gql`
  mutation RegisterMember($input: RegisterMemberInput!) {
    registerMember(input: $input) {
      id
      email
      firstName
      lastName
      phone
    }
  }
`;

export const FORGET_PASSWORD = gql`
  mutation ForgetPassword($email: String!) {
    forgetPassword(email: $email){
      success
      message
    }
  }
`

export const VERIFY_PASSWORD = gql`
  mutation VerifyPassword($input: VerifyPasswordInput!){
    verifyPassword(input: $input){
      success
      message
    }
  }
`