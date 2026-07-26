import { gql } from "@apollo/client";

export const GET_PAGINATED_TICKETS = gql`
  query GetPaginatedTickets($page: Int!, $limit: Int!, $search: String) {
    getPaginatedTickets(page: $page, limit: $limit, search: $search) {
      tickets {
        id
        name
        email
        phone
        material
        style
        stock
        color
        length
        width
        height
        attachmentUrl
        createdAt
      }
      totalTickets
    }
  }
`;

export const TICKET_COUNT = gql`
  query {
    getTicketCount {
      totalTicketCount
      todayTicketCount
      totalInLast12Months
      last7DaysTicketCount
      recordMonth {
        month
        count
      }
      monthlyCounts {
        month
        count
      }
    }
  }
`;
