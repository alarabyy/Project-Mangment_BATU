import { CanActivateFn } from '@angular/router';

export const publicPagesGuard: CanActivateFn = (route, state) => {
  return true;
};
