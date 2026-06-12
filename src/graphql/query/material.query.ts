import { gql } from "@apollo/client";

// Query: Get Paginated Materials
export const GET_PAGINATED_MATERIALS = gql`
  query GetPaginatedMaterials($page: Int!, $limit: Int!, $search: String) {
    getPaginatedMaterials(page: $page, limit: $limit, search: $search) {
      materials {
        _id
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
      totalMaterials
    }
  }
`;

// Mutation: Create Materials
export const CREATE_MATERIAL = gql`
  mutation CreateMaterial($input: CreateMaterialInput!) {
    createMaterial(input: $input) {
      success
      message
    }
  }
`;

// Mutation: Update Materials
export const UPDATE_MATERIAL = gql`
  mutation UpdateMaterial($id: ID!, $input: UpdateMaterialInput!) {
    updateMaterial(id: $id, input: $input) {
      success
      message
    }
  }
`;

// Mutation: Delete Materials
export const DELETE_MATERIAL = gql`
  mutation DeleteMaterials($ids: [ID!]!) {
    deleteMaterials(ids: $ids) {
      success
      message
    }
  }
`;

export const GET_ALL_MATERIAL = gql`
  query {
    getAllMaterial {
      _id
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
