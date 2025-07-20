import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Faculty } from '../../../models/faculty'; // تأكد من المسار الصحيح
import { FacultyService } from '../../../Services/faculty.service'; // تأكد من المسار الصحيح
import { catchError, finalize, of, debounceTime, distinctUntilChanged, switchMap, filter, Subscription, BehaviorSubject } from 'rxjs';
import { Dean, UserService } from '../../../Services/user.service';

@Component({
  selector: 'app-faculty-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-edit.component.html',
  styleUrls: ['./faculty-edit.component.css']
})
export class FacultyEditComponent implements OnInit, OnDestroy {
  facultyId: number | null = null;
  faculty: Faculty | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  // خصائص جديدة للبحث عن العميد
  availableDeans: Dean[] = [];
  deanSearchTerm = new BehaviorSubject<string>('');
  private searchSubscription: Subscription | undefined;
  showDeanSuggestions = false;
  selectedDean: Dean | null = null; // للاحتفاظ بالعميد المحدد بعد التحميل أو الاختيار

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facultyService: FacultyService,
    private userService: UserService // حقن خدمة المستخدم
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.facultyId = +idParam;
      this.loadFacultyDetails();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Faculty ID is missing from the URL.';
    }

    // الاشتراك في BehaviorSubject لبدء البحث بعد تأخير
    this.searchSubscription = this.deanSearchTerm.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.trim().length >= 2),
      switchMap(term => this.userService.searchUsers(term).pipe(
        catchError(err => {
          console.error('Error searching for deans:', err);
          this.availableDeans = [];
          this.showDeanSuggestions = false;
          return of([]);
        })
      ))
    ).subscribe(deans => {
      this.availableDeans = deans;
      this.showDeanSuggestions = deans.length > 0;
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadFacultyDetails(): void {
    if (!this.facultyId) return;
    this.isLoading = true;
    this.facultyService.getFacultyById(this.facultyId).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        this.errorMessage = err.status === 404 ? 'Faculty not found.' : 'Failed to load details.';
        this.faculty = null; // تأكد من مسح البيانات القديمة
        return of(null);
      })
    ).subscribe(data => {
      this.faculty = data;
      // إذا تم تحميل الكلية بنجاح وكان لديها عميد، قم بتهيئته
      if (this.faculty && this.faculty.dean && this.faculty.dean.id) {
        this.selectedDean = { id: this.faculty.dean.id, name: this.faculty.dean.name };
        this.faculty.deanId = this.faculty.dean.id;
      } else if (this.faculty) { // إذا لم يكن هناك عميد مرتبط بالكلية
        this.selectedDean = null;
        this.faculty.deanId = null; // تأكيد أن deanId null
        // تهيئة كائن dean لتجنب الأخطاء في القالب إذا لم يتم توفيره من API بشكل صحيح
        // نفترض أن dean سيكون دائمًا كائنًا، حتى لو كان deanId null
        this.faculty.dean = { id: 0, name: '' };
      }
    });
  }

  // يتم استدعاء هذه الدالة عند كل إدخال في حقل اسم العميد
  public onDeanNameInput(event: Event): void {
    if (!this.faculty) { // حماية في حالة أن faculty مازال null (قد يحدث إذا فشل التحميل الأولي)
      this.faculty = {
        id: this.facultyId || 0, // تعيين ID مؤقت أو 0
        name: '',
        description: '',
        deanId: null, // تأكيد أنه null
        dean: { id: 0, name: '' } // تهيئة كائن dean
      };
    }
    const term = (event.target as HTMLInputElement).value;
    this.faculty.dean.name = term; // تحديث ngModel
    this.faculty.deanId = null; // مسح ID عندما يبدأ المستخدم في الكتابة مرة أخرى
    this.selectedDean = null; // مسح العميد المحدد

    if (term.trim().length >= 2) {
      this.deanSearchTerm.next(term.trim()); // إطلاق البحث
    } else {
      this.availableDeans = []; // مسح الاقتراحات إذا كان المصطلح قصيرًا جدًا
      this.showDeanSuggestions = false;
    }
  }

  // يتم استدعاء هذه الدالة عند اختيار عميد من قائمة الاقتراحات
  public selectDean(dean: Dean): void {
    if (!this.faculty) return; // حماية
    this.selectedDean = dean;
    this.faculty.dean.name = dean.name; // تعيين اسم العميد في النموذج
    this.faculty.deanId = dean.id; // تعيين ID العميد في النموذج
    this.availableDeans = []; // مسح قائمة الاقتراحات
    this.showDeanSuggestions = false; // إخفاء القائمة
  }

  // لمعالجة التركيز بعيداً عن حقل الإدخال
  public onDeanInputBlur(): void {
    setTimeout(() => {
      if (this.faculty && (!this.selectedDean || this.selectedDean.name !== this.faculty.dean.name)) {
        // إذا كان الحقل ليس فارغاً ولم يتم اختيار عميد صالح
        if (this.faculty.dean.name.trim().length > 0 && this.faculty.deanId === null) {
          // يمكن هنا إضافة رسالة خطأ إضافية إذا أردت تنبيه المستخدم صراحة
          // this.errorMessage = 'Please select a valid Dean from the list.';
        }
      }
      this.showDeanSuggestions = false; // إخفاء الاقتراحات عند فقدان التركيز
    }, 100);
  }

  saveChanges(): void {
    if (!this.faculty || this.isFormInvalid()) {
      this.errorMessage = 'Please fill all fields with valid data and select a Dean.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.updateFaculty(this.faculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to update faculty.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        setTimeout(() => this.router.navigate(['/FacultyList']), 1500);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/FacultyList']);
  }

  private isFormInvalid(): boolean {
    if (!this.faculty) return true; // إذا كانت الكلية نفسها null
    const model = this.faculty;
    // التحقق من أن جميع الحقول المطلوبة مملوءة بشكل صحيح
    // والتحقق من أن عميدًا قد تم تحديده فعليًا (deanId ليس null ويجب أن يكون أكبر من 0)
    return !model.name || model.name.trim().length < 3 ||
           !model.description || model.description.trim().length < 10 ||
           this.selectedDean === null || model.deanId === null || model.deanId <= 0 ||
           !model.dean?.name || model.dean.name.trim().length < 3; // استخدام ?. للوصول الآمن
  }
}
