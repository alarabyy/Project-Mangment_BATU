import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

// --- Import General Components ---
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { MyProfileComponent } from './components/my-profile/my-profile.component';
import { PrivacyPolicyComponent } from './components/Components/privacy/privacy.component';
import { documentaionComponent } from './components/Components/documentaion/documentaion.component';
import { ChatComponent } from './components/chat/chat.component';
import { UnauthorizedComponent } from './components/Components/unauthorized/unauthorized.component';
import { NotificationsPageComponent } from './components/Components/notifications-page/notifications-page.component';

// --- Import Admin Management Components ---
import { DepartmentCreateComponent } from './components/Departments/department-create/department-create.component';
import { DepartmentListComponent } from './components/Departments/department-list/department-list.component';
import { DepartmentEditComponent } from './components/Departments/department-edit/department-edit.component';
import { FacultyListComponent } from './components/faculty/faculty-list/faculty-list.component';
import { AddFacultyComponent } from './components/faculty/add-faculty/add-faculty.component';
import { FacultyEditComponent } from './components/faculty/faculty-edit/faculty-edit.component';
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { AddCategoryComponent } from './components/category/add-category/add-category.component';
import { EditCategoryComponent } from './components/category/edit-category/edit-category.component';
import { UserManagementComponent } from './components/User/user-management/user-management.component';
import { UserAnalyticsComponent } from './components/User/user-analytics/user-analytics.component';

// --- Import Project Components ---
import { ProjectListComponent } from './components/project/project-list/project-list.component';
import { AddProjectComponent } from './components/project/add-project/add-project.component';
import { EditProjectComponent } from './components/project/edit-project/edit-project.component';
import { ProjectDetailsComponent } from './components/project/project-details/project-details.component';

export const routes: Routes = [
  // --- Public Routes ---
  { path: 'Home', component: HomeComponent },
  { path: 'documentaion', component: documentaionComponent },
  { path: 'Privacy', component: PrivacyPolicyComponent },
  { path: 'SignUp', component: SignUpComponent },
  { path: 'Login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // --- Shared Protected Routes ---
  { path: 'MyProfile', component: MyProfileComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'doctor', 'student', 'professor'] } },
  { path: 'Chat', component: ChatComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor', 'professor'] } },







  // --- Project Routes (Gouped for Clarity) ---
  { path: 'ProjectDetails/id', component: ProjectDetailsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor', 'professor'] } },
  { path: 'EditProject/id', component: EditProjectComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor', 'professor'] } },
  { path: 'AddProject', component: AddProjectComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'student', 'doctor', 'professor' ] } },

  { path: 'ProjectList', component: ProjectListComponent, canActivate: [RoleGuard], data: { roles: ['admin', ] } },
  // --- Admin-Only Management Routes ------------------------------------------------------------------
  { path: 'notifications', component: NotificationsPageComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'users', component: UserManagementComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'user-analytics', component: UserAnalyticsComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // --- Faculty Management Routes ---
  { path: 'FacultyList', component: FacultyListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'add-faculty', component: AddFacultyComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'facultyEdit/:id', component: FacultyEditComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // --- Department Management Routes ---
  { path: 'Departments', component: DepartmentCreateComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'DepartmentsList', component: DepartmentListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'departmentEdit/:id', component: DepartmentEditComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // Category Management Routes
  { path: 'CategoryList', component: CategoryListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'add-category', component: AddCategoryComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'categoryEdit/:id', component: EditCategoryComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },

  // --- Redirects & Fallback Route -------------------------------------------------------------------
  { path: '', redirectTo: 'Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home' }

]
