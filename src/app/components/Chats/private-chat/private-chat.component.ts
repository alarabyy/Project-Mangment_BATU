import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { PersonalChatApiService } from '../../../Services/personal-chats-api.service';
import { SignalRService } from '../../../Services/signalr.service';
import { AuthService } from '../../../Services/auth.service';
import { ChatDto, ChatMessageDto } from '../../../models/dtos'; // **تم التصحيح هنا: من models/dtos إلى shared/dtos**
import { environment } from '../../../environments/environment';

interface Message {
  id: number;
  sender: 'me' | 'other';
  content: string;      // The text part of the message
  time: string;
  attachments: Attachment[]; // An array of attachments
}
interface Attachment {
  url: string;        // The full URL to the file
  fileName: string;   // The unique filename (e.g., "guid1.pdf")
  type: 'image' | 'pdf';
}

interface ChatContact {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.css']
})
export class PrivateChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageList') private messageListRef!: ElementRef;

  chatId: number | null = null;
  chatDetails: ChatDto | null = null;
  contact: ChatContact | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  isUserOnline: boolean = false;
  selectedFiles: File[] = [];

  private currentUserId: number | null = null;
  private routeSubscription?: Subscription;
  private receiveMessageSubscription?: Subscription;
  private typingTimer?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatApiService: PersonalChatApiService,
    private signalRService: SignalRService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const userIdString = this.authService.getUserId();
    if (userIdString) {
      const parsedId = parseInt(userIdString, 10);
      if (!isNaN(parsedId)) {
        this.currentUserId = parsedId;
      } else {
        console.error('Parsed user ID from token is not a valid number. Redirecting to login.');
        this.router.navigate(['/Login']);
        return;
      }
    } else {
      console.error('User ID not found in token. Redirecting to login.');
      this.router.navigate(['/Login']);
      return;
    }

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chatId = +id;
        this.loadChatData(this.chatId);
        this.setupSignalR();
      } else {
        this.router.navigate(['/chats']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.receiveMessageSubscription?.unsubscribe();
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  private async loadChatData(id: number): Promise<void> {
    try {
      const chatDetailsResponse = await firstValueFrom(this.chatApiService.getChatDetails(id)) as ChatDto;

      if (!chatDetailsResponse || Object.keys(chatDetailsResponse).length === 0) {
        console.error('Chat details not found or user not authorized (response empty/malformed).');
        this.contact = null;
        return;
      }
      this.chatDetails = chatDetailsResponse;

      if (this.chatDetails) {
        this.contact = {
          id: this.chatDetails.id,
          name: this.chatDetails.name,
          avatar: 'https://i.pravatar.cc/150?img=' + (id % 10 + 1),
          isOnline: false,
          lastSeen: 'Unknown'
        };
      }


      const messagesDto = await firstValueFrom(this.chatApiService.getChatMessages(id)) as ChatMessageDto[];
      this.messages = messagesDto.map((dto: ChatMessageDto) => this.mapChatMessageDtoToMessage(dto));

      setTimeout(() => this.scrollToBottom(), 100);

    } catch (error: any) {
      console.error('Error loading chat data:', error);
      this.contact = null;
      if (error.status === 404) {
        alert('Chat not found or you do not have access.');
      } else {
        alert('An error occurred while loading chat data.');
      }
      this.router.navigate(['/chats']);
    }
  }

  private async setupSignalR(): Promise<void> {
    if (this.chatId === null || this.currentUserId === null) return;

    try {
      if (!this.signalRService.isConnected()) {
        await this.signalRService.startConnection();
      }
    } catch (err: any) {
      console.error('Failed to start SignalR connection:', err);
      alert('Failed to connect to real-time chat service.');
      return;
    }

    if (this.signalRService.isConnected()) {
      try {
        await this.signalRService.joinChat(this.chatId);
        this.receiveMessageSubscription = this.signalRService.onReceiveMessage().subscribe({
          next: (messageDto: ChatMessageDto) => {
            if (messageDto.chatId === this.chatId) {
              this.messages.push(this.mapChatMessageDtoToMessage(messageDto));
              this.scrollToBottom();

              if (messageDto.senderId !== this.currentUserId) {
                  this.isTyping = true;
                  if (this.typingTimer) clearTimeout(this.typingTimer);
                  this.typingTimer = setTimeout(() => {
                      this.isTyping = false;
                  }, 1500 + Math.random() * 1000);
              }
            }
          },
          error: (err: any) => console.error('Error receiving message:', err)
        });
      } catch (err: any) {
        console.error(`Failed to join chat ${this.chatId} via SignalR:`, err);
        alert('Failed to join chat for real-time messages. You might need to refresh.');
      }
    }
  }

  private mapChatMessageDtoToMessage(dto: ChatMessageDto): Message {
    const isMe = dto.senderId === this.currentUserId;
    const date = new Date(dto.date);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let attachments: Attachment[] = [];

    // This logic now correctly handles the string array from the backend
    if (dto.attachments && dto.attachments.length > 0) {
      attachments = dto.attachments.map(fileName => {
        const isPdf = fileName.toLowerCase().endsWith('.pdf');
        return {
          url: `${environment.apiUploadUrl}${fileName}`, // Construct the full URL
          fileName: fileName,
          type: isPdf ? 'pdf' : 'image'
        };
      });
    }

    return {
      id: dto.id,
      sender: isMe ? 'me' : 'other',
      content: dto.message,
      time: timeString,
      attachments: attachments // Assign the newly created array
    };
  }

  toggleContactOnlineStatus(): void {
    if (this.contact) {
      this.contact.isOnline = !this.contact.isOnline;
      this.isUserOnline = this.contact.isOnline;
      this.contact.lastSeen = this.contact.isOnline ? 'Online' : `Last seen ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      console.log(`Contact ${this.contact.name} is now ${this.contact.isOnline ? 'online' : 'offline'}.`);
    }
  }

  sendMessage(): void {
    if (this.chatId === null) return;
  
    const messageText = this.newMessage.trim();
    const hasText = messageText.length > 0;
    const hasFiles = this.selectedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return; // Nothing to send
    }

    // --- CASE 1: Message HAS attachments (always use HTTP POST) ---
    if (hasFiles) {
      const formData = new FormData();
      formData.append('chatId', this.chatId.toString());

      if (hasText) {
        formData.append('message', messageText);
      }

      // Append all selected files to the form data with the same key
      for (const file of this.selectedFiles) {
        formData.append('attachments', file, file.name);
      }

      // This method needs to be added to your PersonalChatApiService.
      // It will make a POST request to your backend endpoint for messages.
      firstValueFrom(this.chatApiService.sendMessageWithAttachments(formData))
        .then(() => {
          // Success! The UI will update via the SignalR broadcast from the server.
          // DO NOT manually add the message to the UI here.
        })
        .catch(err => {
          console.error('Failed to send message with attachments:', err);
          alert('Could not upload files. Please try again.');
        });

    // --- CASE 2: Message ONLY has text (use fast SignalR method) ---
    } else if (hasText) {
      this.signalRService.sendMessage(this.chatId, messageText)
        .catch(err => {
          console.error('Failed to send text message:', err);
          alert('Failed to send message.');
        });
    }

    // --- Reset inputs after initiating the send ---
    this.newMessage = '';
    this.selectedFiles = [];
    this.clearSelectedFile(); // Use your existing method to clear the file input UI

    this.scrollToBottom();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files); // Convert FileList to array
      console.log(`Selected ${this.selectedFiles.length} files.`);
    } else {
      this.selectedFiles = [];
    }
  }

  clearSelectedFile(): void {
    this.selectedFiles = [];
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.messageListRef) {
            this.messageListRef.nativeElement.scrollTop = this.messageListRef.nativeElement.scrollHeight;
        }
      } catch (err) { /* Handle error */ }
    }, 0);
  }

  goBack(): void {
    this.router.navigate(['/chats']);
  }
}
