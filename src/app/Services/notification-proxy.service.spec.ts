import { TestBed } from '@angular/core/testing';

import { NotificationProxyService } from './notification-proxy.service';

describe('NotificationProxyService', () => {
  let service: NotificationProxyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationProxyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
