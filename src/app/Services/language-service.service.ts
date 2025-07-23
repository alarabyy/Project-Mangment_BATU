import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Define the structure for home page translations
interface HomeTranslations {
  universityName: string;
  unitName: string;
  hero: {
    mainIcon: string;
    titleMain: string;
    titleSub: string;
    description: string;
    ctaText: string;
  };
  featuredProjects: {
    id: number;
    title: string;
    icon: string;
    status: 'active' | 'pending' | 'completed';
    abstract: string;
  }[];
  coreFeatures: {
    icon: string;
    title: string;
    description: string;
    benefits: string[];
  }[];
  skillsOutcomes: {
    icon: string; // تم تعديل الأيقونات هنا
    title: string;
    description: string;
  }[];
  statistics: {
    icon: string;
    value: string;
    label: string;
    description?: string;
  }[];
  services: {
    icon: string;
    title: string;
    description: string;
    features: string[];
  }[];
  timelineEvents: {
    date: string;
    title: string;
    description: string;
    icon: string;
  }[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    addressTitle?: string;
    phoneTitle?: string;
    emailTitle?: string;
  };
  footerInfo: {
    about: string;
  };
  sections: {
    features: { title: string; subtitle: string; };
    skillsOutcomes: { title: string; subtitle: string; };
    stats: { title: string; subtitle: string; };
    services: { title: string; subtitle: string; };
    timeline: { title: string; subtitle: string; };
    contact: { title: string; subtitle: string; };
  };
  form: {
    name: string;
    email: string;
    subject: string;
    message: string;
    sendButton: string;
  };
  statusLabels: {
    active: string;
    pending: string;
    completed: string;
  };
  ctaButtons: {
    exploreFeatures: string;
    projectRoadmap: string;
  };
}

interface Translations {
  en: {
    home: HomeTranslations;
  };
  ar: {
    home: HomeTranslations;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<'en' | 'ar'>;
  public currentLanguage$: Observable<'en' | 'ar'>;
  private renderer: Renderer2;

  private translations: Translations = {
    en: {
      home: {
        universityName: "Borg El Arab Technological University",
        unitName: "Graduation Projects Management Unit",
        hero: {
          mainIcon: "fas fa-project-diagram",
          titleMain: "Unleash Innovation, Shape the Future",
          titleSub: `Your Gateway to Excellence in Graduation Projects at Borg El Arab Technological University`,
          description: "Navigate your graduation project journey with confidence. From the initial spark of an idea to the final defense, we provide comprehensive support, expert guidance, and advanced tools for success.",
          ctaText: "Explore the Portal",
        },
        featuredProjects: [
          { id: 1, title: "AI-Powered Smart Campus", icon: "fa-robot", status: "active", abstract: "Developing intelligent systems for campus navigation and optimized resource utilization." },
          { id: 2, title: "Sustainable Energy Solutions", icon: "fa-solar-panel", status: "pending", abstract: "Research and prototype design for renewable energy sources in urban environments." },
          { id: 3, title: "Blockchain for Supply Chains", icon: "fa-cubes", status: "completed", abstract: "Implementing distributed ledger technology to enhance transparency in supply chain management." }
        ],
        coreFeatures: [
          { icon: "fa-stream", title: "Integrated Project Workflow", description: "A comprehensive system guiding students from idea registration through final defense and grading.", benefits: ["Streamlined milestone tracking", "Automated deadline reminders", "Regular progress assessments"] },
          { icon: "fa-hands-helping", title: "Smart Supervisor Matching", description: "Advanced algorithms to match students with supervisors based on research interests and expertise.", benefits: ["Accurate project-supervisor pairing", "Seamless communication channels", "Support for multidisciplinary fields"] },
          { icon: "fa-users-between-lines", title: "Effective Collaboration Tools", description: "Built-in platforms for teamwork, document sharing, and task management among team members.", benefits: ["Instant file sharing", "Team progress monitoring", "Virtual workspace sessions"] },
          { icon: "fa-chart-column", title: "Project Analytics & Performance", description: "Interactive dashboards providing insights into individual and group project performance.", benefits: ["Real-time progress monitoring", "Identification of strengths & weaknesses", "Comprehensive performance reports"] },
          { icon: "fa-file-contract", title: "Document & Library Management", description: "A centralized system for storing and managing all project documentation, with a comprehensive resource library.", benefits: ["Secure file archiving", "Ready-to-use report templates", "Access to research resources"] },
          { icon: "fa-brain", title: "Skill Development & Mentorship", description: "Dedicated programs and workshops to enhance students' research, technical, and presentation skills.", benefits: ["Hands-on practical workshops", "Continuous academic guidance", "Future-proof skill development"] }
        ],
        skillsOutcomes: [
          { icon: "fa-lightbulb", title: "Critical Thinking", description: "Develop the ability to analyze complex problems and formulate innovative solutions." }, // Changed icon
          { icon: "fa-users", title: "Team Collaboration", description: "Master effective teamwork, communication, and conflict resolution within project teams." }, // Changed icon
          { icon: "fa-code", title: "Technical Proficiency", description: "Enhance practical skills in software, hardware, and methodologies relevant to your field." },
          { icon: "fa-calendar-alt", title: "Project Management", description: "Learn to plan, execute, and monitor projects, ensuring timely and successful completion." }, // Changed icon
          { icon: "fa-desktop", title: "Presentation & Communication", description: "Refine your ability to articulate ideas, present findings, and defend your work effectively." }, // Changed icon
          { icon: "fa-balance-scale", title: "Ethical Research", description: "Understand and apply ethical principles in research, data handling, and academic conduct." } // Changed icon
        ],
        statistics: [
          { icon: "fa-folder-open", value: "500+", label: "Archived Projects", description: "Successfully completed and documented graduation projects at BATU." },
          { icon: "fa-users-cog", value: "150+", label: "Academic Supervisors", description: "Dedicated faculty members guiding student innovation and research." },
          { icon: "fa-award", value: "95%", label: "Project Success Rate", description: "High percentage of projects achieving their defined objectives." },
          { icon: "fa-lightbulb", value: "1000+", label: "Innovative Ideas", description: "Fostering a culture of creativity and problem-solving within our academic community." }
        ],
        services: [
          { icon: "fa-handshake", title: "Project Consultation", description: "Expert guidance from faculty members on project selection, scope definition, and methodology.", features: ["One-on-one consultation sessions", "Idea evaluation workshops", "Research scope refinement"] },
          { icon: "fa-flask", title: "Resource Access", description: "Access to essential labs, software, databases, and research materials for your project.", features: ["Dedicated lab hours", "Advanced software licenses", "Digital research repository"] },
          { icon: "fa-chart-pie", title: "Progress Tracking", description: "Tools and systems to help you monitor your project's progress and meet deadlines.", features: ["Interactive dashboards", "Automated deadline alerts", "Performance analytics"] },
          { icon: "fa-laptop-code", title: "Technical Workshops", description: "Hands-on workshops to enhance your technical skills relevant to your project.", features: ["Advanced programming & applications", "Data analysis tools", "Effective presentation skills"] }
        ],
        timelineEvents: [
          { date: "September 2025", title: "Project Idea Submission", description: "Deadline for submitting initial graduation project proposals.", icon: "fa-file-alt" },
          { date: "October 2025", title: "Supervisor Matching", description: "Announcement of supervisor assignments for approved project proposals.", icon: "fa-user-tie" },
          { date: "January 2026", title: "Mid-term Review", description: "Presentation of preliminary results and project progress to evaluation committee.", icon: "fa-calendar-check" },
          { date: "May 2026", title: "Final Project Defense", description: "Oral presentation and practical demonstration of completed projects to an expert panel.", icon: "fa-shield-alt" },
          { date: "June 2026", title: "Project Archiving", description: "Submission of final project documentation and inclusion in the university archive.", icon: "fa-archive" }
        ],
        contactInfo: {
          address: "University Campus, Building 5, Borg El Arab, Alexandria, Egypt",
          phone: "+20 3 456 7890",
          email: "projects@baut.edu.eg",
          addressTitle: "Our Location",
          phoneTitle: "Phone Number",
          emailTitle: "Email Address"
        },
        footerInfo: {
          about: "The Graduation Projects Management Unit at Borg El Arab Technological University is dedicated to fostering innovation and guiding students through their final projects."
        },
        sections: {
          features: { title: "Core System Features", subtitle: "Our system is designed to streamline and facilitate the graduation project management process for students and faculty at Borg El Arab Technological University." },
          skillsOutcomes: { title: "Skills & Outcomes Gained", subtitle: "Beyond project completion, our platform fosters crucial skills essential for your future career and academic success." },
          stats: { title: "Our Achievements in Numbers", subtitle: "Celebrating the milestones and accomplishments within our thriving graduation project community at our university." },
          services: { title: "Comprehensive Project Support", subtitle: "We offer a suite of services designed to empower students and faculty throughout the entire project lifecycle." },
          timeline: { title: "Project Milestones & Important Dates", subtitle: "Stay informed about critical deadlines, events, and phases of your graduation project journey." },
          contact: { title: "Get in Touch", subtitle: "Have questions or need assistance? Reach out to the Graduation Projects Management Unit." },
        },
        form: {
          name: "Your Name",
          email: "Your Email",
          subject: "Subject",
          message: "Your Message",
          sendButton: "Send Message"
        },
        statusLabels: {
          active: "Active",
          pending: "Pending",
          completed: "Completed"
        },
        ctaButtons: {
          exploreFeatures: "Explore Features",
          projectRoadmap: "Project Roadmap"
        }
      }
    },
    ar: {
      home: {
        universityName: "جامعة برج العرب التكنولوجية",
        unitName: "وحدة إدارة مشاريع التخرج",
        hero: {
          mainIcon: "fas fa-project-diagram",
          titleMain: "أطلق العنان للابتكار، شكّل المستقبل",
          titleSub: `بوابتك للتميز في مشاريع التخرج بجامعة برج العرب التكنولوجية`,
          description: "تصفح رحلة مشروع تخرجك بثقة. من الشرارة الأولى للفكرة إلى الدفاع النهائي، نوفر دعمًا شاملاً، وتوجيهًا خبيرًا، وأدوات متقدمة للنجاح.",
          ctaText: "استكشف البوابة",
        },
        featuredProjects: [
          { id: 1, title: "الجامعة الذكية المدعومة بالذكاء الاصطناعي", icon: "fa-robot", status: "active", abstract: "تطوير أنظمة ذكية للملاحة داخل الحرم الجامعي وتحسين استخدام الموارد." },
          { id: 2, title: "حلول الطاقة المستدامة", icon: "fa-solar-panel", status: "pending", abstract: "بحث وتصميم نماذج أولية لمصادر الطاقة المتجددة في البيئات الحضرية." },
          { id: 3, title: "بلوكتشين لسلاسل الإمداد", icon: "fa-cubes", status: "completed", abstract: "تنفيذ تقنية السجلات الموزعة لتعزيز الشفافية في إدارة سلاسل الإمداد." }
        ],
        coreFeatures: [
          { icon: "fa-stream", title: "سير عمل المشروع المتكامل", description: "نظام شامل يوجه الطلاب من تسجيل الفكرة حتى الدفاع النهائي والتقييم.", benefits: ["تتبع مبسط للمراحل الرئيسية", "تذكيرات آلية بالمواعيد النهائية", "تقييمات منتظمة للتقدم"] },
          { icon: "fa-hands-helping", title: "مطابقة المشرف الذكية", description: "خوارزميات متقدمة لمطابقة الطلاب بالمشرفين بناءً على اهتمامات البحث والخبرة.", benefits: ["مطابقة دقيقة للمشروع والمشرف", "قنوات اتصال سلسة", "دعم المجالات متعددة التخصصات"] },
          { icon: "fa-users-between-lines", title: "أدوات تعاون فعالة", description: "منصات مدمجة للعمل الجماعي، ومشاركة المستندات، وإدارة المهام بين أعضاء الفريق.", benefits: ["مشاركة الملفات الفورية", "مراقبة تقدم الفريق", "جلسات العمل الافتراضية"] },
          { icon: "fa-chart-column", title: "تحليلات وأداء المشاريع", description: "لوحات معلومات تفاعلية توفر رؤى حول أداء المشاريع الفردية والجماعية.", benefits: ["مراقبة التقدم في الوقت الفعلي", "تحديد نقاط القوة والضعف", "تقارير أداء شاملة"] },
          { icon: "fa-file-contract", title: "إدارة المستندات والمكتبة", description: "نظام مركزي لتخزين وإدارة جميع وثائق المشروع، مع مكتبة موارد شاملة.", benefits: ["أرشفة آمنة للملفات", "قوالب تقارير جاهزة للاستخدام", "الوصول إلى مصادر البحث"] },
          { icon: "fa-brain", title: "تطوير المهارات والإرشاد", description: "برامج وورش عمل مخصصة لتعزيز مهارات الطلاب البحثية والفنية والعرض.", benefits: ["ورش عمل عملية", "توجيه أكاديمي مستمر", "تطوير مهارات لمستقبل مشرق"] }
        ],
        skillsOutcomes: [
          { icon: "fa-lightbulb", title: "التفكير النقدي", description: "تطوير القدرة على تحليل المشكلات المعقدة وصياغة حلول مبتكرة." }, // Changed icon
          { icon: "fa-users", title: "التعاون الفريقي", description: "إتقان العمل الجماعي الفعال، والتواصل، وحل النزاعات داخل فرق المشروع." }, // Changed icon
          { icon: "fa-code", title: "الكفاءة التقنية", description: "تعزيز المهارات العملية في البرمجيات والأجهزة والمنهجيات ذات الصلة بمجال دراستك." },
          { icon: "fa-calendar-alt", title: "إدارة المشاريع", description: "تعلم كيفية تخطيط المشاريع وتنفيذها ومراقبتها، لضمان إنجازها في الوقت المناسب وبنجاح." }, // Changed icon
          { icon: "fa-desktop", title: "العرض والتواصل", description: "صقل قدرتك على صياغة الأفكار، وتقديم النتائج، والدفاع عن عملك بفعالية." }, // Changed icon
          { icon: "fa-balance-scale", title: "البحث الأخلاقي", description: "فهم وتطبيق المبادئ الأخلاقية في البحث، ومعالجة البيانات، والسلوك الأكاديمي." } // Changed icon
        ],
        statistics: [
          { icon: "fa-folder-open", value: "+500", label: "مشاريع مؤرشفة", description: "مشاريع تخرج مكتملة وموثقة بنجاح في جامعة برج العرب التكنولوجية." },
          { icon: "fa-users-cog", value: "+150", label: "مشرف أكاديمي", description: "أعضاء هيئة تدريس متخصصون يوجهون الابتكار والبحث الطلابي." },
          { icon: "fa-award", value: "%95", label: "معدل نجاح المشاريع", description: "نسبة عالية من المشاريع التي تحقق أهدافها المحددة." },
          { icon: "fa-lightbulb", value: "+1000", label: "أفكار مبتكرة", description: "تعزيز ثقافة الإبداع وحل المشكلات داخل مجتمعنا الأكاديمي." }
        ],
        services: [
          { icon: "fa-handshake", title: "استشارات المشاريع", description: "توجيهات خبراء من أعضاء هيئة التدريس حول اختيار المشروع، وتحديد النطاق، والمنهجية.", features: ["جلسات استشارة فردية", "ورش عمل لتقييم الأفكار", "صقل نطاق البحث"] },
          { icon: "fa-flask", title: "الوصول إلى الموارد", description: "الوصول إلى المعامل الأساسية، والبرامج، وقواعد البيانات، والمواد البحثية لمشروعك.", features: ["ساعات معمل مخصصة", "تراخيص برامج متقدمة", "مستودع بحث رقمي"] },
          { icon: "fa-chart-pie", title: "تتبع التقدم", description: "أدوات وأنظمة لمساعدتك في مراقبة تقدم مشروعك والالتزام بالمواعيد النهائية.", features: ["لوحات معلومات تفاعلية", "تنبيهات آلية بالمواعيد النهائية", "تحليلات الأداء"] },
          { icon: "fa-laptop-code", title: "ورش عمل فنية", description: "ورش عمل عملية لتعزيز مهاراتك الفنية ذات الصلة بمشروعك.", features: ["برمجة وتطبيقات متقدمة", "أدوات تحليل البيانات", "مهارات عرض فعالة"] }
        ],
        timelineEvents: [
          { date: "سبتمبر 2025", title: "تقديم أفكار المشاريع", description: "الموعد النهائي لتقديم مقترحات مشاريع التخرج الأولية.", icon: "fa-file-alt" },
          { date: "أكتوبر 2025", title: "مطابقة المشرفين", description: "إعلان تعيين المشرفين لمقترحات المشاريع المعتمدة.", icon: "fa-user-tie" },
          { date: "يناير 2026", title: "مراجعة منتصف المدة", description: "عرض النتائج الأولية وتقدم المشروع للجنة التقييم.", icon: "fa-calendar-check" },
          { date: "مايو 2026", title: "الدفاع النهائي عن المشروع", description: "عرض شفوي وعرض عملي للمشاريع المكتملة أمام لجنة خبراء.", icon: "fa-shield-alt" },
          { date: "يونيو 2026", title: "أرشفة المشروع", description: "تسليم الوثائق النهائية للمشروع وإدراجها في أرشيف الجامعة.", icon: "fa-archive" }
        ],
        contactInfo: {
          address: "الحرم الجامعي، مبنى 5، برج العرب، الإسكندرية، مصر",
          phone: "+20 3 456 7890",
          email: "projects@baut.edu.eg",
          addressTitle: "موقعنا",
          phoneTitle: "رقم الهاتف",
          emailTitle: "عنوان البريد الإلكتروني"
        },
        footerInfo: {
          about: "تكرس وحدة إدارة مشاريع التخرج بجامعة برج العرب التكنولوجية جهودها لتعزيز الابتكار وتوجيه الطلاب خلال مشاريعهم النهائية."
        },
        sections: {
          features: { title: "الميزات الأساسية للنظام", subtitle: "تم تصميم نظامنا لتبسيط وتسهيل عملية إدارة مشاريع التخرج للطلاب وأعضاء هيئة التدريس في جامعة برج العرب التكنولوجية." },
          skillsOutcomes: { title: "المهارات والنتائج المكتسبة", subtitle: "بالإضافة إلى إنجاز المشروع، تعزز منصتنا مهارات حاسمة ضرورية لمستقبلك المهني والأكاديمي." },
          stats: { title: "إنجازاتنا بالأرقام", subtitle: "احتفالًا بالإنجازات والمعالم البارزة داخل مجتمع مشاريع التخرج المزدهر في جامعتنا." },
          services: { title: "دعم شامل للمشاريع", subtitle: "نقدم مجموعة من الخدمات المصممة لتمكين الطلاب وأعضاء هيئة التدريس طوال دورة حياة المشروع بأكملها." },
          timeline: { title: "المراحل الرئيسية للمشروع والتواريخ الهامة", subtitle: "ابق على اطلاع بالمواعيد النهائية الهامة، والأحداث، ومراحل رحلة مشروع تخرجك." },
          contact: { title: "تواصل معنا", subtitle: "هل لديك أسئلة أو تحتاج إلى مساعدة؟ تواصل مع وحدة إدارة مشاريع التخرج." },
        },
        form: {
          name: "اسمك",
          email: "بريدك الإلكتروني",
          subject: "الموضوع",
          message: "رسالتك",
          sendButton: "إرسال الرسالة"
        },
        statusLabels: {
          active: "نشط",
          pending: "قيد الانتظار",
          completed: "مكتمل"
        },
        ctaButtons: {
          exploreFeatures: "استكشف الميزات",
          projectRoadmap: "خارطة طريق المشروع"
        }
      }
    }
  };

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    const storedLang = localStorage.getItem('currentLanguage') as 'en' | 'ar';
    const initialLang = storedLang || 'en';
    this.currentLanguageSubject = new BehaviorSubject<'en' | 'ar'>(initialLang);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
    this.updateBodyDirection(initialLang);
  }

  getCurrentLanguage(): 'en' | 'ar' {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: 'en' | 'ar'): void {
    if (this.currentLanguageSubject.value !== lang) {
      localStorage.setItem('currentLanguage', lang);
      this.currentLanguageSubject.next(lang);
      this.updateBodyDirection(lang);
    }
  }

  getTranslation(key: 'home'): HomeTranslations {
    const lang = this.getCurrentLanguage();
    return this.translations[lang][key];
  }

  private updateBodyDirection(lang: 'en' | 'ar'): void {
    const body = document.body;
    if (lang === 'ar') {
      this.renderer.setAttribute(body, 'dir', 'rtl');
      this.renderer.addClass(body, 'rtl-active');
    } else {
      this.renderer.removeAttribute(body, 'dir');
      this.renderer.removeClass(body, 'rtl-active');
    }
  }
}
