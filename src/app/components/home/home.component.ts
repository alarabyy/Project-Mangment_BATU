// import statement (unchanged)
import { Component, OnInit, OnDestroy, Renderer2, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaces (re-used and new) - (No changes needed here)
interface Project {
  id: number;
  title: string;
  supervisor: string;
  department: string;
  yearCompleted?: number;
  abstract: string;
  imageUrl?: string;
  tags: string[];
  studentNames?: string[];
  impactStatement?: string;
  videoLink?: string;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
}

interface FaqItem {
  question: string;
  answer: string;
  icon: string;
  isOpen?: boolean;
}

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  icon: string;
  socialLinks?: { platformIcon: string, url: string }[];
}

interface ResourceItem {
  title: string;
  description: string;
  typeIcon: string;
  downloadLink?: string;
  externalUrl?: string;
  category: string;
}

interface EventItem {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  icon: string;
  registrationLink?: string;
}

interface Statistic {
  icon: string;
  value: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  universityName: string = "Borg El Arab Technological University";
  unitName: string = "Graduation Project Management Unit";

  hero = {
    // هذه الأيقونة لم تعد تُستخدم كأيقونة مركزية كبيرة، ولكن يمكن الاحتفاظ بها كخاصية
    mainIcon: "pi pi-atom",
    titleMain: "Igniting Innovation, Shaping Futures",
    titleSub: `The Hub for Graduation Projects at ${this.universityName}`,
    description: "Your central platform for navigating the exciting journey of graduation projects. From initial spark to final showcase, we provide the tools, guidance, and support for success.",
    ctaText: "Discover the Portal",
    ctaLink: "#about-unit",
    ctaIcon: "pi pi-compass"
  };

  aboutSection = {
    titleIcon: "pi pi-building",
    title: "About The Unit",
    introduction: `Dedicated to excellence in student research and project development, our unit stands as a cornerstone of practical learning and innovation at ${this.universityName}.`,
    missionIcon: "pi pi-flag-fill",
    mission: "To cultivate an environment that empowers students to conceive, develop, and execute impactful graduation projects, fostering critical thinking, technical mastery, collaborative spirit, and contributing to labor market needs according to international standards.",
    visionIcon: "pi pi-eye",
    vision: "To be a nationally recognized center for student-led technological innovation, producing graduates equipped to solve real-world challenges, contribute significantly to societal and industrial advancement, and achieve sustainable development goals (Egypt Vision 2030).",
    imageUrl: "assets/images/university-campus-dark.jpg", // Updated image path
    values: [
      { icon: "pi pi-lightbulb", text: "Innovation & Creativity" },
      { icon: "pi pi-check-circle", text: "Academic & Applied Excellence" },
      { icon: "pi pi-users", text: "Collaboration & Teamwork" },
      { icon: "pi pi-briefcase", text: "Meeting Labor Market Needs" },
      { icon: "pi pi-globe", text: "International Standards" }
    ]
  };

  statistics: Statistic[] = [
    { icon: "pi pi-folder-open", value: "500+", label: "Projects Archived", description: "A growing repository of student ingenuity." },
    { icon: "pi pi-users", value: "2000+", label: "Students Guided", description: "Successfully mentored through their capstone experience." },
    { icon: "pi pi-briefcase", value: "50+", label: "Industry Collaborations", description: "Connecting academia with real-world applications." },
    { icon: "pi pi-star", value: "95%", label: "Satisfaction Rate", description: "From students and faculty involved in the process." }
  ];

  services: { titleIcon: string, title: string, description: string, listItems?: {icon: string, text: string}[] }[] = [
    {
      titleIcon: "pi pi-file-edit", title: "Proposal & Submission Gateway",
      description: "A streamlined, digital-first approach to project ideation and formal submission.",
      listItems: [
        { icon: "pi pi-cloud-upload", text: "Online proposal submission with templates." },
        { icon: "pi pi-history", text: "Version control and submission tracking." },
        { icon: "pi pi-comments", text: "Feedback and revision management." }
      ]
    },
    {
      titleIcon: "pi pi-sitemap", title: "Supervisor Matching & Mentorship",
      description: "Connecting students with expert faculty mentors to guide their research and development.",
      listItems: [
        { icon: "pi pi-search", text: "Directory of available supervisors and their expertise." },
        { icon: "pi pi-link", text: "Facilitated matching based on project domain." },
        { icon: "pi pi-calendar-times", text: "Tools for scheduling and tracking mentorship sessions." }
      ]
    },
    {
      titleIcon: "pi pi-chart-bar", title: "Progress Monitoring & Evaluation",
      description: "Transparent tools for tracking milestones, deliverables, and assessment.",
      listItems: [
        { icon: "pi pi-list", text: "Customizable project timelines and task management." },
        { icon: "pi pi-flag", text: "Milestone tracking with automated reminders." },
        { icon: "pi pi-book", text: "Rubric-based evaluation and grade management." }
      ]
    },
    {
      titleIcon: "pi pi-database", title: "Comprehensive Resource Hub",
      description: "A centralized repository of essential resources to support every stage of project development.",
      listItems: [
        { icon: "pi pi-file-pdf", text: "Access to research papers, journals, and e-books." },
        { icon: "pi pi-code", text: "Software tools, SDKs, and development environments." },
        { icon: "pi pi-video", text: "Tutorials, workshops, and best practice guides." }
      ]
    }
  ];

  featuredProjects: Project[] = [ // Data kept but section removed from HTML
    { id: 1, title: "Smart City Traffic Control System using IoT", supervisor: "Dr. Rana Mahmoud", department: "Computer Systems Engineering", yearCompleted: 2023, abstract: "An innovative system employing IoT sensors and AI algorithms to dynamically manage urban traffic flow, reducing congestion and improving emergency response times.", imageUrl: "assets/images/project-smart-traffic.jpg", tags: ["IoT", "AI", "Smart City", "Embedded Systems"], studentNames: ["Ahmed Hassan", "Sara Khaled"], impactStatement: "Demonstrated a 20% reduction in average commute times in simulated environments." },
    { id: 2, title: "Portable Water Purification Device for Disaster Relief", supervisor: "Prof. Omar Farouk", department: "Chemical Engineering", yearCompleted: 2023, abstract: "A low-cost, portable device utilizing advanced filtration and UV sterilization to provide safe drinking water in emergency situations and remote areas.", imageUrl: "assets/images/project-water-purification.jpg", tags: ["Water", "Sustainability", "Health", "Chemical Eng."], studentNames: ["Fatima Ali", "Youssef Mohamed"], impactStatement: "Winner of the University Innovation Challenge 2023." },
    { id: 3, title: "VR Training Simulator for Complex Surgical Procedures", supervisor: "Dr. Heba Salem", department: "Biomedical Engineering", yearCompleted: 2022, abstract: "A virtual reality simulator offering immersive and risk-free training for medical students learning intricate surgical techniques.", imageUrl: "assets/images/project-vr-surgery.jpg", tags: ["VR", "Medical", "Simulation", "Software Dev"], studentNames: ["Khalid Tarek"], impactStatement: "Adopted by the university's medical faculty for training purposes." }
  ];

  projectTimeline: TimelineEvent[] = [
    { date: "Semester Start: Weeks 1-4", title: "Project Ideation & Team Formation", description: "Brainstorming, identifying research gaps, forming project teams, and initial consultation with potential supervisors.", icon: "pi pi-users" },
    { date: "Weeks 5-8", title: "Proposal Development & Submission", description: "Detailed literature review, defining scope, objectives, methodology, and submitting the formal project proposal.", icon: "pi pi-file-import" },
    { date: "Weeks 9-12", title: "Supervisor Allocation & Project Kick-off", description: "Official supervisor assignment, project plan finalization, and commencement of core research/development.", icon: "pi pi-flag-fill" },
    { date: "Mid-Semester: Weeks 13-16", title: "Interim Report & Presentation", description: "Submission of an interim progress report and presentation to faculty, highlighting achievements and addressing challenges.", icon: "pi pi-desktop" },
    { date: "Weeks 17-24", title: "Core Development & Implementation", description: "Intensive phase of system development, experimentation, data collection, and analysis.", icon: "pi pi-cog" },
    { date: "Weeks 25-28", title: "Testing, Refinement & Documentation", description: "Rigorous testing, debugging, result validation, and comprehensive documentation of the project.", icon: "pi pi-sync" },
    { date: "Semester End: Weeks 29-30", title: "Final Thesis Submission & Plagiarism Check", description: "Compilation of the final thesis, adherence to formatting guidelines, and originality verification.", icon: "pi pi-book" },
    { date: "Post-Semester", title: "Viva Voce & Project Showcase", description: "Oral defense of the project, final evaluation, and opportunities to showcase achievements at university events or competitions.", icon: "pi pi-trophy" }
  ];

  teamMembers: TeamMember[] = [
    { name: "Prof. Dr. Ali Hassan", role: "Head of Project Management Unit", imageUrl: "assets/images/team-prof-ali-dark.jpg", icon: "pi pi-user-edit", bio: "Oversees the strategic direction and operational efficiency of the unit, ensuring alignment with university academic goals. Expert in research methodologies.", socialLinks: [{platformIcon: "pi pi-linkedin", url: "#"}] },
    { name: "Eng. Mariam Soliman", role: "Projects Coordinator & Technical Support", imageUrl: "assets/images/team-eng-mariam-dark.jpg", icon: "pi pi-cog", bio: "Manages day-to-day operations, provides technical guidance to students, and coordinates supervisor assignments. Specialist in software engineering projects.", socialLinks: [{platformIcon: "pi pi-linkedin", url: "#"}, {platformIcon: "pi pi-github", url: "#"}] },
    { name: "Ms. Fatima Ahmed", role: "Administrative Officer & Student Liaison", imageUrl: "assets/images/team-ms-fatima-dark.jpg", icon: "pi pi-comments", bio: "Handles administrative tasks, student inquiries, and communication, ensuring a smooth experience for all participants.", socialLinks: [{platformIcon: "pi pi-envelope", url: "mailto:..."}]}
  ];

  resources: ResourceItem[] = [
    { title: "Graduation Project Handbook 2024-2025", description: "Comprehensive guide covering all policies, procedures, deadlines, and formatting requirements.", typeIcon: "pi pi-file-pdf", downloadLink: "#", category: "Guidelines" },
    { title: "Project Proposal Template", description: "Standardized template for submitting your project proposal.", typeIcon: "pi pi-file-word", downloadLink: "#", category: "Templates" },
    { title: "Thesis Formatting Guide (IEEE Style)", description: "Detailed instructions on formatting your final thesis according to IEEE standards.", typeIcon: "pi pi-file-edit", downloadLink: "#", category: "Templates" },
    { title: "Access to IEEE Xplore Digital Library", description: "Full access to a vast collection of research papers and journals.", typeIcon: "pi pi-search-plus", externalUrl: "#", category: "Research" },
    { title: "Git & GitHub Workshop Materials", description: "Slides and code examples from our recent version control workshop.", typeIcon: "pi pi-github", externalUrl: "#", category: "Tools & Workshops" },
    { title: "Recommended Project Management Tools", description: "A list of free and paid tools for task management, collaboration, and timeline planning (e.g., Trello, Asana, Jira).", typeIcon: "pi pi-list", externalUrl: "#", category: "Tools & Workshops" }
  ];

  events: EventItem[] = [
    { title: "Kick-off Seminar: Navigating Your Graduation Project", date: "October 5, 2024", time: "10:00 AM - 12:00 PM", location: "Main Auditorium / Online Stream", description: "An essential session for all final year students covering project lifecycle, expectations, and available support.", icon: "pi pi-megaphone", registrationLink: "#" },
    { title: "Workshop: Advanced Research Methodologies", date: "November 12, 2024", time: "2:00 PM - 5:00 PM", location: "Room C401, Engineering Building", description: "Hands-on workshop focusing on effective literature reviews, data collection techniques, and statistical analysis.", icon: "pi pi-compass", registrationLink: "#" },
    { title: "Guest Lecture: AI in Modern Industry by Eng. X", date: "February 20, 2025", time: "6:00 PM - 7:30 PM", location: "Online (Zoom Link TBA)", description: "Industry expert shares insights on current AI trends and their application in real-world projects.", icon: "pi pi-comments", registrationLink: "#" },
    { title: "Annual Project Showcase & Innovation Fair", date: "July 15, 2025", location: "University Grand Hall", description: "Celebrate the culmination of student projects! A platform for students to present their work to faculty, industry guests, and the public.", icon: "pi pi-gift" }
  ];

  faqItems: FaqItem[] = [
    { icon: "pi pi-question-circle", question: "What is the typical timeline for a graduation project?", answer: "A graduation project typically spans two semesters (one academic year). Key milestones include proposal submission, interim reports, final thesis, and viva voce. Refer to the detailed timeline section above." },
    { icon: "pi pi-users", question: "Can I choose my own project supervisor?", answer: "Students can indicate supervisor preferences during proposal submission. While we strive to match preferences, final allocation depends on supervisor availability, expertise alignment, and workload." },
    { icon: "pi pi-book", question: "Are there specific formatting guidelines for the thesis?", answer: "Yes, the university follows a modified IEEE standard for thesis formatting. Detailed guidelines and templates are available in the Resources section." },
    { icon: "pi pi-desktop", question: "What software or tools are provided by the university?", answer: "The university provides access to various licensed software (e.g., MATLAB, CAD tools), cloud development platforms, and the IEEE Xplore library. Specific departmental resources may also be available." },
    { icon: "pi pi-info-circle", question: "Where can I find support if I face technical challenges?", answer: "Your primary point of contact is your supervisor. The Project Management Unit also offers technical workshops and can connect you with specialized lab technicians or IT support." }
  ];

  contactInfo = {
    sectionIcon: "pi pi-phone",
    title: "Get in Touch",
    description: "We're here to help! Reach out to us with your queries or for support regarding your graduation project.",
    emailIcon: "pi pi-envelope",
    email: `projects.unit@batu.edu.eg`, // Fictional
    phoneIcon: "pi pi-phone",
    phone: "+20 XXX XXX XXXX", // Fictional
    officeIcon: "pi pi-map-marker",
    officeLocation: `Room G05, Administration Building, ${this.universityName}`,
    officeHoursIcon: "pi pi-clock",
    officeHours: "Sunday - Thursday, 9:00 AM - 4:00 PM"
  };

  @ViewChildren('animatable') animatables!: QueryList<ElementRef>;
  private observer!: IntersectionObserver;

  constructor(
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Data is hardcoded.
  }

  ngAfterViewInit(): void {
    this.initIntersectionObserver();
  }

  initIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of the element is visible
    };

    this.observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'is-visible');
          // Optional: Keep observing or unobserve after first animation
          // obs.unobserve(entry.target);
        } else {
          // Optional: Remove class to re-animate if scrolled out and back in
          // this.renderer.removeClass(entry.target, 'is-visible');
        }
      });
    }, options);

    this.animatables.forEach(el => {
      this.observer.observe(el.nativeElement);
    });
  }

  toggleFaq(item: FaqItem): void {
    item.isOpen = !item.isOpen;
  }

  getYear(): number {
    return new Date().getFullYear();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
