import { Component, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for NgIf, NgFor, NgClass
import { ThemeService } from '../../Services/theme-service.service'; // Corrected import path

// Interfaces
interface Project {
  id: number;
  title: string;
  icon: string; // For project specific icons
  status: 'active' | 'pending' | 'completed'; // Status for featured projects
  abstract: string;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
}

interface Statistic {
  icon: string;
  value: string;
  label: string;
  description?: string; // For more descriptive stats
}

interface Service {
  icon: string;
  title: string;
  description: string;
  features: string[]; // List of specific features for each service
}

interface CoreFeature { // New interface for Core Features section
  icon: string;
  title: string;
  description: string;
  benefits: string[]; // Specific benefits/skills for this feature
}

interface SkillOutcome { // NEW interface for Skills & Outcomes section
  icon: string;
  title: string;
  description: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // Ensure CommonModule is imported for directives
  templateUrl: './home.component.html',
  styleUrl: './home.component.css' // Note: This will be loaded as a component-specific style
})
export class HomeComponent implements OnInit, OnDestroy {
  universityName: string = "Borg El Arab Technological University";
  unitName: string = "Graduation Projects Management Unit";
  isDarkMode: boolean = true; // This will now be controlled by ThemeService
  currentYear: number = new Date().getFullYear();


  hero = {
    mainIcon: "fas fa-project-diagram",
    titleMain: "Unleash Innovation, Shape the Future",
    titleSub: `Your Gateway to Excellence in Graduation Projects at ${this.universityName}`,
    description: "Navigate your graduation project journey with confidence. From the initial spark of an idea to the final defense, we provide comprehensive support, expert guidance, and advanced tools for success.",
    ctaText: "Explore the Portal",
  };

  featuredProjects: Partial<Project>[] = [
    {
      id: 1,
      title: "AI-Powered Smart Campus",
      icon: "fa-robot",
      status: "active",
      abstract: "Developing intelligent systems for campus navigation and optimized resource utilization."
    },
    {
      id: 2,
      title: "Sustainable Energy Solutions",
      icon: "fa-solar-panel",
      status: "pending",
      abstract: "Research and prototype design for renewable energy sources in urban environments."
    },
    {
      id: 3,
      title: "Blockchain for Supply Chains",
      icon: "fa-cubes",
      status: "completed",
      abstract: "Implementing distributed ledger technology to enhance transparency in supply chain management."
    }
  ];

  coreFeatures: CoreFeature[] = [
    {
      icon: "fa-stream",
      title: "Integrated Project Workflow",
      description: "A comprehensive system guiding students from idea registration through final defense and grading.",
      benefits: [
        "Streamlined milestone tracking",
        "Automated deadline reminders",
        "Regular progress assessments"
      ]
    },
    {
      icon: "fa-hands-helping",
      title: "Smart Supervisor Matching",
      description: "Advanced algorithms to match students with supervisors based on research interests and expertise.",
      benefits: [
        "Accurate project-supervisor pairing",
        "Seamless communication channels",
        "Support for multidisciplinary fields"
      ]
    },
    {
      icon: "fa-users-between-lines",
      title: "Effective Collaboration Tools",
      description: "Built-in platforms for teamwork, document sharing, and task management among team members.",
      benefits: [
        "Instant file sharing",
        "Team progress monitoring",
        "Virtual workspace sessions"
      ]
    },
    {
      icon: "fa-chart-column",
      title: "Project Analytics & Performance",
      description: "Interactive dashboards providing insights into individual and group project performance.",
      benefits: [
        "Real-time progress monitoring",
        "Identification of strengths & weaknesses",
        "Comprehensive performance reports"
      ]
    },
    {
      icon: "fa-file-contract",
      title: "Document & Library Management",
      description: "A centralized system for storing and managing all project documentation, with a comprehensive resource library.",
      benefits: [
        "Secure file archiving",
        "Ready-to-use report templates",
        "Access to research resources"
      ]
    },
    {
      icon: "fa-brain",
      title: "Skill Development & Mentorship",
      description: "Dedicated programs and workshops to enhance students' research, technical, and presentation skills.",
      benefits: [
        "Hands-on practical workshops",
        "Continuous academic guidance",
        "Future-proof skill development"
      ]
    }
  ];

  skillsOutcomes: SkillOutcome[] = [
    {
      icon: "fa-lightbulb-on",
      title: "Critical Thinking",
      description: "Develop the ability to analyze complex problems and formulate innovative solutions."
    },
    {
      icon: "fa-users-gear",
      title: "Team Collaboration",
      description: "Master effective teamwork, communication, and conflict resolution within project teams."
    },
    {
      icon: "fa-code",
      title: "Technical Proficiency",
      description: "Enhance practical skills in software, hardware, and methodologies relevant to your field."
    },
    {
      icon: "fa-calendar-days",
      title: "Project Management",
      description: "Learn to plan, execute, and monitor projects, ensuring timely and successful completion."
    },
    {
      icon: "fa-presentation-screen",
      title: "Presentation & Communication",
      description: "Refine your ability to articulate ideas, present findings, and defend your work effectively."
    },
    {
      icon: "fa-scale-balanced",
      title: "Ethical Research",
      description: "Understand and apply ethical principles in research, data handling, and academic conduct."
    }
  ];

  statistics: Statistic[] = [
    {
      icon: "fa-folder-open",
      value: "500+",
      label: "Archived Projects",
      description: "Successfully completed and documented graduation projects at BATU."
    },
    {
      icon: "fa-users-cog",
      value: "150+",
      label: "Academic Supervisors",
      description: "Dedicated faculty members guiding student innovation and research."
    },
    {
      icon: "fa-award",
      value: "95%",
      label: "Project Success Rate",
      description: "High percentage of projects achieving their defined objectives."
    },
    {
      icon: "fa-lightbulb",
      value: "1000+",
      label: "Innovative Ideas",
      description: "Fostering a culture of creativity and problem-solving within our academic community."
    }
  ];

  services: Service[] = [
    {
      icon: "fa-handshake",
      title: "Project Consultation",
      description: "Expert guidance from faculty members on project selection, scope definition, and methodology.",
      features: [
        "One-on-one consultation sessions",
        "Idea evaluation workshops",
        "Research scope refinement"
      ]
    },
    {
      icon: "fa-flask",
      title: "Resource Access",
      description: "Access to essential labs, software, databases, and research materials for your project.",
      features: [
        "Dedicated lab hours",
        "Advanced software licenses",
        "Digital research repository"
      ]
    },
    {
      icon: "fa-chart-pie",
      title: "Progress Tracking",
      description: "Tools and systems to help you monitor your project's progress and meet deadlines.",
      features: [
        "Interactive dashboards",
        "Automated deadline alerts",
        "Performance analytics"
      ]
    },
    {
      icon: "fa-laptop-code",
      title: "Technical Workshops",
      description: "Hands-on workshops to enhance your technical skills relevant to your project.",
      features: [
        "Advanced programming & applications",
        "Data analysis tools",
        "Effective presentation skills"
      ]
    }
  ];

  timelineEvents: TimelineEvent[] = [
    {
      date: "September 2025",
      title: "Project Idea Submission",
      description: "Deadline for submitting initial graduation project proposals.",
      icon: "fa-file-alt"
    },
    {
      date: "October 2025",
      title: "Supervisor Matching",
      description: "Announcement of supervisor assignments for approved project proposals.",
      icon: "fa-user-tie"
    },
    {
      date: "January 2026",
      title: "Mid-term Review",
      description: "Presentation of preliminary results and project progress to evaluation committee.",
      icon: "fa-calendar-check"
    },
    {
      date: "May 2026",
      title: "Final Project Defense",
      description: "Oral presentation and practical demonstration of completed projects to an expert panel.",
      icon: "fa-shield-alt"
    },
    {
      date: "June 2026",
      title: "Project Archiving",
      description: "Submission of final project documentation and inclusion in the university archive.",
      icon: "fa-archive"
    }
  ];

  contactInfo = {
    address: "University Campus, Building 5, Borg El Arab, Alexandria, Egypt",
    phone: "+20 3 456 7890",
    email: "projects@baut.edu.eg"
  };

  footerInfo = {
    about: "The Graduation Projects Management Unit at Borg El Arab Technological University is dedicated to fostering innovation and guiding students through their final projects."
  }

  constructor(private renderer: Renderer2, private el: ElementRef, private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes from ThemeService
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    this.addAnimationClasses();
  }

  ngOnDestroy(): void {
    // No specific cleanup needed here for subscriptions if they complete or are handled by Angular (e.g., async pipe)
    // If you had manual event listeners or intervals, you'd unsubscribe them here.
  }

  private addAnimationClasses(): void {
    // Select elements and add animation classes.
    // Using setTimeout to ensure elements are rendered before applying animations
    // This provides a smoother initial load effect.
    setTimeout(() => {
      const heroText = this.el.nativeElement.querySelector('.hero-text');
      const heroVisual = this.el.nativeElement.querySelector('.hero-visual');

      if (heroText) {
        this.renderer.addClass(heroText, 'animate-fade-up');
      }
      if (heroVisual) {
        this.renderer.addClass(heroVisual, 'animate-slide-right');
      }
    }, 100); // Small delay to ensure DOM is ready
  }
}
