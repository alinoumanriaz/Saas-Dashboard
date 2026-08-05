import { gql } from "@apollo/client";

export const GET_PAGINATED_CLIENTS = gql`
  query GetPaginatedClients(
    $page: Int!
    $limit: Int!
    $status: String
    $priority: String
    $search: String
  ) {
    getPaginatedClients(
      page: $page
      limit: $limit
      status: $status
      priority: $priority
      search: $search
    ) {
      clients {
        id
        fullName
        email
        secondaryEmail
        phone
        mobile
        whatsapp
        website
        company
        designation
        addresses {
          type
          street
          city
          state
          postalCode
          country
          isDefault
        }
        source
        status
        priority
        isVerified
        isActive
        preferredCurrency
        preferredLanguage
        timezone
        notes
        createdAt
        updatedAt
      }
      totalClientsCount
    }
  }
`;

// Single client by ID
export const GET_CLIENT = gql`
  query GetClient($id: ID!) {
    client(id: $id) {
      id
      fullName
      email
      secondaryEmail
      phone
      mobile
      whatsapp
      website
      company
      designation
      addresses {
        type
        street
        city
        state
        postalCode
        country
        isDefault
      }
      source
      status
      priority
      isVerified
      isActive
      preferredCurrency
      preferredLanguage
      timezone
      notes
      createdAt
      updatedAt
    }
  }
`;

// ---------- Mutations ----------

// Create client (used by AddClient modal)
export const CREATE_CLIENT = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      success
      message
    }
  }
`;

// Update client (used by AddClient modal in edit mode)
export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Delete multiple clients
export const DELETE_CLIENTS = gql`
  mutation DeleteClients($ids: [ID!]!) {
    removeClients(ids: $ids) {
      success
      message
    }
  }
`;