// // hooks/usePermissions.ts
// import { useAppSelector } from '@/redux/hooks';
// import { useMemo } from 'react';

// export const usePermissions = () => {
//   const member = useAppSelector((state) => state.currentMember.member);
//   const currentCompany = useAppSelector((state) => state.currentCompany.company);

//   return useMemo(() => ({
//     // Platform level
//     isSuperAdmin: member?.platformRole === 'SUPER_ADMIN',
//     isAdmin: member?.platformRole === 'ADMIN',
//     isOwner: member?.platformRole === 'OWNER',

//     // Company level
//     canManageCompany: () => {
//       if (!currentCompany || !member) return false;
//       return (
//         member.platformRole === 'SUPER_ADMIN' ||
//         currentCompany.ownerId === member.id ||
//         currentCompany.ownerIds?.includes(member.id)
//       );
//     },

//     canAccessCompany: (companyId: string) => {
//       if (!member) return false;
//       return (
//         member.platformRole === 'SUPER_ADMIN' ||
//         member.companies?.some(c => c.id === companyId)
//       );
//     },

//     canPerformAction: (action: string, resource: string) => {
//       // Implement based on your permission system
//       if (member?.platformRole === 'SUPER_ADMIN') return true;
//       return member?.permissions?.includes(`${resource}:${action}`) || false;
//     },
//   }), [member, currentCompany]);
// };