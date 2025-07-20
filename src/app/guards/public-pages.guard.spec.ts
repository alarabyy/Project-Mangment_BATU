import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { publicPagesGuard } from './public-pages.guard';

describe('publicPagesGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => publicPagesGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
