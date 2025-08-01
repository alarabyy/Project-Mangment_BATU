// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard'; // تأكد من المسار الصحيح للحارس

// --- General Public Components ---
import { HomeComponent } from './components/home/home.component';
import { PrivacyPolicyComponent } from './components/Components/privacy/privacy.component';
import { documentaionComponent } from './components/Components/documentaion/documentaion.component';
import { UnauthorizedComponent } from './components/Components/unauthorized/unauthorized.component';


// --- User-Specific Protected Components ---
import { MyProfileComponent } from './components/User/my-profile/my-profile.component';
import { ChatComponent } from './components/chat-AI/chat.component'; // هذا شات الـ AI، مختلف عن الشات العادي
import { UserProfileComponent } from './components/User/user-profile/user-profile.component';

// --- Project Management Components ---
import { ProjectListComponent } from './components/project/project-list/project-list.component';
import { AddProjectComponent } from './components/project/add-project/add-project.component';
import { EditProjectComponent } from './components/project/edit-project/edit-project.component';
import { ProjectDetailsComponent } from './components/project/project-details/project-details.component';

// --- Admin Dashboard Components ---
import { NotificationsPageComponent } from './components/Components/notifications-page/notifications-page.component';
// import { UserManagementComponent } from './components/User/user-management/user-management.component';
import { UserAnalyticsComponent } from './components/User/user-analytics/user-analytics.component';
import { DepartmentCreateComponent } from './components/Departments/department-create/department-create.component';
import { DepartmentEditComponent } from './components/Departments/department-edit/department-edit.component';
import { FacultyListComponent } from './components/faculty/faculty-list/faculty-list.component';
import { AddFacultyComponent } from './components/faculty/add-faculty/add-faculty.component';
import { FacultyEditComponent } from './components/faculty/faculty-edit/faculty-edit.component';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { AddCategoryComponent } from './components/category/add-category/add-category.component';
import { EditCategoryComponent } from './components/category/edit-category/edit-category.component';
import { AddblogsComponent } from './components/blogs/addblogs/addblogs.component';
import { DetailsBlogComponent } from './components/blogs/detail-blog/details-blog.component';
import { AllblogsComponent } from './components/blogs/allblogs/allblogs.component';
import { EditBlogComponent } from './components/blogs/edit-blog/edit-blog.component';
import { MyProjectsComponent } from './components/project/my-projects/my-projects.component';
import { AllBlogsUserComponent } from './components/blogs/all-blogs-user/all-blogs-user.component';
import { AllStaffComponent } from './components/staff/all-staff/all-staff.component';
import { AllStaffAdminComponent } from './components/staff/all-staff-admin/all-staff-admin.component';
import { AddStaffComponent } from './components/staff/add-staff/add-staff.component';
import { LoginComponent } from './components/auth/login/login.component';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { ProjectAnalysisComponent } from './components/project/project-analysis/project-analysis.component';
import { DepartmentListComponent } from './components/Departments/department-list/department-list.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';

// NEW: Correct paths for Mail Components
import { MailListComponent } from './components/Mails/mail-list/mail-list.component';
import { MailReplyComponent } from './components/Mails/mail-reply/mail-reply.component';
import { PrivateChatComponent } from './components/Chats/private-chat/private-chat.component';
import { AllChatsComponent } from './components/Chats/all-chats/all-chats.component';
import { UserManagementComponent } from './components/User/user-management/user-management.component';

// =================================================================
//                 ROUTES CONFIGURATION
// =================================================================
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

  // --- SignUp is now an Admin-only route ---
  { path: 'SignUp', component: SignUpComponent  , canActivate: [RoleGuard], data: { roles: ['admin']}},

  // ---------------------- MAIL ROUTES (Protected by RoleGuard) --------------------
  { path: 'allMails', component: MailListComponent , canActivate: [RoleGuard], data: { roles: ['admin']} },
  { path: 'replayMails/:id', component: MailReplyComponent , canActivate: [RoleGuard], data: { roles: ['admin']} },


  // ---------------------- CHATS ROUTES (Managed by ChatLayoutComponent) --------------------
  // ---------------------- CHATS ROUTES --------------------
  { path: 'chats', component: AllChatsComponent , canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } },
  { path: 'chat/:id', component: PrivateChatComponent , canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } },


  // ---------------------- PROTECTED USER ROUTES --------------------
  { path: 'MyProfile', component: MyProfileComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'doctor', 'student'] } },
  { path: 'Chat', component: ChatComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } }, // هذا شات الـ AI
  { path: 'user/profile/:id', component: UserProfileComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'doctor', 'student'] } },


  // -------------------- PROJECT MANAGEMENT ROUTES ------------------
  { path: 'ProjectDetails/:id', component: ProjectDetailsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } },
  { path: 'EditProject/:id', component: EditProjectComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } },
  { path: 'AddProject', component: AddProjectComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor' ] } },
  { path: 'ProjectList', component: ProjectListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'my-projects', component: MyProjectsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor'] } },
  { path: 'ProjectAnalysis', component: ProjectAnalysisComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  // ------------------------ ADMIN-ONLY ROUTES ----------------------
  // General Admin
  { path: 'notifications', component: NotificationsPageComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'users', component: UserManagementComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'user-analytics', component: UserAnalyticsComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // Faculty Management
  { path: 'FacultyList', component: FacultyListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'add-faculty', component: AddFacultyComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'facultyEdit/:id', component: FacultyEditComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // Department Management
  { path: 'Departments', component: DepartmentCreateComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'DepartmentsList', component: DepartmentListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'departmentEdit/:id', component: DepartmentEditComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // Category Management
  { path: 'CategoryList', component: CategoryListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'add-category', component: AddCategoryComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'categoryEdit/:id', component: EditCategoryComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },


  // blogs  Management
  { path: 'blogs', component: AllblogsComponent , canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'add-blog', component: AddblogsComponent , canActivate: [RoleGuard], data: { roles: ['admin'] }},
  { path: 'edit-blog/:id', component: EditBlogComponent , canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // staff  Management
  { path: 'admin/staff', component: AllStaffAdminComponent , canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/staff/add', component: AddStaffComponent , canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // --------------------- REDIRECTS & WILDCARD --------------------
  { path: '', redirectTo: 'Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home' }
];
