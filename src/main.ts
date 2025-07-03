import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


  // main.ts
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.opacity = '0';

  setTimeout(() => {
    if (splash) splash.style.display = 'none';
  }, 1000); // وقت الانتقال بعد الإخفاء
}, 5000); // وقت الظهور = 5 ثواني
