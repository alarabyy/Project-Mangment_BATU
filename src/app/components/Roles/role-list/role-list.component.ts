// src/app/components/roles/role-list/role-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from '../../../Services/role.service';
import { Role } from '../../../models/role';
import { PopupService } from '../../../Services/popup.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  isLoading = true;

  constructor(
    private roleService: RoleService,
    private router: Router,
    private popupService: PopupService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getRoles().pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (data) => this.roles = data,
      error: () => this.popupService.showError('Error', 'Failed to load roles.')
    });
  }

  deleteRole(role: Role): void {
    this.popupService.showConfirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the "${role.name}" role?`,
      onConfirm: () => {
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            this.popupService.showSuccess('Deleted!', `Role "${role.name}" has been deleted.`);
            this.loadRoles(); // Refresh list
          },
          error: (err) => this.popupService.showError('Error', err.error?.message || 'Failed to delete role.')
        });
      }
    });
  }

  viewDetails(id: number): void { this.router.navigate(['/roles/details', id]); }
  editRole(id: number): void { this.router.navigate(['/roles/edit', id]); }
}
