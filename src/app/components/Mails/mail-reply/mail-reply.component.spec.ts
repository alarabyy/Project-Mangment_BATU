import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailReplyComponent } from './mail-reply.component';

describe('MailReplyComponent', () => {
  let component: MailReplyComponent;
  let fixture: ComponentFixture<MailReplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailReplyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MailReplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
