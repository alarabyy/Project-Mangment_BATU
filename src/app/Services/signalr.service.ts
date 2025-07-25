// src/app/Services/signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, throwError } from 'rxjs';
import { ChatMessageDto } from '../models/dtos'; // **تم التصحيح هنا: من models/dtos إلى shared/dtos**
import { AuthService } from '../Services/auth.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private receiveMessageSubject = new Subject<ChatMessageDto>();
  private hubUrl = `${environment.apiUrl}/chathub`;

  constructor(private authService: AuthService) { }

  public startConnection(): Promise<void> {
    const token = this.authService.getToken();

    if (!token) {
      console.error('No JWT token found for SignalR connection. Cannot connect.');
      return Promise.reject(new Error('No token provided for SignalR.'));
    }

    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.stopConnection();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
            if (retryContext.elapsedMilliseconds < 60000) {
                return Math.random() * 1000 + 1000;
            }
            return null;
        }
      })
      .build();

    this.hubConnection.on('ReceiveMessage', (message: ChatMessageDto) => {
      this.receiveMessageSubject.next(message);
    });

    this.hubConnection.onclose((error: Error | undefined) => {
      console.error('SignalR connection closed.', error);
    });

    this.hubConnection.onreconnecting((error: Error | undefined) => {
      console.warn('SignalR connection reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId: string | undefined) => {
      console.log('SignalR connection reconnected. New ConnectionId:', connectionId);
    });

    return this.hubConnection.start()
      .then(() => console.log('SignalR connection started!'))
      .catch((err: any) => {
        console.error('Error while starting SignalR connection: ' + err);
        return Promise.reject(new Error('Failed to connect to chat service: ' + (err.message || err)));
      });
  }

  public stopConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      return this.hubConnection.stop()
        .then(() => console.log('SignalR connection stopped.'))
        .catch((err: any) => console.error('Error while stopping SignalR connection:', err));
    }
    return Promise.resolve();
  }

  public joinChat(chatId: number): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinChat', chatId)
        .then(() => console.log(`Joined chat ${chatId}`))
        .catch((err: any) => {
          console.error(`Error joining chat ${chatId}:`, err);
          return Promise.reject(new Error(`Failed to join chat ${chatId}: ${err.message || err}`));
        });
    } else {
      console.warn('SignalR connection not connected. Cannot join chat.');
      return Promise.reject(new Error('SignalR connection not established.'));
    }
  }

  public sendMessage(chatId: number, message: string): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('SendMessage', chatId, message)
        .then(() => { /* Message will be received via 'ReceiveMessage' event, no need to push here */ })
        .catch((err: any) => {
          console.error(`Error sending message to chat ${chatId}:`, err);
          return Promise.reject(new Error(`Failed to send message to chat ${chatId}: ${err.message || err}`));
        });
    } else {
      console.warn('SignalR connection not connected. Cannot send message.');
      return Promise.reject(new Error('SignalR connection not established.'));
    }
  }

  public onReceiveMessage(): Observable<ChatMessageDto> {
    return this.receiveMessageSubject.asObservable();
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
