import { gql } from "@apollo/client";

// 🔍 Get limited reviews
export const GET_LIMITED_REVIEWS = gql`
  query GetLimitedReviews($limit: Int!) {
    getLimitedReviews(limit: $limit) {
      _id
      customerName
      slug
      imageUrl
      content
      createdAt
    }
  }
`;

// 🔍 Get all reviews with pagination + search
export const GET_ALL_REVIEWS = gql`
  query GetAllReviews($page: Int!, $limit: Int!, $search: String) {
    getAllReviews(page: $page, limit: $limit, search: $search) {
      totalReviews
      reviews {
        _id
        customerName
        slug
        imageUrl
        content
        createdAt
      }
    }
  }
`;

// ➕ Create review
export const CREATE_REVIEW = gql`
  mutation CreateReview($input: ReviewInput!) {
    createReview(input: $input) {
      success
      message
    }
  }
`;

// ✏️ Update review
export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: ID!, $input: ReviewInput!) {
    updateReview(id: $id, input: $input) {
      success
      message
    }
  }
`;

// ❌ Delete reviews
export const DELETE_REVIEWS = gql`
  mutation DeleteReviews($ids: [ID!]!) {
    deleteReviews(ids: $ids) {
      success
      message
    }
  }
`;
