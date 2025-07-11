import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBlogsUserComponent } from './all-blogs-user.component';

describe('AllBlogsUserComponent', () => {
  let component: AllBlogsUserComponent;
  let fixture: ComponentFixture<AllBlogsUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBlogsUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllBlogsUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
