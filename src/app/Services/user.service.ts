import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, delay, map } from 'rxjs';
import { User } from '../models/user'; // <--- تأكد من تحديث هذا المسار

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'https://batuprojects.runasp.net/api/user';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    // We are using a POST request as per the original code.
    return this.http.post<User[]>(`${this.baseUrl}/list`, {}).pipe(
      delay(1500), // Simulate network delay for loading state
      map(users => this.enrichMockData(users)), // Enrich data with mock properties for demo
      catchError(this.handleError<User[]>('getUsers', []))
    );
  }

  /**
   * This function adds mock data (status, country, createdAt) to the users
   * returned from the API, since the API doesn't provide them.
   * This is for demonstration purposes.
   */
  private enrichMockData(users: User[]): User[] {
    const statuses: ('Active' | 'Inactive' | 'Pending')[] = ['Active', 'Inactive', 'Pending'];
    const countries = ['Egypt', 'USA', 'Germany', 'Canada', 'Saudi Arabia', 'UK'];

    return users.map((user, index) => ({
      ...user,
      // Random date within the last year
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      country: countries[Math.floor(Math.random() * countries.length)]
    }));
  }

  /**
   * Handle Http operation that failed. Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
