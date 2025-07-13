import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
// Import all specific ApexCharts types you're using in ChartOptions
import { ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexPlotOptions, ApexResponsive, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis, NgApexchartsModule } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { Project } from '../../../models/project';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ProjectService } from '../../../Services/project.service';

// ApexCharts type definitions
type ChartOptions = Partial<{
  series: any[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  grid: ApexGrid;
  fill: ApexFill;
  title: ApexTitleSubtitle;
  subtitle: ApexTitleSubtitle;
  responsive: ApexResponsive[];
}>;

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
  public filteredProjects$!: Observable<Project[]>;

  private categoryFilter$ = new BehaviorSubject<string>('all');
  private statusFilter$ = new BehaviorSubject<string>('all');

  public kpiData$!: Observable<any>;

  // Initialize chart options observables with an empty object
  public projectStatusDistributionOptions$: Observable<Partial<ChartOptions>> = of({});
  public projectsByCategoryOptions$: Observable<Partial<ChartOptions>> = of({});
  public projectsByDepartmentOptions$: Observable<Partial<ChartOptions>> = of({});
  public topTechnologiesOptions$: Observable<Partial<ChartOptions>> = of({});
  public newProjectsOverTimeOptions$: Observable<Partial<ChartOptions>> = of({});

  public uniqueCategories: string[] = [];
  public uniqueDepartments: string[] = [];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    const source$ = this.projectService.getProjects().pipe(
      map(projects => ({ isLoading: false, projects, error: null })),
      startWith({ isLoading: true, projects: [], error: null as string | null }),
      catchError(err => of({ isLoading: false, projects: [], error: 'Could not load project analytics data.' })),
      shareReplay(1)
    );

    this.state$ = source$;

    this.filteredProjects$ = combineLatest([
      source$.pipe(map(s => s.projects)),
      this.categoryFilter$,
      this.statusFilter$
    ]).pipe(
      map(([projects, category, status]) => {
        if (!this.uniqueCategories.length || !this.uniqueDepartments.length) {
          this.populateFilterOptions(projects);
        }
        return this.applyFilters(projects, category, status);
      })
    );

    this.kpiData$ = this.filteredProjects$.pipe(map(projects => this.calculateKpiData(projects)));

    // Assign chart options observables after data is processed
    this.projectStatusDistributionOptions$ = this.filteredProjects$.pipe(map(projects => this.createProjectStatusDistributionChart(projects)));
    this.projectsByCategoryOptions$ = this.filteredProjects$.pipe(map(projects => this.createProjectsByCategoryChart(projects)));
    this.projectsByDepartmentOptions$ = this.filteredProjects$.pipe(map(projects => this.createProjectsByDepartmentChart(projects)));
    this.topTechnologiesOptions$ = this.filteredProjects$.pipe(map(projects => this.createTopTechnologiesChart(projects)));
    this.newProjectsOverTimeOptions$ = this.filteredProjects$.pipe(map(projects => this.createNewProjectsOverTimeChart(projects)));
  }

  ngAfterViewInit(): void {
    this.kpiSubscription = this.kpiData$.subscribe(data => {
      if (data && this.kpiValueElements && this.kpiValueElements.length > 0) {
        setTimeout(() => this.animateCounters(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) {
      this.kpiSubscription.unsubscribe();
    }
  }

  private populateFilterOptions(projects: Project[]): void {
    const categories = new Set<string>();
    const departments = new Set<string>();
    projects.forEach(p => {
      if (p.category?.name) categories.add(p.category.name);
      if (p.department?.name) departments.add(p.department.name);
    });
    this.uniqueCategories = Array.from(categories).sort();
    this.uniqueDepartments = Array.from(departments).sort();
  }

  applyFilters(projects: Project[], category: string, status: string): Project[] {
    return projects.filter(project => {
      const isCategoryMatch = category === 'all' || (project.category?.name && project.category.name.toLowerCase() === category.toLowerCase());
      const isStatusMatch = status === 'all' || this.getProjectStatus(project).toLowerCase() === status.toLowerCase();
      return isCategoryMatch && isStatusMatch;
    });
  }

  onCategoryFilterChange(event: Event): void { this.categoryFilter$.next((event.target as HTMLSelectElement).value); }
  onStatusFilterChange(event: Event): void { this.statusFilter$.next((event.target as HTMLSelectElement).value); }

  private getProjectStatus(project: Project): string {
    if (project.submissionDate && !isNaN(new Date(project.submissionDate).getTime()) && new Date(project.submissionDate) <= new Date()) {
      return 'Submitted';
    }
    return 'Ongoing';
  }

  private calculateKpiData(projects: Project[]): any {
    if (!projects || projects.length === 0) return { total: 0, submitted: 0, ongoing: 0, newLastMonth: 0 };
    const thirtyDaysAgo = subDays(new Date(), 30);
    return {
      total: projects.length,
      submitted: projects.filter(p => this.getProjectStatus(p) === 'Submitted').length,
      ongoing: projects.filter(p => this.getProjectStatus(p) === 'Ongoing').length,
      newLastMonth: projects.filter(p => p.startDate && new Date(p.startDate) > thirtyDaysAgo).length,
    };
  }

  private createNewProjectsOverTimeChart(projects: Project[]): Partial<ChartOptions> {
      const last30Days = subDays(new Date(), 30);
      const projectsByDay = new Map<string, number>();
      const dateInterval = eachDayOfInterval({ start: last30Days, end: new Date() });
      dateInterval.forEach(day => projectsByDay.set(format(day, 'yyyy-MM-dd'), 0));

      projects.forEach(project => {
          if (project.startDate && !isNaN(new Date(project.startDate).getTime()) && new Date(project.startDate) >= last30Days) {
              const dayKey = format(startOfDay(new Date(project.startDate)), 'yyyy-MM-dd');
              if (projectsByDay.has(dayKey)) {
                  projectsByDay.set(dayKey, projectsByDay.get(dayKey)! + 1);
              }
          }
      });

      const sortedDays = Array.from(projectsByDay.keys()).sort();
      const seriesData = sortedDays.map(day => projectsByDay.get(day)!);
      const categories = sortedDays.map(day => format(new Date(day), 'MMM d'));

      return {
          series: [{ name: 'New Projects', data: seriesData }],
          chart: { type: 'area', height: 350, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
          dataLabels: { enabled: false }, stroke: { curve: 'smooth', width: 3 }, colors: ['var(--primary-accent)'],
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } },
          xaxis: { categories, labels: { style: { colors: 'var(--subtle-text-color)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: 'var(--subtle-text-color)' } } },
          grid: { borderColor: 'var(--border-color-translucent)', strokeDashArray: 4 },
          tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } },
      };
  }

  private createProjectStatusDistributionChart(projects: Project[]): Partial<ChartOptions> {
    const statusCounts: { [status: string]: number } = { 'Submitted': 0, 'Ongoing': 0 };
    projects.forEach(project => {
      const status = this.getProjectStatus(project);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const series = Object.values(statusCounts);

    const donutColors = ['#4CAF50', '#FFC107']; // Green for Submitted, Amber for Ongoing

    return {
      series: series,
      chart: { type: 'donut', height: 350, background: 'transparent' },
      labels: labels,
      colors: donutColors.slice(0, labels.length),
      legend: { position: 'bottom', horizontalAlign: 'center', floating: false, labels: { colors: 'var(--subtle-text-color)' } },
      dataLabels: {
        enabled: true,
        formatter: (val: any, opts: any) => {
          const total = opts.w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
          const percentage = (opts.w.globals.series[opts.seriesIndex] / total * 100).toFixed(1);
          return `${percentage}%`;
        },
        dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 1,
            color: '#000',
            opacity: 0.45
        },
        style: {
            fontSize: '12px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#fff']
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Projects',
                color: 'var(--subtle-text-color)',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toLocaleString()
              }
            }
          }
        }
      },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Projects` } },
    };
  }

  private createProjectsByCategoryChart(projects: Project[]): Partial<ChartOptions> {
    const categoryCounts: { [categoryName: string]: number } = {};
    projects.forEach(project => {
      const categoryName = project.category?.name || 'Uncategorized';
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    let sortedCategories = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1]);
    const categories = sortedCategories.map(d => d[0]);
    const seriesData = sortedCategories.map(d => d[1]);

    const barColors = categories.map((_, i) => {
        const hue = (i * 50) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    });

    return {
      series: [{ name: 'Project Count', data: seriesData }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      colors: barColors,
      plotOptions: { bar: { borderRadius: 4, horizontal: false, distributed: true, columnWidth: '70%' } },
      dataLabels: { enabled: true, style: { colors: ['var(--text-color)'] } },
      xaxis: { categories: categories, labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { show: true, style: { colors: 'var(--subtle-text-color)', fontSize: '14px' } } },
      grid: { borderColor: 'var(--border-color-translucent)', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Projects` } }, legend: { show: false }
    };
  }

  private createProjectsByDepartmentChart(projects: Project[]): Partial<ChartOptions> {
    const departmentCounts: { [departmentName: string]: number } = {};
    projects.forEach(project => {
      const departmentName = project.department?.name || 'No Department';
      departmentCounts[departmentName] = (departmentCounts[departmentName] || 0) + 1;
    });

    let sortedDepartments = Object.entries(departmentCounts).sort((a,b) => b[1] - a[1]);
    const departments = sortedDepartments.map(d => d[0]);
    const seriesData = sortedDepartments.map(d => d[1]);

    const barColors = departments.map((_, i) => {
        const hue = (i * 60 + 120) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    });

    return {
      series: [{ name: 'Project Count', data: seriesData }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      colors: barColors,
      plotOptions: { bar: { borderRadius: 4, horizontal: false, distributed: true, columnWidth: '70%' } },
      dataLabels: { enabled: true, style: { colors: ['var(--text-color)'] } },
      xaxis: { categories: departments, labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { show: true, style: { colors: 'var(--subtle-text-color)', fontSize: '14px' } } },
      grid: { borderColor: 'var(--border-color-translucent)', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Projects` } }, legend: { show: false }
    };
  }

  private createTopTechnologiesChart(projects: Project[]): Partial<ChartOptions> {
    const technologyCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      if (project.technologies) {
        project.technologies.split(',').map(t => t.trim()).filter(t => t).forEach(tech => {
          technologyCounts[tech] = (technologyCounts[tech] || 0) + 1;
        });
      }
    });

    let sortedTechnologies = Object.entries(technologyCounts).sort((a,b) => b[1] - a[1]);
    const topN = 7;
    let seriesData, categories;

    if(sortedTechnologies.length > topN) {
      const topTechs = sortedTechnologies.slice(0, topN);
      const otherCount = sortedTechnologies.slice(topN).reduce((sum, current) => sum + current[1], 0);
      topTechs.push(['Other', otherCount]);
      seriesData = topTechs.map(d => d[1]);
      categories = topTechs.map(d => d[0]);
    } else {
      seriesData = sortedTechnologies.map(d => d[1]);
      categories = sortedTechnologies.map(d => d[0]);
    }

    const barColors = categories.map((_, i) => {
        const hue = (i * 40 + 240) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    });

    return {
      series: [{ name: 'Project Count', data: seriesData }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      colors: barColors,
      plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '70%' } },
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: { categories: categories, labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { show: true, style: { colors: 'var(--subtle-text-color)', fontSize: '14px' } } },
      grid: { borderColor: 'var(--border-color-translucent)', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip: { theme: 'dark', x: { show: false } }, legend: { show: false }
    };
  }

  private animateCounters(): void {
    this.kpiValueElements.forEach(el => {
      const element = el.nativeElement;
      const targetValue = parseInt(element.getAttribute('data-value') || '0', 10);
      this.animateCount(element, targetValue);
    });
  }

  private animateCount(element: HTMLElement, target: number): void {
    if (isNaN(target)) { element.innerText = '0'; return; }
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const count = () => {
      frame++;
      const progress = frame / totalFrames;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * easedProgress);
      element.innerText = current.toLocaleString();
      if (frame < totalFrames) requestAnimationFrame(count);
      else element.innerText = target.toLocaleString();
    };
    requestAnimationFrame(count);
  }
}
