// src/app/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { PopupService } from '../Services/popup.service';
import { RoleService } from '../Services/role.service';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { RoleDetails } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private popupService: PopupService,
    private roleService: RoleService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.authService.isLoggedIn()) {
      console.log(`[RoleGuard] DENIED (${state.url}): User not logged in.`);
      this.router.navigate(['/Login']);
      return false;
    }

    const requiredPermission = route.data['permission'] as string;

    // If the route doesn't require a specific permission, allow any logged-in user
    if (!requiredPermission) {
      console.log(`[RoleGuard] GRANTED (${state.url}): No specific permission required.`);
      return true;
    }

    console.log(`[RoleGuard] Checking access for: ${state.url}`);
    console.log(`[RoleGuard] Required Permission: '${requiredPermission}'`);

    // If we already have the permission in the token -> allow
    if (this.authService.hasPermission(requiredPermission)) {
      console.log(`[RoleGuard] GRANTED (${state.url}): User has the required permission (cached).`);
      return true;
    }

    // Otherwise: try to populate permissions from role info via API, then re-check
    const decoded = this.authService.getDecodedToken();
    if (!decoded) {
      // token invalid or missing
      console.log(`[RoleGuard] DENIED (${state.url}): decoded token missing.`);
      this.router.navigate(['/Login']);
      return false;
    }

    // Try to find a role identifier/name in the token
    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || decoded.role || decoded.roleId || decoded.Role || decoded.roles || decoded.Roles;

    if (!roleClaim) {
      // nothing to fetch from server
      return this.denyWithPopup(state.url);
    }

    // If numeric roleId, fetch that role directly; else try to find by name
    let fetch$: Observable<RoleDetails>;

    if (typeof roleClaim === 'number' || (!isNaN(Number(roleClaim)))) {
      fetch$ = this.roleService.getRoleById(Number(roleClaim));
    } else {
      const roleName = String(roleClaim);
      // getRoles to map name -> id, then getRoleById
      fetch$ = this.roleService.getRoles().pipe(
        switchMap(roles => {
          const found = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
          if (!found) throw new Error('Role not found by name');
          return this.roleService.getRoleById(found.id);
        })
      );
    }

    return fetch$.pipe(
      map(roleDetails => {
        const perms = roleDetails?.permissions ?? [];
        // attach into authService decoded token so subsequent checks pass
        this.authService.attachPermissions(perms);

        if (this.authService.hasPermission(requiredPermission)) {
          console.log(`[RoleGuard] GRANTED (${state.url}): permission found after fetching role.`);
          return true;
        } else {
          console.log(`[RoleGuard] DENIED (${state.url}): permission NOT present even after fetching role.`);
          this.popupService.showError('Access Denied', 'You do not have the necessary permissions to access this page.');
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }),
      catchError(err => {
        console.error('[RoleGuard] error while fetching role permissions', err);
        return this.denyWithPopup(state.url);
      })
    );
  }

  private denyWithPopup(url: string): Observable<boolean> {
    this.popupService.showError('Access Denied', 'You do not have the necessary permissions to access this page.');
    this.router.navigate(['/unauthorized']);
    return of(false);
  }
}
