import { Permission, MemberStatus, CompanyMemberRole } from "@/enums/common.enums"
import { BiUser } from "react-icons/bi";
import { FiClock, FiLock, FiUserCheck, FiUsers } from "react-icons/fi"
import { MdAdminPanelSettings } from "react-icons/md"

export const PERMISSION_OPTIONS = [
    { value: Permission.WRITE, label: "WRITE", description: "Can create new content" },
    { value: Permission.READ, label: "READ", description: "Can view content" },
    { value: Permission.UPDATE, label: "UPDATE", description: "Can modify existing content" },
    { value: Permission.DELETE, label: "DELETE", description: "Can remove content" },
];

// Role options with colors and icons
export const ROLE_OPTIONS = [
    { value: CompanyMemberRole.OWNER, label: "Owner", icon: MdAdminPanelSettings, color: "purple", description: "Full company access and control" },
    { value: CompanyMemberRole.MANAGER, label: "Manager", icon: FiUsers, color: "blue", description: "Management access" },
    { value: CompanyMemberRole.EMPLOYEE, label: "Employee", icon: BiUser, color: "gray", description: "Basic employee access" },
];

export const STATUS_OPTIONS = [
    { value: MemberStatus.ACTIVE, label: "Active", color: "green", icon: FiUserCheck, description: "Full access to company resources" },
    { value: MemberStatus.INACTIVE, label: "Inactive", color: "gray", icon: BiUser, description: "Limited or no access" },
    { value: MemberStatus.PENDING, label: "Pending", color: "yellow", icon: FiClock, description: "Awaiting activation" },
    { value: MemberStatus.SUSPENDED, label: "Suspended", color: "red", icon: FiLock, description: "Access temporarily revoked" },
    { value: MemberStatus.INVITED, label: "Invited", color: "blue", icon: FiClock, description: "Invitation sent, pending acceptance" },
];