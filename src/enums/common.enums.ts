

export enum CompanyMemberRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE',
}

export enum PlatformRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
}

export enum MemberStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
    INVITED = 'INVITED',
}

export enum COMPANY_MODULES {
  // Website
    PRODUCTS = 'PRODUCTS',
    BLOGS = 'BLOGS',
    CATEGORIES = 'CATEGORIES',
    PAGES = 'PAGES',
    ORDERS = 'ORDERS',
    GALLERY = 'GALLERY',
    REVIEWS = 'REVIEWS',
    USERS = 'USERS',

    //Company Management
    COMPANY_DETAILS = 'COMPANY_DETAILS',
    COMPANY_MEMBERS = 'COMPANY_MEMBERS',
    TEAMS = 'TEAMS',
    WEBSITES = 'WEBSITES',

}
export enum APP_MODULES {
    // APP 
    DASHBOARD = 'DASHBOARD',
    WEBSITE = 'WEBSITE',
    COMPANY = 'COMPANY',
    APP_GALLERY = 'APP_GALLERY',
    COMPANIES = 'COMPANIES',
    MEMBERS = 'MEMBERS',
    
    // Additional Modules
    // COMPANY_SETTINGS = 'COMPANY_SETTINGS',
    // ANALYTICS = 'ANALYTICS',
    // API_ACCESS = 'API_ACCESS',
    // REPORTS = 'REPORTS',
    // SETTINGS = 'SETTINGS',
    // BILLING = 'BILLING',
}

export enum Permission {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
  PENDING = 'PENDING',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum DatabaseType {
  MONGODB = 'MONGODB',
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
}

export enum WebsiteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}