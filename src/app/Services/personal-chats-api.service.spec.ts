import { TestBed } from '@angular/core/testing';

import { PersonalChatsApiService } from './personal-chats-api.service';

describe('PersonalChatsApiService', () => {
  let service: PersonalChatsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonalChatsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
