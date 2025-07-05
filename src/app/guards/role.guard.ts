// File: src/app/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log(`[RoleGuard] Checking access for path: '${route.url.join('/')}'`);

    if (!this.authService.isLoggedIn()) {
      console.log('[RoleGuard] User is not logged in. Redirecting to /login.');
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as Array<string>;
    if (!allowedRoles || allowedRoles.length === 0) {
      console.log('[RoleGuard] No specific roles required. Access granted.');
      return true;
    }

    const userRole = this.authService.getUserRole();

    // ================= 🔽 تم التعديل هنا لإضافة التشخيص 🔽 =================
    console.log(`[RoleGuard] Required roles: [${allowedRoles.join(', ')}]`);
    console.log(`[RoleGuard] User's current role: '${userRole}'`);

    if (userRole && allowedRoles.includes(userRole)) {
      console.log('[RoleGuard] Access GRANTED. User role is in the allowed list.');
      return true;
    } else {
      console.log('[RoleGuard] Access DENIED. Redirecting to /unauthorized.');
      this.router.navigate(['/unauthorized']);
      return false;
    }
    // =====================================================================
  }
}
