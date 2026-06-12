import { gql } from "@apollo/client";

export const GET_PAGINATED_ORDERS = gql`
  query GetPaginatedOrders($page: Int!, $limit: Int!, $search: String) {
    getPaginatedOrders(page: $page, limit: $limit, search: $search) {
      orders {
        _id
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
      totalOrders
    }
  }
`;

export const ORDER_COUNT = gql`
  query {
    getOrderCount {
      totalOrderCount
      todayOrderCount
      totalInLast12Months
      last7DaysOrderCount
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
