// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

// --- Import all your components ---
import { HomeComponent } from './components/home/home.component';
import { PrivacyPolicyComponent } from './components/Components/privacy/privacy.component';
import { documentaionComponent } from './components/Components/documentaion/documentaion.component';
import { UnauthorizedComponent } from './components/Components/unauthorized/unauthorized.component';
import { LoginComponent } from './components/auth/login/login.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { DetailsBlogComponent } from './components/blogs/detail-blog/details-blog.component';
import { AllBlogsUserComponent } from './components/blogs/all-blogs-user/all-blogs-user.component';
import { AllStaffComponent } from './components/staff/all-staff/all-staff.component';
import { MyProfileComponent } from './components/User/my-profile/my-profile.component';
import { ChatComponent } from './components/chat-AI/chat.component';
import { UserProfileComponent } from './components/User/user-profile/user-profile.component';
import { MyProjectsComponent } from './components/project/my-projects/my-projects.component';
import { ProjectDetailsComponent } from './components/project/project-details/project-details.component';
import { AddProjectComponent } from './components/project/add-project/add-project.component';
import { EditProjectComponent } from './components/project/edit-project/edit-project.component';
import { ProjectListComponent } from './components/project/project-list/project-list.component';
import { ProjectAnalysisComponent } from './components/project/project-analysis/project-analysis.component';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { NotificationsPageComponent } from './components/Components/notifications-page/notifications-page.component';
import { UserManagementComponent } from './components/User/user-management/user-management.component';
import { UserAnalyticsComponent } from './components/User/user-analytics/user-analytics.component';
import { RoleListComponent } from './components/Roles/role-list/role-list.component';
import { AddRoleComponent } from './components/Roles/add-role/add-role.component';
import { EditRoleComponent } from './components/Roles/edit-role/edit-role.component';
import { RoleDetailsComponent } from './components/Roles/role-details/role-details.component';
import { MailListComponent } from './components/Mails/mail-list/mail-list.component';
import { MailReplyComponent } from './components/Mails/mail-reply/mail-reply.component';
import { AddFacultyComponent } from './components/faculty/add-faculty/add-faculty.component';
import { FacultyEditComponent } from './components/faculty/faculty-edit/faculty-edit.component';
import { FacultyListComponent } from './components/faculty/faculty-list/faculty-list.component';
import { DepartmentListComponent } from './components/Departments/department-list/department-list.component';
import { DepartmentCreateComponent } from './components/Departments/department-create/department-create.component';
import { DepartmentEditComponent } from './components/Departments/department-edit/department-edit.component';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { AddCategoryComponent } from './components/category/add-category/add-category.component';
import { EditCategoryComponent } from './components/category/edit-category/edit-category.component';
import { AllblogsComponent } from './components/blogs/allblogs/allblogs.component';
import { AddblogsComponent } from './components/blogs/addblogs/addblogs.component';
import { EditBlogComponent } from './components/blogs/edit-blog/edit-blog.component';
import { AllStaffAdminComponent } from './components/staff/all-staff-admin/all-staff-admin.component';
import { AddStaffComponent } from './components/staff/add-staff/add-staff.component';
import { PrivateChatComponent } from './components/Chats/private-chat/private-chat.component';
import { AllChatsComponent } from './components/Chats/all-chats/all-chats.component';
import { ReportGeneratorComponent } from './components/project/report-generator/report-generator.component';

export const routes: Routes = [
  // ------------------------- PUBLIC ROUTES -------------------------
  { path: 'Home', component: HomeComponent },
  { path: 'documentaion', component: documentaionComponent },
  { path: 'Privacy', component: PrivacyPolicyComponent },
  { path: 'Login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'blog/:id', component: DetailsBlogComponent },
  { path: 'AllBlogsUser', component: AllBlogsUserComponent },
  { path: 'staff', component: AllStaffComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ---------------------- PROTECTED USER ROUTES (Just login required) --------------------
  { path: 'MyProfile', component: MyProfileComponent, canActivate: [RoleGuard] },
  { path: 'Chat', component: ChatComponent, canActivate: [RoleGuard] },
  { path: 'user/profile/:id', component: UserProfileComponent, canActivate: [RoleGuard] },
  { path: 'my-projects', component: MyProjectsComponent, canActivate: [RoleGuard] },
  { path: 'ProjectDetails/:id', component: ProjectDetailsComponent, canActivate: [RoleGuard] },
  { path: 'chats', component: AllChatsComponent, canActivate: [RoleGuard] },
  { path: 'chat/:id', component: PrivateChatComponent, canActivate: [RoleGuard] },

  // ------------------------ PERMISSION-BASED ROUTES ----------------------
  { path: 'SignUp', component: SignUpComponent, canActivate: [RoleGuard], data: { permission: 'User.Create' } },
  { path: 'users', component: UserManagementComponent, canActivate: [RoleGuard], data: { permission: 'User' } },
  { path: 'user-analytics', component: UserAnalyticsComponent, canActivate: [RoleGuard], data: { permission: 'User.View' } },

  { path: 'AddProject', component: AddProjectComponent, canActivate: [RoleGuard], data: { permission: 'Project.Create' } },
  { path: 'EditProject/:id', component: EditProjectComponent, canActivate: [RoleGuard], data: { permission: 'Project.Edit' } },
  { path: 'ProjectList', component: ProjectListComponent, canActivate: [RoleGuard], data: { permission: 'Project' } },
  { path: 'ProjectAnalysis', component: ProjectAnalysisComponent, canActivate: [RoleGuard], data: { permission: 'Project.View' } },
  { path: 'report-generator', component: ReportGeneratorComponent, canActivate: [RoleGuard], data: { permission: 'Project.View' } },


  { path: 'allMails', component: MailListComponent, canActivate: [RoleGuard], data: { permission: 'Mail' } },
  { path: 'replayMails/:id', component: MailReplyComponent, canActivate: [RoleGuard], data: { permission: 'Mail.Reply' } },

  // Role Management
  { path: 'roles', component: RoleListComponent, canActivate: [RoleGuard], data: { permission: 'Role' } },
  { path: 'roles/add', component: AddRoleComponent, canActivate: [RoleGuard], data: { permission: 'Role.Create' } },
  { path: 'roles/edit/:id', component: EditRoleComponent, canActivate: [RoleGuard], data: { permission: 'Role.Edit' } },
  { path: 'roles/details/:id', component: RoleDetailsComponent, canActivate: [RoleGuard], data: { permission: 'Role.View' } },

  // Faculty Management
  { path: 'FacultyList', component: FacultyListComponent, canActivate: [RoleGuard], data: { permission: 'Faculty' } },
  { path: 'add-faculty', component: AddFacultyComponent, canActivate: [RoleGuard], data: { permission: 'Faculty.Create' } },
  { path: 'facultyEdit/:id', component: FacultyEditComponent, canActivate: [RoleGuard], data: { permission: 'Faculty.Edit' } },

  // Department Management
  { path: 'DepartmentsList', component: DepartmentListComponent, canActivate: [RoleGuard], data: { permission: 'Department' } },
  { path: 'Departments', component: DepartmentCreateComponent, canActivate: [RoleGuard], data: { permission: 'Department.Create' } },
  { path: 'departmentEdit/:id', component: DepartmentEditComponent, canActivate: [RoleGuard], data: { permission: 'Department.Edit' } },

  // Category Management
  { path: 'CategoryList', component: CategoryListComponent, canActivate: [RoleGuard], data: { permission: 'Category' } },
  { path: 'add-category', component: AddCategoryComponent, canActivate: [RoleGuard], data: { permission: 'Category.Create' } },
  { path: 'categoryEdit/:id', component: EditCategoryComponent, canActivate: [RoleGuard], data: { permission: 'Category.Edit' } },

  // Blogs Management
  { path: 'blogs', component: AllblogsComponent, canActivate: [RoleGuard], data: { permission: 'Blog' } },
  { path: 'add-blog', component: AddblogsComponent, canActivate: [RoleGuard], data: { permission: 'Blog.Create' } },
  { path: 'edit-blog/:id', component: EditBlogComponent, canActivate: [RoleGuard], data: { permission: 'Blog.Edit' } },

  // Staff Management
  { path: 'admin/staff', component: AllStaffAdminComponent, canActivate: [RoleGuard], data: { permission: 'Staff' } },
  { path: 'admin/staff/add', component: AddStaffComponent, canActivate: [RoleGuard], data: { permission: 'Staff.Create' } },

  // Notifications
  { path: 'notifications', component: NotificationsPageComponent, canActivate: [RoleGuard] },

  // --------------------- REDIRECTS & WILDCARD --------------------
  { path: '', redirectTo: 'Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home' }
];
