// src/app/models/role.model.ts
export interface Role { id: number; name: string; }
export interface RoleDetails extends Role { permissions: string[]; }

export const AllPermissions = [
  "Permissions.Blog.Create", "Permissions.Blog.Delete", "Permissions.Blog.Edit", "Permissions.Blog.View",
  "Permissions.Department.Create", "Permissions.Department.Delete", "Permissions.Department.Edit", "Permissions.Department.View",
  "Permissions.Faculty.Create", "Permissions.Faculty.Delete", "Permissions.Faculty.Edit", "Permissions.Faculty.View",
  "Permissions.Mail.Delete", "Permissions.Mail.Reply", "Permissions.Mail.View",
  "Permissions.Project.Create", "Permissions.Project.Delete", "Permissions.Project.Edit", "Permissions.Project.View",
  "Permissions.Project.Evaluate", "Permissions.Project.Supervise", "Permissions.Project.ViewHistory",
  "Permissions.Role.Create", "Permissions.Role.Delete", "Permissions.Role.Edit", "Permissions.Role.View",
  "Permissions.User.ChangePassword", "Permissions.User.ChangeRole",
  "Permissions.User.Create", "Permissions.User.Delete", "Permissions.User.Edit", "Permissions.User.View",
  "Permissions.Staff.Create", "Permissions.Staff.View",
  "Permissions.Category.Create", "Permissions.Category.Edit", "Permissions.Category.View"
].sort();
