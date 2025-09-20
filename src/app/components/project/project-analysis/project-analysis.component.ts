// src/app/components/project/project-analysis/project-analysis.component.ts
import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexGrid, ApexTooltip, ApexLegend, ApexFill } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay, filter } from 'rxjs/operators';
import { Project } from '../../../models/project';
import { ProjectService } from '../../../Services/project.service';

type ChartOptions = Partial<{ series: any[]; chart: ApexChart; plotOptions: ApexPlotOptions; xaxis: ApexXAxis; yaxis: ApexYAxis | ApexYAxis[]; grid: ApexGrid; tooltip: ApexTooltip; legend: ApexLegend; colors: string[]; dataLabels: ApexDataLabels; labels: string[]; fill: ApexFill; stroke: any; }>;
interface AnalyticsState { projects: Project[]; isLoading: boolean; error: string | null; }

@Component({
  selector: 'app-project-analysis',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './project-analysis.component.html',
  styleUrls: ['./project-analysis.component.css']
})
export class ProjectAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('kpiValue') kpiValueElements!: QueryList<ElementRef>;
  private kpiSubscription!: Subscription;

  public state$!: Observable<AnalyticsState>;
  public clickedItem$ = new BehaviorSubject<{ type: 'tech' | 'tool', name: string } | null>(null);

  public kpiData$!: Observable<any>;
  public selectedItemProjects$!: Observable<Project[]>;

  public topTechnologiesOptions$: Observable<ChartOptions> = of({});
  public topToolsOptions$: Observable<ChartOptions> = of({});

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    const source$ = this.projectService.getProjects().pipe(
      map(projects => ({ isLoading: false, projects, error: null })),
      startWith({ isLoading: true, projects: [], error: null as string | null }),
      catchError(() => of({ isLoading: false, projects: [], error: 'Could not load project analytics data.' })),
      shareReplay(1)
    );
    this.state$ = source$;

    this.kpiData$ = source$.pipe(map(s => this.calculateKpiData(s.projects)));
    this.topTechnologiesOptions$ = source$.pipe(map(s => this.createTopItemsChart(s.projects, 'technologies')));
    this.topToolsOptions$ = source$.pipe(map(s => this.createTopItemsChart(s.projects, 'toolsUsed')));

    this.selectedItemProjects$ = combineLatest([source$.pipe(map(s => s.projects)), this.clickedItem$])
      .pipe(map(([projects, item]) => {
        if (!item) return [];
        const key = item.type === 'tech' ? 'technologies' : 'toolsUsed';
        return projects.filter(p => p[key]?.split(',').map(t => t.trim().toLowerCase()).includes(item.name.toLowerCase()));
      }));
  }

  ngAfterViewInit(): void {
    // ✅ FIX: Subscribe to the state and animate counters only when data is loaded
    this.kpiSubscription = this.state$.pipe(
      filter(state => !state.isLoading && state.projects.length > 0)
    ).subscribe(() => {
      setTimeout(() => this.animateCounters(), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) this.kpiSubscription.unsubscribe();
  }

  private calculateKpiData(projects: Project[]): any {
    if (!projects || projects.length === 0) return { total: 0, uniqueTech: 0, uniqueTools: 0, avgTitleLength: 0 };
    const techSet = new Set<string>();
    const toolSet = new Set<string>();
    let totalTitleLength = 0;
    projects.forEach(p => {
      if (p.technologies) p.technologies.split(',').map(t => t.trim()).forEach(t => techSet.add(t));
      if (p.toolsUsed) p.toolsUsed.split(',').map(t => t.trim()).forEach(t => toolSet.add(t));
      totalTitleLength += p.title.length;
    });
    return {
      total: projects.length,
      uniqueTech: techSet.size,
      uniqueTools: toolSet.size,
      avgTitleLength: projects.length > 0 ? Math.round(totalTitleLength / projects.length) : 0
    };
  }

  private createTopItemsChart(projects: Project[], key: 'technologies' | 'toolsUsed'): ChartOptions {
    const counts: { [name: string]: number } = {};
    projects.forEach(project => {
      if (project[key]) {
        project[key].split(',').map(t => t.trim()).filter(t => t).forEach(item => {
          counts[item] = (counts[item] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 7);
    const categories = sorted.map(d => d[0]);
    const seriesData = sorted.map(d => d[1]);
    const chartType = key === 'technologies' ? 'tech' : 'tool';

    return {
      series: [{ name: 'Project Count', data: seriesData }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false }, events: { dataPointSelection: (_, __, config) => this.onBarClick(categories[config.dataPointIndex], chartType) }},
      plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4, barHeight: '50%' } },
      dataLabels: { enabled: true, style: { colors: ['#fff'] }, offsetX: 10 },
      xaxis: { categories, labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { show: true, style: { colors: 'var(--subtle-text-color)', fontSize: '14px' } } },
      grid: { borderColor: 'var(--border-color-translucent)', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip: { theme: 'dark', x: { show: false } },
      legend: { show: false }
    };
  }

  onBarClick(itemName: string, type: 'tech' | 'tool'): void {
    const currentClick = this.clickedItem$.value;
    if (currentClick?.name === itemName && currentClick?.type === type) {
      this.clickedItem$.next(null);
    } else {
      this.clickedItem$.next({ type, name: itemName });
    }
  }

  clearSelection(): void {
    this.clickedItem$.next(null);
  }

  private animateCounters(): void {
    if (this.kpiValueElements) {
      this.kpiValueElements.forEach(el => {
        const element = el.nativeElement;
        const targetValue = parseInt(element.getAttribute('data-value') || '0', 10);
        this.animateCount(element, targetValue);
      });
    }
  }

  private animateCount(element: HTMLElement, target: number): void {
    if (isNaN(target)) { element.innerText = '0'; return; }
    let frame = 0;
    const totalFrames = 60; // Animate over 60 frames (approx 1 second)
    const count = () => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(target * progress);
      element.innerText = current.toLocaleString();
      if (frame < totalFrames) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  }
}
