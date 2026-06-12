import { COMPANY_MODULES, APP_MODULES, Permission, MemberStatus, CompanyMemberRole } from "@/enums/common.enums"
import { BiUser } from "react-icons/bi";
import { FiClock, FiFileText, FiLock, FiUserCheck, FiUsers } from "react-icons/fi"
import { MdStore, MdDescription, MdCategory, MdShoppingCart, MdPhotoLibrary, MdRateReview, MdPeople, MdBusiness, MdGroup, MdLanguage, MdDashboard, MdApps, MdApartment, MdPerson, MdAdminPanelSettings } from "react-icons/md"


export const AVAILABLE_MODULES = [
    // Website modules
    { name: COMPANY_MODULES.PRODUCTS, slug: "website/products", label: "Products", description: "Manage products and inventory", icon: MdStore },
    { name: COMPANY_MODULES.BLOGS, slug: "website/blogs", label: "Blogs", description: "Create and manage blog posts", icon: MdDescription },
    { name: COMPANY_MODULES.CATEGORIES, slug: "website/categories", label: "Categories", description: "Manage product categories", icon: MdCategory },
    { name: COMPANY_MODULES.PAGES, slug: "website/pages", label: "Pages", description: "Manage website pages", icon: FiFileText },
    { name: COMPANY_MODULES.ORDERS, slug: "website/orders", label: "Orders", description: "View and manage orders", icon: MdShoppingCart },
    { name: COMPANY_MODULES.GALLERY, slug: "website/gallery", label: "Gallery", description: "Manage media gallery", icon: MdPhotoLibrary },
    { name: COMPANY_MODULES.REVIEWS, slug: "website/reviews", label: "Reviews", description: "Manage customer reviews", icon: MdRateReview },
    { name: COMPANY_MODULES.USERS, slug: "website/users", label: "Users", description: "Manage website users", icon: MdPeople },
    // Company management modules
    { name: COMPANY_MODULES.COMPANY_DETAILS, slug: "company/company-details", label: "Company Details", description: "View and edit company information", icon: MdBusiness },
    { name: COMPANY_MODULES.COMPANY_MEMBERS, slug: "company/company-members", label: "Company Members", description: "Manage team members and permissions", icon: MdGroup },
    { name: COMPANY_MODULES.TEAMS, slug: "company/teams", label: "Teams", description: "Create and manage teams", icon: MdGroup },
    { name: COMPANY_MODULES.WEBSITES, slug: "company/websites", label: "Websites", description: "Manage websites and domains", icon: MdLanguage },
    // App modules
    { name: APP_MODULES.DASHBOARD, slug: "dashboard", label: "Dashboard", description: "Application dashboard", icon: MdDashboard },
    { name: APP_MODULES.WEBSITE, slug: "website", label: "Website Management", description: "Manage websites across the platform", icon: MdLanguage },
    { name: APP_MODULES.COMPANY, slug: "company", label: "Company Management", description: "Manage company settings", icon: MdBusiness },
    { name: APP_MODULES.APP_GALLERY, slug: "app-gallery", label: "App Gallery", description: "Browse and install apps", icon: MdApps },
    { name: APP_MODULES.COMPANIES, slug: "companies", label: "Companies", description: "View all companies", icon: MdApartment },
    { name: APP_MODULES.MEMBERS, slug: "members", label: "All Members", description: "View all members (super admin)", icon: MdPerson },
];

export const PERMISSION_OPTIONS = [
    { value: Permission.CREATE, label: "Create", description: "Can create new content" },
    { value: Permission.READ, label: "Read", description: "Can view content" },
    { value: Permission.UPDATE, label: "Update", description: "Can modify existing content" },
    { value: Permission.DELETE, label: "Delete", description: "Can remove content" },
];

type ModuleName = COMPANY_MODULES | APP_MODULES;

export const ROLE_BASED_DEFAULT_MODULES: Record<CompanyMemberRole, { modules: ModuleName[]; permissions: Permission[]; defaultStatus: MemberStatus }> = {
    [CompanyMemberRole.SUPER_ADMIN]: {
        modules: [
            APP_MODULES.DASHBOARD,
            APP_MODULES.COMPANIES,
            APP_MODULES.MEMBERS,
        ],
        permissions: [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE],
        defaultStatus: MemberStatus.ACTIVE,
    },
    [CompanyMemberRole.OWNER]: {
        modules: [
            // All website modules
            COMPANY_MODULES.PRODUCTS,
            COMPANY_MODULES.BLOGS,
            COMPANY_MODULES.CATEGORIES,
            COMPANY_MODULES.PAGES,
            COMPANY_MODULES.ORDERS,
            COMPANY_MODULES.GALLERY,
            COMPANY_MODULES.REVIEWS,
            COMPANY_MODULES.USERS,
            // All company management modules
            COMPANY_MODULES.COMPANY_DETAILS,
            COMPANY_MODULES.COMPANY_MEMBERS,
            COMPANY_MODULES.TEAMS,
            COMPANY_MODULES.WEBSITES,
            // All app modules
            APP_MODULES.DASHBOARD,
            APP_MODULES.WEBSITE,
            APP_MODULES.COMPANY,
            APP_MODULES.COMPANIES,
        ],
        permissions: [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE],
        defaultStatus: MemberStatus.ACTIVE,
    },
    [CompanyMemberRole.MANAGER]: {
        modules: [
            // Website modules
            COMPANY_MODULES.PRODUCTS,
            COMPANY_MODULES.BLOGS,
            COMPANY_MODULES.CATEGORIES,
            COMPANY_MODULES.PAGES,
            COMPANY_MODULES.ORDERS,
            COMPANY_MODULES.GALLERY,
            COMPANY_MODULES.REVIEWS,
            COMPANY_MODULES.USERS,
            // All company management modules
            COMPANY_MODULES.COMPANY_DETAILS,
            COMPANY_MODULES.COMPANY_MEMBERS,
            COMPANY_MODULES.TEAMS,
            COMPANY_MODULES.WEBSITES,
            // Some app modules
            APP_MODULES.DASHBOARD,
            APP_MODULES.WEBSITE,
            APP_MODULES.COMPANY,
        ],
        permissions: [Permission.CREATE, Permission.READ, Permission.UPDATE],
        defaultStatus: MemberStatus.ACTIVE,
    },
    [CompanyMemberRole.EMPLOYEE]: {
        modules: [
            // Basic website modules only
            COMPANY_MODULES.PRODUCTS,
            COMPANY_MODULES.BLOGS,
            COMPANY_MODULES.CATEGORIES,
            COMPANY_MODULES.PAGES,
            COMPANY_MODULES.ORDERS,
            COMPANY_MODULES.GALLERY,
            COMPANY_MODULES.REVIEWS,
            COMPANY_MODULES.USERS,
            // All company management modules
            COMPANY_MODULES.COMPANY_DETAILS,
            // Some app modules
            APP_MODULES.DASHBOARD,
            APP_MODULES.WEBSITE,
            APP_MODULES.COMPANY,
        ],
        permissions: [Permission.READ],
        defaultStatus: MemberStatus.ACTIVE,
    },
};


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