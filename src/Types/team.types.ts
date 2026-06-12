import { CompanyMemberRole, MemberStatus } from "@/enums/common.enums";
import { ModuleAccess } from "./common.types";
import { Company } from "./company.types";
import { Member } from "./member.types";

export interface Team {
    id?: string;
    name?: string;
    description?: string;
    companyId?: string | Company;
    createdBy?: string | Member;
    modules?: ModuleAccess[];
    isActive?: boolean;
    updatedBy?: string | Member;
    createdAt?: Date;
    updatedAt?: Date;
}

// export interface CreateTeamMemberInput {
//     email: string;
//     firstName: string;
//     lastName: string;
//     phone: string;
//     role: CompanyMemberRole;
//     designation?: string;
//     employeeId?: string;
//     modules?: ModuleAccess[];
//     websites?: string[];
// }

// export interface UpdateTeamMemberInput {
//     firstName?: string;
//     lastName?: string;
//     phone?: string;
//     role?: CompanyMemberRole;
//     status?: MemberStatus;
//     modules?: ModuleAccess[];
//     websites?: string[];
//     isActive?: boolean;
// }