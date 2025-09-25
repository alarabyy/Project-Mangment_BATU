// src/app/components/report-generator/report-generator.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../Services/project.service';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.css']
})
export class ReportGeneratorComponent {
  @ViewChild('reportContent') reportContent!: ElementRef;

  public projects$ = new BehaviorSubject<Project[] | null>(null);
  public isLoading = new BehaviorSubject<boolean>(false);
  public error$ = new BehaviorSubject<string | null>(null);

  public searchTerm: string = '';
  public reportGenerated = false; // To track if a search has been made
  public isDownloading = false;
  public currentDate = new Date();

  constructor(private projectService: ProjectService) {}

  generateReport(): void {
    if (!this.searchTerm.trim()) {
      // Optionally handle empty search case, e.g., show a message
      return;
    }

    this.isLoading.next(true);
    this.error$.next(null);
    this.reportGenerated = true;
    this.projects$.next(null); // Clear previous results

    this.projectService.searchProjects(this.searchTerm).pipe(
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (data) => {
        this.projects$.next(data);
      },
      error: () => {
        this.error$.next('Failed to fetch report data. Please try again.');
      }
    });
  }

  public downloadPDF(): void {
    if (this.isDownloading) return;

    this.isDownloading = true;
    const data = this.reportContent.nativeElement;

    html2canvas(data, { scale: 2, useCORS: true }).then(canvas => {
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const contentDataURL = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -pageHeight * (Math.floor(imgHeight/pageHeight) - Math.floor(heightLeft/pageHeight));
        pdf.addPage();
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Projects_Report_${this.searchTerm}.pdf`);
      this.isDownloading = false;
    });
  }
}
