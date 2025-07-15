// File: src/app/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // الخطوة 1: التحقق مما إذا كان المستخدم مسجلاً دخوله أساسًا
    if (!this.authService.isLoggedIn()) {
      console.log('[RoleGuard] DENIED: User is not logged in. Redirecting to /Login...');
      this.router.navigate(['/Login']); // التوجيه لصفحة تسجيل الدخول
      return false;
    }

    // الخطوة 2: الحصول على الصلاحيات المطلوبة من بيانات المسار (route data)
    const requiredRoles = route.data['roles'] as Array<string>;

    // إذا كان المسار لا يتطلب صلاحيات معينة، اسمح للجميع بالمرور (طالما هم مسجلون)
    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[RoleGuard] GRANTED: Route does not require specific roles.');
      return true;
    }

    // الخطوة 3: الحصول على صلاحية المستخدم الحالي
    const userRole = this.authService.getUserRole();

    // طباعة معلومات التشخيص للمساعدة في تتبع المشاكل
    console.log(`[RoleGuard] Checking access for: ${state.url}`);
    console.log(`[RoleGuard] Required Roles: [${requiredRoles.join(', ')}]`);
    console.log(`[RoleGuard] User's Role (from AuthService): '${userRole}'`); // طباعة الدور المستخرج

    // الخطوة 4: التحقق مما إذا كانت صلاحية المستخدم ضمن الصلاحيات المطلوبة
    if (userRole && requiredRoles.includes(userRole)) {
      console.log('[RoleGuard] GRANTED: User has the required role.');
      return true;
    } else {
      // إذا كان مسجلاً ولكن دوره خطأ أو غير كافٍ، سيتم توجيهه هنا
      console.log('[RoleGuard] DENIED: User role is not sufficient. Redirecting to /unauthorized...');
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
