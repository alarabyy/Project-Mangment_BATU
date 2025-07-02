// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Service for communicating with the Gemini AI model.
 * It encapsulates the API logic, making it reusable and testable.
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // ✅ IMPORTANT: The API key should ideally be loaded from an environment file
  // and NOT hardcoded in a public file for security reasons.
  private apiKey = 'AIzaSyA1upobkEJbJLnTMss9jWft3QJI2E78USs';

  // ✅ The API endpoint for the Gemini 2.0 Flash model.
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

  /**
   * Constructs the service and injects the HttpClient.
   * @param http The HttpClient for making API requests.
   */
  constructor(private http: HttpClient) {}

  /**
   * Sends a user's prompt to the Gemini model and returns the AI's response.
   * This method uses a professional RxJS pipeline for handling data and errors.
   * @param prompt The text query from the user.
   * @returns An Observable that emits the AI's response as a string.
   */
  sendMessage(prompt: string): Observable<string> {
    // Define the HTTP headers.
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Construct the request body according to the Gemini API documentation.
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    // Make the POST request and process the response using RxJS operators.
    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      // Extract the message text from the deeply nested API response object.
      map(response => {
        return response?.candidates?.[0]?.content?.parts?.[0]?.text
          || 'I am sorry, I could not generate a response. Please try asking in a different way.';
      }),
      // Handle any API errors gracefully without crashing the application.
      catchError(error => {
        console.error('❌ API Error:', error);
        // Return a user-friendly error message.
        return of('Sorry, I encountered an issue. Please ensure the API key is valid and your network is stable.');
      })
    );
  }
}
