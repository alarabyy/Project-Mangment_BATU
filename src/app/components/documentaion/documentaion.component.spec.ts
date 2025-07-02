import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentaionComponent } from './documentaion.component';

describe('DocumentaionComponent', () => {
  let component: DocumentaionComponent;
  let fixture: ComponentFixture<DocumentaionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentaionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentaionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
