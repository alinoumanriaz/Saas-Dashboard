// "use client";
// import { useState, useEffect } from "react";
// import {
//   BiGroup,
//   BiPlus,
//   BiEdit,
//   BiTrash,
//   BiSearch,
//   BiUser,
//   BiUserPlus,
//   BiUserMinus,
//   BiX,
//   BiCheck
// } from "react-icons/bi";
// import {
//   FiUsers,
//   FiRefreshCw,
//   FiCalendar,
//   FiUserCheck
// } from "react-icons/fi";
// import { MdOutlineManageAccounts } from "react-icons/md";
// import Container from "@/components/Container";
// import { useMutation, useQuery } from "@apollo/client/react";
// import { toast } from "react-toastify";
// import { useAppSelector } from "@/redux/hooks";
// import ConfirmationBox from "@/components/popup/models/ConfirmationBox";
// import {
//   GET_TEAMS_BY_COMPANY,
//   CREATE_TEAM,
//   UPDATE_TEAM,
//   DELETE_TEAM,
//   GET_TEAM_MEMBERS,
//   ADD_MEMBERS_TO_TEAM,
//   REMOVE_MEMBERS_FROM_TEAM
// } from "@/graphql/query/team.query";
// import { GET_COMPANY_MEMBERS } from "@/graphql/query/company-member.query";
// import { CompanyMemberRole } from "@/enums/common.enums";
// import { Team } from "@/Types/team.types";
// import { CompanyMember } from "@/Types/companyMember.types";
// import AddTeam from "@/components/popup/models/AddTeam.model";

// const TeamPage = () => {
//   const currentCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);
//   const companyId = currentCompanyMember?.company?.id;
//   const currentUserId = currentCompanyMember?.member?.id;

//   // State
//   const [teams, setTeams] = useState<Team[]>([]);
//   const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
//   const [showTeamModal, setShowTeamModal] = useState(false);
//   const [showMembersModal, setShowMembersModal] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [teamFormData, setTeamFormData] = useState({ name: "", description: "" });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [teamMembers, setTeamMembers] = useState<CompanyMember[]>([]);
//   const [availableMembers, setAvailableMembers] = useState<CompanyMember[]>([]);
//   const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

//   // Permissions
//   const canManageTeams = currentCompanyMember?.role === CompanyMemberRole.OWNER;
//   const canManageTeamMembers = [CompanyMemberRole.OWNER, CompanyMemberRole.MANAGER].includes(
//     currentCompanyMember?.role as CompanyMemberRole
//   );

//   // Queries
//   const { data: teamsData, loading: teamsLoading, refetch: refetchTeams } = useQuery<any>(GET_TEAMS_BY_COMPANY, {
//     variables: { companyId },
//     skip: !companyId,
//   });

//   const { data: membersData, refetch: refetchMembers } = useQuery<any>(GET_COMPANY_MEMBERS, {
//     skip: !companyId,
//   });

//   const { data: teamMembersData, refetch: refetchTeamMembers } = useQuery<any>(GET_TEAM_MEMBERS, {
//     variables: { teamId: selectedTeam?.id },
//     skip: !selectedTeam?.id,
//   });

//   // Mutations
//   const [createTeam] = useMutation<any>(CREATE_TEAM);
//   const [updateTeam] = useMutation<any>(UPDATE_TEAM);
//   const [deleteTeam] = useMutation<any>(DELETE_TEAM);
//   const [addMembersToTeam] = useMutation<any>(ADD_MEMBERS_TO_TEAM);
//   const [removeMembersFromTeam] = useMutation<any>(REMOVE_MEMBERS_FROM_TEAM);

//   // Effects
//   useEffect(() => {
//     if (teamsData?.getTeamsByCompany) {
//       setTeams(teamsData.getTeamsByCompany);
//     }
//   }, [teamsData]);

//   useEffect(() => {
//     if (teamMembersData?.getTeamMembers) {
//       setTeamMembers(teamMembersData.getTeamMembers);
//     }
//   }, [teamMembersData]);

//   useEffect(() => {
//     if (membersData?.getCompanyMember && selectedTeam) {
//       const members = membersData.getCompanyMember;
//       const teamMemberIds = teamMembers.map(m => m.id);
//       const available = members.filter((m: CompanyMember) => !teamMemberIds.includes(m.id));
//       setAvailableMembers(available);
//     }
//   }, [membersData, teamMembers, selectedTeam]);

//   // Filter teams by search
//   const filteredTeams = teams.filter(team =>
//     team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (team.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
//   );

//   // Team CRUD operations
//   const handleCreateTeam = () => {
//     setIsEditMode(false);
//     setSelectedTeam(null);
//     setShowTeamModal(true);
//   };

//   const handleEditTeam = (team: Team) => {
//     setIsEditMode(true);
//     setSelectedTeam(team);
//     setShowTeamModal(true);
//   };

//   const handleDeleteTeam = (teamId: string) => {
//     setTeamToDelete(teamId);
//     setShowDeleteConfirm(true);
//   };

//   const confirmDeleteTeam = async () => {
//     if (!teamToDelete) return;

//     try {
//       const { data } = await deleteTeam({
//         variables: { id: teamToDelete }
//       });

//       if (data?.deleteTeam?.success) {
//         toast.success("Team deleted successfully");
//         refetchTeams();
//       } else {
//         toast.error(data?.deleteTeam?.message || "Failed to delete team");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "An error occurred");
//     } finally {
//       setShowDeleteConfirm(false);
//       setTeamToDelete(null);
//     }
//   };

//   // Member management
//   const handleManageMembers = (team: Team) => {
//     setSelectedTeam(team);
//     setSelectedMembers([]);
//     setShowMembersModal(true);
//     refetchTeamMembers();
//     refetchMembers();
//   };

//   const handleAddMembers = async () => {
//     if (selectedMembers.length === 0) {
//       toast.error("Please select members to add");
//       return;
//     }

//     try {
//       const { data } = await addMembersToTeam({
//         variables: {
//           teamId: selectedTeam?.id,
//           memberIds: selectedMembers
//         }
//       });

//       if (data?.addMembersToTeam?.success) {
//         toast.success(`Added ${selectedMembers.length} member(s) to team`);
//         setSelectedMembers([]);
//         refetchTeamMembers();
//         refetchMembers();
//         refetchTeams(); // Refresh teams to update member counts
//       } else {
//         toast.error(data?.addMembersToTeam?.message || "Failed to add members");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "An error occurred");
//     }
//   };

//   const handleRemoveMember = async (memberId: string) => {
//     if (!window.confirm("Are you sure you want to remove this member from the team?")) return;

//     try {
//       const { data } = await removeMembersFromTeam({
//         variables: {
//           teamId: selectedTeam?.id,
//           memberIds: [memberId]
//         }
//       });

//       if (data?.removeMembersFromTeam?.success) {
//         toast.success("Member removed from team");
//         refetchTeamMembers();
//         refetchMembers();
//         refetchTeams(); // Refresh teams to update member counts
//       } else {
//         toast.error(data?.removeMembersFromTeam?.message || "Failed to remove member");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "An error occurred");
//     }
//   };

//   const toggleMemberSelection = (memberId: string) => {
//     setSelectedMembers(prev =>
//       prev.includes(memberId)
//         ? prev.filter(id => id !== memberId)
//         : [...prev, memberId]
//     );
//   };

//   // Stats
//   const totalTeams = teams.length;
//   const totalTeamMembers = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
//   const avgTeamSize = totalTeams > 0 ? Math.round(totalTeamMembers / totalTeams) : 0;

//   // Helper function to get member details
//   const getMemberDetails = (member: CompanyMember) => ({
//     id: member.member?.id,
//     username: member.member?.username,
//     email: member.member?.email,
//     avatar: member.member?.avatar,
//     phone: member.member?.phone
//   });

//   // Prepare available members for AddTeam component
//   const availableMembersForTeam = membersData?.getCompanyMember?.map((member: CompanyMember) => ({
//     id: member.id,
//     username: member.member?.username || member.member?.email,
//     email: member.member?.email,
//     avatar: member.member?.avatar,
//     phone: member.member?.phone
//   })) || [];

//   return (
//     <Container className="overflow-y-auto h-full">
//       <div className="w-full h-full p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
//             <p className="text-gray-600 mt-1">
//               Manage teams and their members
//             </p>
//           </div>

//           <div className="flex items-center space-x-3">
//             <button
//               onClick={() => refetchTeams()}
//               className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center space-x-2"
//             >
//               <FiRefreshCw className="size-4" />
//               <span>Refresh</span>
//             </button>
//             {canManageTeams && (
//               <button
//                 onClick={handleCreateTeam}
//                 className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center space-x-2"
//               >
//                 <BiPlus className="size-4" />
//                 <span>Create Team</span>
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-2 bg-blue-100 rounded-lg mr-3">
//                 <BiGroup className="w-6 h-6 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Total Teams</p>
//                 <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-2 bg-green-100 rounded-lg mr-3">
//                 <FiUsers className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Total Members</p>
//                 <p className="text-2xl font-bold text-gray-900">{totalTeamMembers}</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-2 bg-purple-100 rounded-lg mr-3">
//                 <MdOutlineManageAccounts className="w-6 h-6 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Avg Team Size</p>
//                 <p className="text-2xl font-bold text-gray-900">{avgTeamSize}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search */}
//         <div className="mb-6">
//           <div className="relative max-w-md">
//             <input
//               type="text"
//               placeholder="Search teams by name or description..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             />
//             <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           </div>
//         </div>

//         {/* Teams Grid */}
//         {teamsLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           </div>
//         ) : filteredTeams.length === 0 ? (
//           <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
//             <BiGroup className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500">No teams found</p>
//             {canManageTeams && (
//               <button
//                 onClick={handleCreateTeam}
//                 className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//               >
//                 Create Your First Team
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredTeams.map((team) => (
//               <div
//                 key={team.id}
//                 className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
//               >
//                 <div className="p-5">
//                   <div className="flex justify-between items-start mb-3">
//                     <div className="flex items-center">
//                       <BiGroup className="w-6 h-6 text-blue-600 mr-2" />
//                       <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
//                     </div>
//                     {canManageTeams && (
//                       <div className="flex space-x-1">
//                         <button
//                           onClick={() => handleEditTeam(team)}
//                           className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                           title="Edit Team"
//                         >
//                           <BiEdit className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleDeleteTeam(team.id)}
//                           className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
//                           title="Delete Team"
//                         >
//                           <BiTrash className="w-4 h-4" />
//                         </button>
//                       </div>
//                     )}
//                   </div>

//                   {team.description && (
//                     <p className="text-gray-600 text-sm mb-4 line-clamp-2">
//                       {team.description}
//                     </p>
//                   )}

//                   <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
//                     <div className="flex items-center">
//                       <FiUsers className="w-4 h-4 mr-1" />
//                       <span>{team.members?.length || 0} members</span>
//                     </div>
//                     <div className="flex items-center">
//                       <FiCalendar className="w-4 h-4 mr-1" />
//                       <span>{new Date(team.createdAt).toLocaleDateString()}</span>
//                     </div>
//                   </div>

//                   {canManageTeamMembers && (
//                     <button
//                       onClick={() => handleManageMembers(team)}
//                       className="w-full mt-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors flex items-center justify-center space-x-2 text-sm"
//                     >
//                       <BiUserPlus className="w-4 h-4" />
//                       <span>Manage Members</span>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Team Create/Edit Modal - AddTeam Component */}
//       {showTeamModal && companyId && (
//         <AddTeam
//           companyId={companyId}
//           teams={teams}
//           selectedTeam={isEditMode ? selectedTeam : null}
//           onClose={() => {
//             setShowTeamModal(false);
//             setSelectedTeam(null);
//             setIsEditMode(false);
//           }}
//           onCreateTeam={createTeam}
//           onUpdateTeam={updateTeam}
//           onDeleteTeam={async (teamId) => {
//             await deleteTeam({ variables: { id: teamId } });
//             refetchTeams();
//           }}
//           canManage={canManageTeams}
//           currentUserRole={currentCompanyMember?.role}
//           currentUserId={currentUserId}
//           availableMembers={availableMembersForTeam}
//           membersLoading={false}
//           onSearchMembers={(query) => {
//             // Implement search if needed
//             console.log("Searching members:", query);
//           }}
//           onAddMemberToTeam={async (teamId, memberId, role) => {
//             // Convert memberId (which is the company member ID) to add to team
//             await addMembersToTeam({
//               variables: {
//                 teamId,
//                 memberIds: [memberId]
//               }
//             });
//             refetchTeams();
//             refetchTeamMembers();
//           }}
//           onRemoveMemberFromTeam={async (teamId, memberId) => {
//             await removeMembersFromTeam({
//               variables: {
//                 teamId,
//                 memberIds: [memberId]
//               }
//             });
//             refetchTeams();
//             refetchTeamMembers();
//           }}
//           onUpdateMemberRole={async (teamId, memberId, role) => {
//             // If your backend supports updating member role within team
//             // Otherwise, remove and add with new role
//             await removeMembersFromTeam({
//               variables: {
//                 teamId,
//                 memberIds: [memberId]
//               }
//             });
//             await addMembersToTeam({
//               variables: {
//                 teamId,
//                 memberIds: [memberId]
//               }
//             });
//             refetchTeams();
//             refetchTeamMembers();
//           }}
//           refetch={() => {
//             refetchTeams();
//             refetchMembers();
//             refetchTeamMembers();
//           }}
//         />
//       )}

//       {/* Manage Members Modal */}
//       {showMembersModal && selectedTeam && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//                   <BiGroup className="mr-2 text-blue-600" />
//                   Manage Team Members - {selectedTeam.name}
//                 </h2>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Add or remove members from this team
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowMembersModal(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <BiX className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="p-6">
//               {/* Current Members */}
//               <div className="mb-8">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//                   <FiUserCheck className="mr-2 text-green-600" />
//                   Current Members ({teamMembers.length})
//                 </h3>
//                 {teamMembers.length === 0 ? (
//                   <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
//                     <BiUser className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//                     <p className="text-gray-500">No members in this team</p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {teamMembers.map((member) => (
//                       <div
//                         key={member.id}
//                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
//                       >
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//                             <BiUser className="w-5 h-5 text-blue-600" />
//                           </div>
//                           <div>
//                             <p className="font-medium text-gray-900">
//                               {member.member?.username || member.member?.email || "Unknown"}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               Role: {member.role}
//                             </p>
//                           </div>
//                         </div>
//                         {canManageTeams && (
//                           <button
//                             onClick={() => handleRemoveMember(member.id)}
//                             className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
//                             title="Remove from team"
//                           >
//                             <BiUserMinus className="w-4 h-4" />
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Add Members */}
//               {availableMembers.length > 0 && canManageTeams && (
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//                     <BiUserPlus className="mr-2 text-blue-600" />
//                     Add Members ({availableMembers.length} available)
//                   </h3>
//                   <div className="border border-gray-200 rounded-lg overflow-hidden">
//                     <div className="max-h-64 overflow-y-auto">
//                       {availableMembers.map((member) => (
//                         <label
//                           key={member.id}
//                           className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
//                         >
//                           <input
//                             type="checkbox"
//                             checked={selectedMembers.includes(member.id)}
//                             onChange={() => toggleMemberSelection(member.id)}
//                             className="mr-3 text-blue-600 focus:ring-blue-500"
//                           />
//                           <div className="flex-1">
//                             <p className="font-medium text-gray-900">
//                               {member.member?.username || member.member?.email || "Unknown"}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               Role: {member.role} • Status: {member.status}
//                             </p>
//                           </div>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                   <div className="mt-4 flex justify-end">
//                     <button
//                       onClick={handleAddMembers}
//                       disabled={selectedMembers.length === 0}
//                       className={`px-4 py-2 rounded-md text-white transition-colors ${
//                         selectedMembers.length === 0
//                           ? "bg-blue-300 cursor-not-allowed"
//                           : "bg-blue-600 hover:bg-blue-700"
//                       }`}
//                     >
//                       Add Selected ({selectedMembers.length})
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {availableMembers.length === 0 && canManageTeams && (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
//                   <BiUserPlus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//                   <p className="text-gray-500">No available members to add</p>
//                   <p className="text-sm text-gray-400 mt-1">
//                     All company members are already in this team
//                   </p>
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-end p-6 border-t bg-gray-50 rounded-b-lg">
//               <button
//                 onClick={() => setShowMembersModal(false)}
//                 className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation */}
//       {showDeleteConfirm && (
//         <ConfirmationBox
//           onCancel={() => setShowDeleteConfirm(false)}
//           onDelete={confirmDeleteTeam}
//           title="Delete Team"
//           message="Are you sure you want to delete this team? This action cannot be undone."
//           confirmText="Delete"
//           cancelText="Cancel"
//         />
//       )}
//     </Container>
//   );
// };

// export default TeamPage;