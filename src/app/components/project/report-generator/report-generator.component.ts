// src/app/components/report-generator/report-generator.component.ts
import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, filter } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexGrid, ApexTooltip, ApexLegend, ApexTitleSubtitle } from 'ng-apexcharts';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../Services/project.service';

interface ReportData {
  projects: Project[];
  analytics: { totalProjects: number; averageScore: number; topTechnology: string; topTool: string; };
  categoryChartOptions: Partial<ChartOptions>;
  departmentChartOptions: Partial<ChartOptions>;
  scoreDistributionOptions: Partial<ChartOptions>;
}

type ChartOptions = Partial<{ series: any[]; chart: ApexChart; plotOptions: ApexPlotOptions; xaxis: ApexXAxis; yaxis: ApexYAxis | ApexYAxis[]; grid: ApexGrid; tooltip: ApexTooltip; legend: ApexLegend; colors: string[]; dataLabels: ApexDataLabels; labels: string[]; title: ApexTitleSubtitle; }>;

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule, NgApexchartsModule],
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.css']
})
export class ReportGeneratorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('reportContent') reportContent!: ElementRef;
  @ViewChildren('kpiValue') kpiValueElements!: QueryList<ElementRef>;
  private kpiSubscription!: Subscription;

  public reportData$ = new BehaviorSubject<ReportData | null>(null);
  public isLoading = new BehaviorSubject<boolean>(false);
  public error$ = new BehaviorSubject<string | null>(null);

  public searchTerm: string = '';
  public reportGenerated = false;
  public isDownloading = false;
  public currentDate = new Date();

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.kpiSubscription = this.reportData$.pipe(
      filter((data): data is ReportData => !!data)
    ).subscribe(() => {
      setTimeout(() => this.animateCounters(), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) this.kpiSubscription.unsubscribe();
  }

  generateReport(): void {
    if (!this.searchTerm.trim()) return;
    this.isLoading.next(true);
    this.error$.next(null);
    this.reportGenerated = true;
    this.reportData$.next(null);

    this.projectService.searchProjects(this.searchTerm).pipe(
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (projects) => {
        const analytics = this.calculateAnalytics(projects);
        this.reportData$.next({
          projects,
          analytics,
          categoryChartOptions: this.createCategoryChart(projects),
          departmentChartOptions: this.createDepartmentChart(projects),
          scoreDistributionOptions: this.createScoreDistributionChart(projects)
        });
      },
      error: () => this.error$.next('Failed to fetch report data.')
    });
  }

  private calculateAnalytics(projects: Project[]): any {
    if (projects.length === 0) return { totalProjects: 0, averageScore: 0, topTechnology: 'N/A', topTool: 'N/A' };
    const gradedProjects = projects.filter(p => p.score !== null && p.score > 0);
    const totalScore = gradedProjects.reduce((sum, p) => sum + (p.score || 0), 0);
    const countItems = (key: 'technologies' | 'toolsUsed') => projects.flatMap(p => p[key]?.split(',').map(t => t.trim()) || []).reduce((acc, item) => { acc[item] = (acc[item] || 0) + 1; return acc; }, {} as {[key: string]: number});
    const getTopItem = (counts: {[key: string]: number}) => Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'N/A');
    return {
      totalProjects: projects.length,
      averageScore: gradedProjects.length > 0 ? Math.round(totalScore / gradedProjects.length) : 0,
      topTechnology: getTopItem(countItems('technologies')),
      topTool: getTopItem(countItems('toolsUsed')),
    };
  }

  private createCategoryChart(projects: Project[]): ChartOptions {
    const counts = projects.reduce((acc, p) => { const name = p.category?.name || 'Uncategorized'; acc[name] = (acc[name] || 0) + 1; return acc; }, {} as {[key: string]: number});
    return {
      series: Object.values(counts),
      chart: { type: 'donut', height: 350, background: 'transparent', foreColor: 'var(--subtle-text-color)' },
      labels: Object.keys(counts),
      legend: { position: 'bottom' },
    };
  }

  private createDepartmentChart(projects: Project[]): ChartOptions {
    const counts = projects.flatMap(p => p.department || []).reduce((acc, dept) => { acc[dept.name] = (acc[dept.name] || 0) + 1; return acc; }, {} as {[key: string]: number});
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    return {
      series: [{ name: 'Projects', data: sorted.map(d => d[1]) }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4 } },
      xaxis: { categories: sorted.map(d => d[0]), labels: { style: { colors: 'var(--subtle-text-color)' } } },
      legend: { show: false }
    };
  }

  private createScoreDistributionChart(projects: Project[]): ChartOptions {
    const scoreRanges = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };
    projects.forEach(p => {
      if (p.score !== null) {
        if (p.score >= 90) scoreRanges['90-100']++;
        else if (p.score >= 80) scoreRanges['80-89']++;
        else if (p.score >= 70) scoreRanges['70-79']++;
        else if (p.score >= 60) scoreRanges['60-69']++;
        else scoreRanges['<60']++;
      }
    });
    return {
      series: [{ name: 'Number of Projects', data: Object.values(scoreRanges) }],
      chart: { type: 'bar', height: 350, background: 'transparent' },
      xaxis: { categories: Object.keys(scoreRanges), labels: { style: { colors: 'var(--subtle-text-color)' } } },
      title: { text: 'Project Score Distribution', style: { color: 'var(--text-color)' } }
    };
  }

  public downloadPDF(): void {
    if (this.isDownloading) return;
    this.isDownloading = true;
    const data = this.reportContent.nativeElement;

    html2canvas(data, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
      const imgWidth = 210, pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight, position = 0;
      const contentDataURL = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      let pageCount = 1;
      while (heightLeft > 0) {
        position = -pageHeight * pageCount;
        pdf.addPage();
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        pageCount++;
      }
      pdf.save(`Projects_Report_${this.searchTerm}.pdf`);
      this.isDownloading = false;
    }).catch(err => {
      console.error("Error generating PDF:", err);
      this.isDownloading = false;
    });
  }

  private animateCounters(): void {
    this.kpiValueElements.forEach((el: ElementRef) => {
      const element = el.nativeElement;
      const target = parseInt(element.getAttribute('data-value') || '0', 10);
      let current = 0;
      const increment = target / 100;
      const updateCount = () => {
        if (current < target) {
          current += increment;
          element.innerText = Math.ceil(current).toLocaleString();
          requestAnimationFrame(updateCount);
        } else {
          element.innerText = target.toLocaleString();
        }
      };
      updateCount();
    });
  }
}
