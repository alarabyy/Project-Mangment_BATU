import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllStaffAdminComponent } from './all-staff-admin.component';

describe('AllStaffAdminComponent', () => {
  let component: AllStaffAdminComponent;
  let fixture: ComponentFixture<AllStaffAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllStaffAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllStaffAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
