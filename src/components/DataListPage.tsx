// DataListPage.tsx
import { ReactNode } from "react";
import { BiSearch } from "react-icons/bi";
import Container from "@/components/Container";
import TableBox from "@/components/tablebox/TableBox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterX, ListFilter, Plus, RefreshCw } from "lucide-react";

// ---------- Type Definitions ----------
export type StatsCard = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
};

export type FilterConfig = {
  key: string;
  type: "search" | "select" | "boolean";
  placeholder?: string;
  options?: { label: string; value: string }[];
  label?: string;
};

// TableBox configuration – all properties are optional (but column will be handled)
export type TableBoxConfig = {
  column?: string[];
  checkbox?: boolean;
  action?: boolean;
  image?: boolean;
  logo?: boolean;
  iconImageUrl?: boolean;
  bannerImage?: boolean;
  deletehandler?: (id: string[]) => void;
  edithandler?: (userData: any) => void;
  viewhandler?: (data: any) => void;
  status?: boolean;
  MemberStatus?: boolean;
  subscription?: boolean;
  isVerified?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  createdBy?: boolean;
  author?: boolean;
  industry?: boolean;
  material?: boolean;
  style?: boolean;
  isFeatured?: boolean;
  height?: string;
  customRenderers?: Record<string, (value: any, row: any) => React.ReactNode>;
};

export type DataListPageProps = {
  // Header
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  headerActions?: ReactNode;

  // Stats
  stats?: StatsCard[];

  // Filters
  filterConfig: FilterConfig[];
  filterValues: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;

  // Refresh & Add
  onRefresh: () => void;
  refreshing: boolean;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;

  // Table data & pagination
  data: any[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;

  // TableBox config
  tableBoxConfig?: TableBoxConfig;

  // Error
  error?: Error | null;
  onRetry?: () => void;

  // Permissions
  canManage?: boolean;

  // Modals slot
  children?: ReactNode;
};

// ---------- Component ----------
export function DataListPage({
  title,
  subtitle,
  headerActions,
  stats = [],
  filterConfig,
  filterValues,
  onFilterChange,
  onResetFilters,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onRefresh,
  refreshing,
  onAdd,
  addLabel = "Add",
  addDisabled = false,
  data,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  tableBoxConfig = {},
  error,
  onRetry,
  canManage = true,
  children,
}: DataListPageProps) {
  // Extract column with fallback to empty array, and the rest of the config
  const { column = [], ...restTableConfig } = tableBoxConfig;

  // Helper to get display label for filter value
  const getFilterLabel = (key: string, value: any): string => {
    const config = filterConfig.find((f) => f.key === key);
    if (!config) return String(value);
    if (config.type === "select" || config.type === "boolean") {
      const option = config.options?.find((o) => o.value === String(value));
      return option?.label || String(value);
    }
    return String(value);
  };

  return (
    <Container className="overflow-y-auto h-full bg-sidebar ">
      <div className="w-full h-full text-[13px]">
        <div className="w-full h-full overflow-hidden px-4">
          {/* Header */}
          <div className="flex justify-between items-center pb-6">
            <CardHeader className="w-full p-0">
              <CardTitle className="text-xl">{title}</CardTitle>
              {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </CardHeader>

            <div className="flex items-center space-x-3">
              {headerActions}
              {filterConfig.length > 0 && (
                <Button
                  variant="outline"
                  onClick={onToggleFilters}
                  className="gap-2"
                >
                  <ListFilter className="size-4" />
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={refreshing}
                className="gap-1"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    <span>Refresh</span>
                  </>
                )}
              </Button>
              {onAdd && canManage && (
                <Button className="bg-primary/20 hover:text-white text-primary" onClick={onAdd} disabled={addDisabled}>
                  <Plus className="size-4" />
                  {addLabel}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats.length > 0 && (
            <div className="flex gap-4 mb-4">
              {stats.map((stat, idx) => (
                <Card key={idx} className="ring-gray-200 w-64">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium ">
                      {stat.label}
                    </CardTitle>
                    {stat.icon && <span className="h-4 w-4 text-muted-foreground">{stat.icon}</span>}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.description && (
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center ">

            {/* Filter Bar */}
            {showFilters && filterConfig.length > 0 && (
              <div className="w-full mb-4">
                <div className="w-full flex justify-start items-center gap-2 flex-wrap">
                  {filterConfig.map((filter) => {
                    const value = filterValues[filter.key];
                    switch (filter.type) {
                      case "search":
                        return (
                          <div key={filter.key} className="space-y-2 min-w-50">
                            {filter.label && (
                              <label className="text-sm font-medium">{filter.label}</label>
                            )}
                            <div className="relative">
                              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder={filter.placeholder || "Search..."}
                                className="pl-9 bg-white"
                                value={value || ""}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      case "select":
                        return (
                          <div key={filter.key} className="space-y-2 w-40">
                            {filter.label && (
                              <label className="text-sm font-medium">{filter.label}</label>
                            )}
                            <Select
                              value={value === undefined ? "all" : String(value)}
                              onValueChange={(val) =>
                                onFilterChange(filter.key, val === "all" ? undefined : val)
                              }
                            >
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder={filter.placeholder || "All"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {filter.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      case "boolean":
                        return (
                          <div key={filter.key} className="space-y-2 w-40">
                            {filter.label && (
                              <label className="text-sm font-medium">{filter.label}</label>
                            )}
                            <Select
                              value={value === undefined ? "all" : String(value)}
                              onValueChange={(val) =>
                                onFilterChange(
                                  filter.key,
                                  val === "all" ? undefined : val === "true"
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={filter.placeholder || "All"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex w-fit text-nowrap gap-2 items-end px-3 p-1">
                {Object.entries(filterValues).map(([key, val]) => {
                  if (val === undefined || val === "" || val === null) return null;
                  const config = filterConfig.find((f) => f.key === key);
                  if (!config) return null;
                  const label = getFilterLabel(key, val);
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                    >
                      {config.label || key}: {label}
                      <button
                        onClick={() => onFilterChange(key, undefined)}
                        className="ml-2 hover:text-blue-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetFilters}
                  className="text-red-600 ml-auto hover:text-red-700"
                >
                  <FilterX className="size-4 mr-1" />
                </Button>
              </div>
            )}

          </div>



          {/* Table or Error */}
          {error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <div className="font-semibold">Error loading data</div>
              <div className="text-sm mt-1">{error.message}</div>
              {onRetry && (
                <Button
                  variant="destructive"
                  onClick={onRetry}
                  className="mt-3"
                >
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <TableBox
              {...restTableConfig}   // spread all other config
              column={column}        // ensure column is always defined
              data={data}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Slot for modals and extra content */}
      {children}
    </Container>
  );
}