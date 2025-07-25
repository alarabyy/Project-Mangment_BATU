import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAnalysisComponent } from './project-analysis.component';

describe('ProjectAnalysisComponent', () => {
  let component: ProjectAnalysisComponent;
  let fixture: ComponentFixture<ProjectAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
