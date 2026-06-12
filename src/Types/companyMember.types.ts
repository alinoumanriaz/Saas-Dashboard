import { CompanyMemberRole, MemberStatus } from "@/enums/common.enums";
import { ModuleAccess } from "./common.types";
import { Company } from "./company.types";
import { Member } from "./member.types";
import { Website } from "./website.types";
import { Team } from "./team.types";

export interface CompanyMember {
    id?: string;
    memberId?: string;
    teamId?: string;
    companyId?: string;
    member?: Member
    company?: Company
    team?: Team
    role?: CompanyMemberRole;
    status?: MemberStatus;
    modules?: ModuleAccess[];
    websites?: Website[];
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}