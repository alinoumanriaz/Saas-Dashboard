import { Address } from "./common.types";
import { Website } from "./website.types";

export interface Company {
  id?: string;
  name?: string;
  logo?: string;
  email?: string;
  number?: string;
  isActive?: boolean;
  address?: Address;
  websites?: Website[];
  ownerIds?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedCompanies {
  companies?: Company[];
  totalCompaniesCount?: number;
  currentPage?: number;
  totalPages?: number;
}
