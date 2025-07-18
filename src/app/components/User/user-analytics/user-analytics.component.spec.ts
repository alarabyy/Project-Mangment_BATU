import { UserAnalyticsComponent } from './user-analytics.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';


describe('UserAnalyticsComponent', () => {
  let component: UserAnalyticsComponent
  let fixture: ComponentFixture<UserAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
