import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingControlsComponent } from './floating-controls.component';

describe('FloatingControlsComponent', () => {
  let component: FloatingControlsComponent;
  let fixture: ComponentFixture<FloatingControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
