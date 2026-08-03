// import { gql } from "@apollo/client";

// export const GET_HOME_PAGE = gql`
//   query GetPage {
//     getPage(slug: "home") {
//       id
//       slug
//       content
//       h1Tag
//       metaTitle
//       metaDescription
//       shortDescription
//       bannerImages {
//         mobilebannerImage {
//           url
//           alt
//         }
//         desktopbannerImage {
//           url
//           alt
//         }
//       }
//       updatedAt
//     }
//   }
// `;

// export const GET_ABOUT_PAGE = gql`
//   query GetPage {
//     getPage(slug: "about-us") {
//       id
//       slug
//       content
//       h1Tag
//       metaTitle
//       metaDescription
//       shortDescription
//       updatedAt
//     }
//   }
// `;

// export const UPDATE_HOME_PAGE = gql`
//   mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
//     updatePage(id: $id, input: $input) {
//       success
//       message
//       page {
//         id
//         slug
//         content
//         h1Tag
//         metaTitle
//         metaDescription
//         shortDescription
//         bannerImages {
//           mobilebannerImage {
//             url
//             alt
//           }
//           desktopbannerImage {
//             url
//             alt
//           }
//         }
//         updatedAt
//       }
//     }
//   }
// `;

// export const CHECK_UNIQUE = gql`
//   query CheckUnique($input: CheckUniqueInput!) {
//     checkUnique(input: $input) {
//       isUnique
//       success
//       message
//     }
//   }
// `;