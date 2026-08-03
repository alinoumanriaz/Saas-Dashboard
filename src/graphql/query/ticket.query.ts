import { gql } from '@apollo/client';

export const GET_PAGINATED_TICKETS = gql`
  query GetPaginatedTickets(
    $page: Int
    $limit: Int
    $status: TicketStatus
    $search: String
    $companyId: String
  ) {
    getPaginatedTickets(
      page: $page
      limit: $limit
      status: $status
      search: $search
      companyId: $companyId
    ) {
      tickets {
        id
        ticketNumber
        subject
        status
        priority
        task
        createdAt
        updatedAt
        companyId {
          id
          name
        }
        createdBy {
          id
          username
          avatar
        }
      }
      totalTicketsCount
    }
  }
`;

export const DELETE_TICKETS = gql`
  mutation DeleteTickets($ids: [String!]!) {
    deleteTickets(ids: $ids) {
      success
      message
    }
  }
`;

export const CREATE_TICKET = gql`
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_TICKET = gql`
  mutation UpdateTicket($id: String!, $input: UpdateTicketInput!) {
    updateTicket(id: $id, input: $input) {
      success
      message
    }
  }
`;