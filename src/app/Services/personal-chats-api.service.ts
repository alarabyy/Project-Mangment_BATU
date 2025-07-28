// src/app/Services/personal-chats-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ChatMinimalDto,
  ChatDto,
  ChatMessageDto,
  ChatCreateRequest,
} from '../models/dtos'; // **تم التصحيح**
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PersonalChatApiService {
  private baseUrl = `${environment.apiUrl}/api/chat`; // هذا المسار صحيح الآن

  constructor(private http: HttpClient) {}

  createChat(request: ChatCreateRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/create`, request, { responseType: 'text' }).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  getMyChats(): Observable<ChatMinimalDto[]> {
    return this.http.get<ChatMinimalDto[]>(`${this.baseUrl}/list`).pipe(
      catchError(this.handleError)
    );
  }

  getChatDetails(chatId: number): Observable<ChatDto> {
    return this.http.get<ChatDto>(`${this.baseUrl}/${chatId}`).pipe(
      catchError(this.handleError)
    );
  }

  getChatMessages(
    chatId: number,
    page: number = 1,
    pageSize: number = 20
  ): Observable<ChatMessageDto[]> {
    let params = new HttpParams();
    params = params.append('page', page.toString());
    params = params.append('pageSize', pageSize.toString());
    return this.http.get<ChatMessageDto[]>(
      `${this.baseUrl}/${chatId}/messages`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  sendMessageWithAttachments(formData: FormData): Observable<ChatMessageDto> {
    // Make the POST request. The browser will automatically set the
    // 'Content-Type' to 'multipart/form-data' with the correct boundary.
    // Do not set it manually.
    return this.http.post<ChatMessageDto>(`${this.baseUrl}/create/message`, formData).pipe(
      catchError(this.handleError) // Reuse your excellent error handler
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`[PersonalChatApiService] Backend returned code ${error.status}, body was: `, error.error);
    let errorMessage = 'An unknown error occurred while communicating with chat service!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side network error occurred: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string') {
        errorMessage = `Error: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
