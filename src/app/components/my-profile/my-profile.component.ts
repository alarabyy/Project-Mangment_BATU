import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService, UserProfile } from '../../Services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.getUserProfileFromApi().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (profile) => {
        // طباعة البيانات للتأكد من بنيتها
        console.log('Profile data received from API:', profile);
        this.userProfile = profile;
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        this.errorMessage = err.message || 'Could not retrieve user profile. Please try again later.';
      }
    });
  }

  /**
   * ======================= 🔽 تم الإصلاح هنا 🔽 =======================
   * دالة لتحسين عرض الدور (Role) للمستخدم.
   * تعالج هذه الدالة الحالة التي يكون فيها الدور نصًا أو مصفوفة من النصوص.
   * @param role The role, which can be a string or an array of strings.
   * @returns A formatted, human-readable string (e.g., "Admin")
   */
  getRoleAsString(role: string | string[]): string {
    if (!role) {
      return 'User'; // قيمة افتراضية
    }

    let roleName: string;

    // التحقق إذا كان الدور مصفوفة، ونأخذ العنصر الأول
    if (Array.isArray(role) && role.length > 0) {
      roleName = role[0];
    } else if (typeof role === 'string') {
      roleName = role;
    } else {
      return 'User'; // حالة غير متوقعة
    }

    // الآن نضمن أن roleName هو نص ونقوم بتنسيقه
    return roleName.charAt(0).toUpperCase() + roleName.slice(1);
  }
  // ====================================================================


  logout(): void {
    this.authService.logout();
  }
}
