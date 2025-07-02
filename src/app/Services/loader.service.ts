// src/app/services/loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  // A BehaviorSubject to track the number of active loading requests.
  private loadingRequests = new BehaviorSubject<number>(0);

  // An Observable that emits true if there is at least one active request.
  // We use `asObservable()` to prevent outside components from changing the value directly.
  public isLoading = this.loadingRequests.asObservable();

  /**
   * Shows the loader by incrementing the active request count.
   * When the count is > 0, the loader is visible.
   */
  show(): void {
    const currentCount = this.loadingRequests.value;
    this.loadingRequests.next(currentCount + 1);
    console.log(`Loader: show() called. Active requests: ${this.loadingRequests.value}`);
  }

  /**
   * Hides the loader by decrementing the active request count.
   * When the count reaches 0, the loader is hidden.
   * We use `Math.max(0, ...)` to prevent the count from going below zero.
   */
  hide(): void {
    const currentCount = this.loadingRequests.value;
    if (currentCount > 0) {
      this.loadingRequests.next(currentCount - 1);
    }
    console.log(`Loader: hide() called. Active requests: ${this.loadingRequests.value}`);
  }
}
