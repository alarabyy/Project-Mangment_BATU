import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacultyCreatePayload } from '../../../models/faculty'; // تأكد من المسار الصحيح
import { FacultyService } from '../../../Services/faculty.service'; // تأكد من المسار الصحيح
import { catchError, finalize, of, debounceTime, distinctUntilChanged, switchMap, filter, Subscription, BehaviorSubject } from 'rxjs';
import { Dean, UserService } from '../../../Services/user.service';

@Component({
  selector: 'app-add-faculty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-faculty.component.html',
  styleUrls: ['./add-faculty.component.css']
})
export class AddFacultyComponent implements OnInit, OnDestroy {
  newFaculty: FacultyCreatePayload = {
    name: '',
    description: '',
    deanId: null, // سيتغير هذا بناءً على اختيار العميد
    deanName: '' // سيحتفظ باسم العميد المختار
  };
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  // خصائص جديدة للبحث عن العميد
  availableDeans: Dean[] = []; // قائمة العمداء المحتملين من API
  deanSearchTerm = new BehaviorSubject<string>(''); // لإدارة مصطلح البحث مع debounce
  private searchSubscription: Subscription | undefined;
  showDeanSuggestions = false; // للتحكم في عرض قائمة الاقتراحات
  selectedDean: Dean | null = null; // للاحتفاظ بالعميد المحدد

  constructor(
    private facultyService: FacultyService,
    private userService: UserService, // حقن خدمة المستخدم
    private router: Router
  ) {}

  ngOnInit(): void {
    // الاشتراك في BehaviorSubject لبدء البحث بعد تأخير
    this.searchSubscription = this.deanSearchTerm.pipe(
      debounceTime(300), // انتظر 300 مللي ثانية بعد آخر ضغطة مفتاح
      distinctUntilChanged(), // لا تبحث إذا كان المصطلح هو نفسه
      filter(term => term.trim().length >= 2), // ابحث فقط إذا كان هناك حرفان على الأقل
      switchMap(term => this.userService.searchUsers(term).pipe(
        catchError(err => {
          console.error('Error searching for deans:', err);
          this.availableDeans = []; // مسح القائمة في حالة الخطأ
          this.showDeanSuggestions = false;
          return of([]); // إرجاع مصفوفة فارغة لتجنب كسر السلسلة
        })
      ))
    ).subscribe(deans => {
      this.availableDeans = deans;
      this.showDeanSuggestions = deans.length > 0; // عرض الاقتراحات فقط إذا كانت هناك نتائج
    });
  }

  ngOnDestroy(): void {
    // إلغاء الاشتراك لمنع تسرب الذاكرة
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // يتم استدعاء هذه الدالة عند كل إدخال في حقل اسم العميد
  public onDeanNameInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.newFaculty.deanName = term; // تحديث ngModel
    this.newFaculty.deanId = null; // مسح ID عندما يبدأ المستخدم في الكتابة مرة أخرى
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
    this.selectedDean = dean;
    this.newFaculty.deanName = dean.name; // تعيين اسم العميد في النموذج
    this.newFaculty.deanId = dean.id; // تعيين ID العميد في النموذج
    this.availableDeans = []; // مسح قائمة الاقتراحات
    this.showDeanSuggestions = false; // إخفاء القائمة
  }

  // لمعالجة التركيز بعيداً عن حقل الإدخال
  public onDeanInputBlur(): void {
    // تأخير بسيط للسماح بحدث النقر على الاقتراحات
    setTimeout(() => {
      // إذا لم يتم تحديد عميد أو كان الاسم المكتوب لا يتطابق مع المحدد، فاعتبره غير صالح
      if (!this.selectedDean || this.selectedDean.name !== this.newFaculty.deanName) {
         // إذا كان الحقل ليس فارغاً ولم يتم اختيار عميد صالح
        if (this.newFaculty.deanName.trim().length > 0 && this.newFaculty.deanId === null) {
          // يمكن هنا إضافة رسالة خطأ إضافية أو مسح الحقل
          // على سبيل المثال: this.errorMessage = 'Please select a valid Dean from the list.';
        }
      }
      this.showDeanSuggestions = false; // إخفاء الاقتراحات عند فقدان التركيز
    }, 100);
  }

  public createFaculty(): void {
    if (this.isFormInvalid()) {
      // رسالة الخطأ يتم عرضها الآن من خلال التحقق الفوري في النموذج
      // يمكنك ترك هذا التحقق كحماية إضافية
      this.errorMessage = 'Please fill in all required fields and select a valid Dean.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.createFaculty(this.newFaculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        const msg = err.message as string;
        this.errorMessage = msg.includes('Details: ')
          ? msg.split('Details: ')[1]
          : msg;
      
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        setTimeout(() => this.router.navigate(['/FacultyList']), 1500);
      }
    });
  }

  public cancel(): void {
    this.router.navigate(['/FacultyList']);
  }

  // تحديث دالة التحقق من صحة النموذج
  private isFormInvalid(): boolean {
    const model = this.newFaculty;
    // التحقق من أن جميع الحقول المطلوبة مملوءة بشكل صحيح
    // والتحقق من أن عميدًا قد تم تحديده فعليًا (deanId ليس null ويجب أن يكون أكبر من 0)
    return !model.name || model.name.trim().length < 3 ||
           !model.description || model.description.trim().length < 10 ||
           this.selectedDean === null || model.deanId === null || model.deanId <= 0 ||
           !model.deanName || model.deanName.trim().length < 3; // هذا للتأكد من أن حقل الإدخال ليس فارغًا
  }
}
