import { gql } from "@apollo/client";

export const GET_PAGINATED_BLOG = gql`
  query GetPaginatedBlogs(
    $page: Int!
    $limit: Int!
    $search: String
    $status: String
  ) {
    getPaginatedBlogs(
      page: $page
      limit: $limit
      search: $search
      status: $status
    ) {
      blogs {
        _id
        title
        imageUrl
        slug
        excerpt
        content
        status
        author {
          _id
          username
          imageUrl
        }
        tags
        isFeatured
        createdAt
        updatedAt
      }
      totalBlogs
    }
  }
`;

export const GET_BLOG_COUNT = gql`
  query {
    getBlogCount {
      blogCount
      lastMonthBlog
    }
  }
`;

export const CHECK_SLUG_UNIQUE = gql`
  query CheckSlugUnique($slug: String!, $excludedId: ID) {
    checkSlugUnique(slug: $slug, excludedId: $excludedId) {
      success
      message
    }
  }
`;

export const CREATE_BLOG = gql`
  mutation CreateBlog($input: CreateBlogInput!) {
    createBlog(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_BLOG = gql`
  mutation UpdateBlog($id: ID!, $input: UpdateBlogInput!) {
    updateBlog(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_BLOG = gql`
  mutation DeleteBlogs($ids: [ID!]!) {
    deleteBlogs(ids: $ids) {
      success
      message
    }
  }
`;
