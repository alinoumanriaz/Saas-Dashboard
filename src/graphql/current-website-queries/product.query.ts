import { gql } from "@apollo/client";

export const GET_PAGINATED_PRODUCTS = gql`
query GetPaginatedProducts(
  $page: Int!
  $limit: Int!
  $search: String
  $status: String
  $isFeatured: Boolean
  $industry: ID
  $material: ID
  $style: ID
) {
  getPaginatedProducts(
    page: $page
    limit: $limit
    search: $search
    status: $status
    isFeatured: $isFeatured
    industry: $industry
    material: $material
    style: $style
  ) {
    products {
      id
      name
      slug
      h1Tag
      metaTitle
      metaDescription
      shortDescription
      description
      specification
      status
      isFeatured
      imageUrl {
        url
        alt
      }
      industry {
        id
        name
      }
      material {
        id
        name
      }
      style {
        id
        name
      }
      author {
        memberId {
          username
        }
      }
      faqs {
        question
        answer
        order
      }
      tags
      lowPrice
      highPrice
      createdAt
      updatedAt
    }
    totalProducts
  }
}
`

export const DELETE_PRODUCTS = gql`
mutation DeleteProducts($ids: [ID!]!) {
  deleteProducts(ids: $ids) {
    success
    message
  }
}
`

export const CREATE_PRODUCT = gql`
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    success
    message
  }
}`

export const UPDATE_PRODUCT = gql`
mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    success
    message
  }
}`

export const GET_ALL_PRODUCTS = gql`
query GetAllProducts {
    getAllProducts {
      id
      name
      slug
      h1Tag
      metaTitle
      metaDescription
      shortDescription
      description
      specification
      status
      isFeatured
      imageUrl {
        url
        alt
      }
      industry {
        id
        name
      }
      material {
        id
        name
      }
      style {
        id
        name
      }
      author {
        id
        username
        email
      }
      faqs {
        question
        answer
        order
      }
      tags
      lowPrice
      highPrice
      createdAt
      updatedAt
    }
}
`

export const GET_PRODUCT_BY_SLUG = gql`
query GetProductBySlug($slug: String!) {
  getProductBySlug(slug: $slug) {
    id
    name
    slug
    h1Tag
    metaTitle
    metaDescription
    shortDescription
    description
    specification
    status
    isFeatured
    imageUrl {
      url
      alt
    }
    industry {
      id
      name
    }
    material {
      id
      name
    }
    style {
      id
      name
    }
    author {
      id
      username
      email
    }
    faqs {
      question
      answer
      order
    }
    tags
    lowPrice
    highPrice
    createdAt
    updatedAt
  }
}
`;

export const CHECK_PRODUCT_SLUG_UNIQUE = gql`
query CheckProductSlugUnique($slug: String!, $excludeId: ID) {
  checkProductSlugUnique(slug: $slug, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;

export const CHECK_PRODUCT_H1_TAG_UNIQUE = gql`
query CheckProductH1TagUnique($h1Tag: String!, $excludeId: ID) {
  checkProductH1TagUnique(h1Tag: $h1Tag, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;

export const CHECK_PRODUCT_META_TITLE_UNIQUE = gql`
query CheckProductMetaTitleUnique($metaTitle: String!, $excludeId: ID) {
  checkProductMetaTitleUnique(metaTitle: $metaTitle, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;