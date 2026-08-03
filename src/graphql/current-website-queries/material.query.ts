import { gql } from "@apollo/client";

// Query: Get Paginated Materials
export const GET_PAGINATED_MATERIALS = gql`
  query GetPaginatedMaterials($page: Int!, $limit: Int!, $search: String) {
    getPaginatedMaterials(page: $page, limit: $limit, search: $search) {
      materials {
        id
        name
        slug
        description
        h1Tag
        metaDescription
        metaTitle
        imageUrl {
          url
          alt
        }
        bannerImage {
        url
        alt
        }
        iconImageUrl {
        url
        alt
        }
        content
        faqs {
          question
          answer
          order
        }
        createdAt
        updatedAt
      }
      totalMaterials
    }
  }
`;

// Mutation: Create Material
export const CREATE_MATERIAL = gql`
  mutation CreateMaterial($input: CreateMaterialInput!) {
    createMaterial(input: $input) {
      success
      message
    }
  }
`;

// Mutation: Update Material
export const UPDATE_MATERIAL = gql`
  mutation UpdateMaterial($id: ID!, $input: UpdateMaterialInput!) {
    updateMaterial(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Mutation: Delete Materials
export const DELETE_MATERIALS = gql`
  mutation DeleteMaterials($ids: [ID!]!) {
    deleteMaterials(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_ALL_MATERIALS = gql`
  query {
    getAllMaterials {
      id
      name
      slug
      iconImageUrl
      imageUrl
      bannerImage
      description
      content
      faqs {
          question
          answer
          order
        }
      createdAt
      updatedAt
    }
  }
`;

export const CHECK_MATERIAL_SLUG_UNIQUE = gql`
  query CheckMaterialSlugUnique($slug: String!, $excludeId: String) {
    checkMaterialSlugUnique(slug: $slug, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_MATERIAL_H1_TAG_UNIQUE = gql`
  query CheckMaterialH1TagUnique($h1Tag: String!, $excludeId: String) {
    checkMaterialH1TagUnique(h1Tag: $h1Tag, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;

export const CHECK_MATERIAL_META_TITLE_UNIQUE = gql`
  query CheckMaterialMetaTitleUnique($metaTitle: String!, $excludeId: String) {
    checkMaterialMetaTitleUnique(metaTitle: $metaTitle, excludeId: $excludeId) {
      success
      message
      isUnique
    }
  }
`;