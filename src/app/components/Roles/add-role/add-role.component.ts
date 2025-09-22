// src/app/components/roles/add-role/add-role.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from '../../../Services/role.service';
import { AllPermissions } from '../../../models/role';
import { PopupService } from '../../../Services/popup.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.css']
})
export class AddRoleComponent {
  roleForm: FormGroup;
  allPermissions = AllPermissions;
  isSubmitting = false;
  permissionGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private router: Router,
    private popupService: PopupService
  ) {
    this.groupPermissions();
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      permissions: this.fb.array(this.allPermissions.map(() => this.fb.control(false)))
    });
  }

  groupPermissions(): void {
    this.permissionGroups = this.allPermissions.reduce((acc, perm) => {
      const domain = perm.split('.')[1];
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(perm);
      return acc;
    }, {} as { [key: string]: string[] });
  }

  get permissionsArray(): FormArray { return this.roleForm.get('permissions') as FormArray; }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.popupService.showError('Validation Error', 'Please provide a role name.');
      return;
    }
    this.isSubmitting = true;
    const payload = {
      name: this.roleForm.value.name,
      permissions: this.allPermissions.filter((_, i) => this.permissionsArray.at(i).value)
    };
    this.roleService.createRole(payload).pipe(finalize(() => this.isSubmitting = false))
    .subscribe({
      next: () => this.popupService.showSuccess('Role Created', 'The new role has been added.', () => this.router.navigate(['/roles'])),
      error: (err) => this.popupService.showError('Creation Failed', err.error?.message || 'Could not create the role.')
    });
  }

  getPermissionIndex(permission: string): number { return this.allPermissions.indexOf(permission); }
}
