export type UserRole =
  | "super_admin"
  | "academic_dean"
  | "timetable_coordinator"
  | "department_head"
  | "faculty"
  | "student_representative"
  | "venue_manager";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  requiredRole?: UserRole[];
  category?: "core" | "scheduling" | "campus" | "system";
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
