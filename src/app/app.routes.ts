import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { MyProfileComponent } from './components/my-profile/my-profile.component';
import { AddProjectComponent } from './components/project/add-project/add-project.component';
import { PrivacyPolicyComponent } from './components/privacy/privacy.component';
import { documentaionComponent } from './components/documentaion/documentaion.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { DepartmentCreateComponent } from './components/Departments/department-create/department-create.component';
import { DepartmentListComponent } from './components/Departments/department-list/department-list.component';
import { ChatComponent } from './components/chat/chat.component';
import { FacultyListComponent } from './components/faculty/faculty-list/faculty-list.component';
import { DepartmentEditComponent } from './components/Departments/department-edit/department-edit.component';
import { AddFacultyComponent } from './components/faculty/add-faculty/add-faculty.component';
import { FacultyEditComponent } from './components/faculty/faculty-edit/faculty-edit.component';

// New Category Components
import { CategoryListComponent } from './components/category/category-list/category-list.component';
import { AddCategoryComponent } from './components/category/add-category/add-category.component';
import { EditCategoryComponent } from './components/category/edit-category/edit-category.component';
import { ProjectListComponent } from './components/project/project-list/project-list.component';
import { EditProjectComponent } from './components/project/edit-project/edit-project.component';


export const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'documentaion', component: documentaionComponent },
  { path: 'Privacy', component: PrivacyPolicyComponent },
  { path: 'SignUp', component: SignUpComponent },
  { path: 'Login', component: LoginComponent },
  { path: 'MyProfile', component: MyProfileComponent },

  // Faculty Routes
  { path: 'FacultyList', component: FacultyListComponent },
  { path: 'add-faculty', component: AddFacultyComponent },
  { path: 'facultyEdit/:id', component: FacultyEditComponent },

  // Department Routes (existing)
  { path: 'Departments', component: DepartmentCreateComponent },
  { path: 'DepartmentsList', component: DepartmentListComponent },
  { path: 'departmentEdit/:id', component: DepartmentEditComponent },

  // Category Routes (NEW)
  { path: 'CategoryList', component: CategoryListComponent },
  { path: 'add-category', component: AddCategoryComponent },
  { path: 'categoryEdit/:id', component: EditCategoryComponent },

  // Category Routes (NEW)
  { path: 'projects/add', component: AddProjectComponent },
  { path: 'projects', component: ProjectListComponent },
  { path: 'projects/edit/:id', component: EditProjectComponent },


  { path: 'Chat', component: ChatComponent },

  { path: '', redirectTo : 'Home' , pathMatch:'full'},
  { path: '**', component: HomeComponent }, // Fallback route
];
