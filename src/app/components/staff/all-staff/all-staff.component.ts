// src/app/components/staff/all-staff/all-staff.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Staff } from '../../../models/staff';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { StaffService } from '../../../Services/staff.service';

@Component({
  selector: 'app-all-staff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-staff.component.html',
  styleUrls: ['./all-staff.component.css']
})
export class AllStaffComponent implements OnInit {
  staffMembers: Staff[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private staffService: StaffService) { }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.staffService.getAllStaff().pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Load Staff Error:', err);
        this.errorMessage = err.message || 'Failed to load staff members.';
        return of([]);
      })
    ).subscribe(staff => {
      this.staffMembers = staff;
      console.log('Loaded Staff:', this.staffMembers);
    });
  }

   getStaffImageUrl(imagePath: string | undefined | null): string | undefined {
       return this.staffService.getStaffImageUrl(imagePath);
   }
}
