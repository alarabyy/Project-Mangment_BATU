// src/app/pipes/aicher.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'aicher',
  standalone: true // مهم جدًا ليعمل بشكل مستقل
})
export class AicherPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }
    // يستبدل كل سطر جديد بوسم <br>، مما يسمح بعرض الفقرات
    return value.replace(/\n/g, '<br>');
  }

}
