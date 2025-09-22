// src/app/components/roles/edit-role/edit-role.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleService } from '../../../Services/role.service';
import { AllPermissions } from '../../../models/role';
import { PopupService } from '../../../Services/popup.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-edit-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.css']
})
export class EditRoleComponent implements OnInit {
  roleForm: FormGroup;
  allPermissions = AllPermissions;
  isSubmitting = false;
  isLoading = true;
  roleId!: number;
  pageTitle = 'Edit Role';
  permissionGroups: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private router: Router,
    private route: ActivatedRoute,
    private popupService: PopupService
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      permissions: this.fb.array(this.allPermissions.map(() => this.fb.control(false)))
    });
  }

  ngOnInit(): void {
    this.groupPermissions();
    this.roleId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.roleId) this.loadRole(); else this.router.navigate(['/roles']);
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

  loadRole(): void {
    this.isLoading = true;
    this.roleService.getRoleById(this.roleId).pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (roleDetails) => {
        this.pageTitle = `Edit Role: ${roleDetails.name}`;
        this.roleForm.patchValue({ name: roleDetails.name });
        this.patchPermissions(roleDetails.permissions);
      },
      error: () => this.popupService.showError('Error', 'Failed to load role details.')
    });
  }

  patchPermissions(selected: string[]): void {
    this.permissionsArray.controls.forEach((control, i) => {
      if (selected.includes(this.allPermissions[i])) control.setValue(true);
    });
  }

  onSubmit(): void {
    if (this.roleForm.invalid) { this.popupService.showError('Validation Error', 'Please provide a role name.'); return; }
    this.isSubmitting = true;
    const payload = {
      id: this.roleId,
      name: this.roleForm.value.name,
      permissions: this.allPermissions.filter((_, i) => this.permissionsArray.at(i).value)
    };
    this.roleService.updateRole(payload).pipe(finalize(() => this.isSubmitting = false))
    .subscribe({
      next: () => this.popupService.showSuccess('Role Updated', 'The role has been updated successfully.', () => this.router.navigate(['/roles'])),
      error: (err) => this.popupService.showError('Update Failed', err.error?.message || 'Could not update the role.')
    });
  }

  getPermissionIndex(permission: string): number { return this.allPermissions.indexOf(permission); }
}
