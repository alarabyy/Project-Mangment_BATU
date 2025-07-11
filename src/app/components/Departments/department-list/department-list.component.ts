import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Department } from '../../../models/department';
import { DepartmentService } from '../../../Services/department.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css']
})
export class DepartmentListComponent implements OnInit {
  public departments: Department[] = [];
  public isLoading: boolean = true;
  public errorMessage: string | null = null;
  public deletingDepartmentIds = new Set<number>();

  constructor(
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  public loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.departmentService.getAllDepartments().pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Failed to fetch departments:', err);
        this.errorMessage = 'Failed to load departments. Please check the server status.';
        return of([]);
      })
    ).subscribe(data => {
      this.departments = data;
    });
  }

  public deleteDepartment(departmentId: number): void {
    if (this.deletingDepartmentIds.has(departmentId)) return;

    const confirmation = confirm('Are you sure you want to permanently delete this department? This action cannot be undone.');
    if (!confirmation) return;

    this.deletingDepartmentIds.add(departmentId);

    // تأخير بسيط لمطابقة حركة الـ CSS
    setTimeout(() => {
      this.departmentService.deleteDepartment(departmentId).pipe(
        finalize(() => this.deletingDepartmentIds.delete(departmentId))
      ).subscribe({
        next: () => {
          this.departments = this.departments.filter(d => d.id !== departmentId);
        },
        error: (err) => {
          console.error('Error deleting department:', err);
          this.errorMessage = `Failed to delete department ID: ${departmentId}.`;
        }
      });
    }, 500);
  }

  public addDepartment(): void {
    // تم تغيير المسار ليتوافق مع ملف التوجيه الخاص بك
    this.router.navigate(['/Departments']); // Assuming '/Departments' routes to DepartmentCreateComponent
  }

  public editDepartment(departmentId: number): void {
    this.router.navigate(['/departmentEdit', departmentId]);
  }

  public trackByDepartmentId(index: number, department: Department): number {
    return department.id;
  }
}
