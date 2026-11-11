import { gql } from "@apollo/client";

export const GET_PAGINATED_LOCATION_PAGES = gql`
query GetPaginatedLocationPages(
  $page: Int!
  $limit: Int!
  $search: String
) {
  getPaginatedLocationPages(
    page: $page
    limit: $limit
    search: $search
  ) {
    locationPages {
      id
      name
      slug
      h1Tag
      metaTitle
      metaDescription
      shortDescription
      content
      specification
      status
      image {
        url
        alt
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
      createdAt
      updatedAt
    }
    totalLocationPages
  }
}
`

export const DELETE_LOCATION_PAGES = gql`
mutation DeleteLocationPages($ids: [ID!]!) {
  deleteLocationPages(ids: $ids) {
    success
    message
  }
}
`

export const CREATE_LOCATION_PAGES = gql`
mutation CreateLocationPage($input: CreateLocationPageInput!) {
  createLocationPage(input: $input) {
    success
    message
  }
}`

export const UPDATE_LOCATION_PAGES = gql`
mutation UpdateLocationPage($id: ID!, $input: UpdateLocationPageInput!) {
  updateLocationPage(id: $id, input: $input) {
    success
    message
  }
}`

export const GET_ALL_LOCATION_PAGES = gql`
query GetAllLocationPages {
    getAllLocationPages {
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
      image {
        url
        alt
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
      createdAt
      updatedAt
    }
}
`

export const GET_LOCATION_PAGES_BY_SLUG = gql`
query GetLocationPageBySlug($slug: String!) {
  getLocationPageBySlug(slug: $slug) {
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
    image {
      url
      alt
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
    createdAt
    updatedAt
  }
}
`;

export const CHECK_LOCATION_PAGES_SLUG_UNIQUE = gql`
query CheckLocationPageSlugUnique($slug: String!, $excludeId: String) {
  checkLocationPageSlugUnique(slug: $slug, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;

export const CHECK_LOCATION_PAGES_H1_TAG_UNIQUE = gql`
query CheckLocationPageH1TagUnique($h1Tag: String!, $excludeId: String) {
  checkLocationPageH1TagUnique(h1Tag: $h1Tag, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;

export const CHECK_LOCATION_PAGES_META_TITLE_UNIQUE = gql`
query CheckLocationPageMetaTitleUnique($metaTitle: String!, $excludeId: String) {
  checkLocationPageMetaTitleUnique(metaTitle: $metaTitle, excludeId: $excludeId) {
    success
    isUnique
    message
  }
}
`;