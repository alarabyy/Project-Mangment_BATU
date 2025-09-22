// src/app/components/roles/role-details/role-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoleService } from '../../../Services/role.service';
import { RoleDetails } from '../../../models/role';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-role-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-details.component.html',
  styleUrls: ['./role-details.component.css']
})
export class RoleDetailsComponent implements OnInit {
  role: RoleDetails | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.roleService.getRoleById(id).pipe(finalize(() => this.isLoading = false))
      .subscribe(data => this.role = data);
    }
  }

  get groupedPermissions(): { [key: string]: string[] } {
    if (!this.role) return {};
    return this.role.permissions.reduce((acc, perm) => {
      const parts = perm.split('.');
      const domain = parts[1] || 'General';
      const action = parts[2] || parts[0];
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(action);
      return acc;
    }, {} as { [key: string]: string[] });
  }

  originalOrder = (a: KeyValue<string,string[]>, b: KeyValue<string,string[]>): number => 0;
}
