import { gql } from "@apollo/client";

export const GET_PAGINATED_PRODUCT = gql`
  query GetPaginatedProducts(
    $page: Int!
    $limit: Int!
    $search: String
    $status: String
    $isFeatured: Boolean
  ) {
    getPaginatedProducts(
      page: $page
      limit: $limit
      search: $search
      status: $status
      isFeatured: $isFeatured
    ) {
      products {
        _id
        name
        slug
        h1Tag
        metaTitle
        metaDescription
        shortDescription
        description
        specification
        status
        industry {
          _id
          name
        }
        materials {
          _id
          name
        }
        styles {
          _id
          name
        }
        author {
          _id
          username
          imageUrl
        }
        tags
        isFeatured
        imageUrl
        createdAt
        updatedAt
      }
      totalProducts
    }
  }
`;

export const GET_PRODUCT_COUNT = gql`
  query {
    getProductCount {
      productCount
      lastMonthProduct
    }
  }
`;

// Mutation: Create Products
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      success
      message
    }
  }
`;

// Mutation: Update Products
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Mutation: Delete Products
export const DELETE_PRODUCT = gql`
  mutation DeleteProducts($ids: [ID!]!) {
    deleteProducts(ids: $ids) {
      success
      message
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

export const CHECK_H1TAG_UNIQUE = gql`
  query CheckH1TagUnique($h1Tag: String!, $excludedId: ID) {
    checkH1TagUnique(h1Tag: $h1Tag, excludedId: $excludedId) {
      success
      message
    }
  }
`;

export const CHECK_METATITLE_UNIQUE = gql`
  query CheckMetaTitleUnique($metaTitle: String!, $excludedId: ID) {
    checkMetaTitleUnique(metaTitle: $metaTitle, excludedId: $excludedId) {
      success
      message
    }
  }
`;
