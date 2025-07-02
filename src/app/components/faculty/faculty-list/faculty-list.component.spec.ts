import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyListComponent } from './faculty-list.component';

describe('FacultyListComponent', () => {
  let component: FacultyListComponent;
  let fixture: ComponentFixture<FacultyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
