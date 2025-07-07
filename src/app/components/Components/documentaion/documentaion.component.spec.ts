import { ComponentFixture, TestBed } from '@angular/core/testing';

import { documentaionComponent } from './documentaion.component';

describe('documentaionComponent', () => {
  let component: documentaionComponent;
  let fixture: ComponentFixture<documentaionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [documentaionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(documentaionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
