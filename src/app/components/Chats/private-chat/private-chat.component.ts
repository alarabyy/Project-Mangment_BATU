import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { PersonalChatApiService } from '../../../Services/personal-chats-api.service';
import { SignalRService } from '../../../Services/signalr.service';
import { AuthService } from '../../../Services/auth.service';
import { ChatDto, ChatMessageDto } from '../../../models/dtos'; // **تم التصحيح هنا: من models/dtos إلى shared/dtos**

interface Message {
  id: number;
  sender: 'me' | 'other';
  content: string;
  time: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  url?: string;
  fileName?: string;
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
  selectedFile: File | null = null;

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

    return {
      id: dto.id,
      sender: isMe ? 'me' : 'other',
      content: dto.message,
      time: timeString,
      type: 'text'
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
    if (this.chatId === null || (!this.newMessage.trim() && !this.selectedFile)) {
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (this.selectedFile) {
        const fileType = this.selectedFile.type.split('/')[0];
        let type: 'text' | 'image' | 'audio' | 'video' | 'file' = 'file';

        let url = '';
        if (fileType === 'image') {
          type = 'image';
        } else if (fileType === 'audio') {
          type = 'audio';
        } else if (fileType === 'video') {
          type = 'video';
        }
        url = URL.createObjectURL(this.selectedFile);

        this.messages.push({
            id: this.messages.length + 1,
            sender: 'me',
            content: (type === 'file' ? `Sent file: ${this.selectedFile.name}` : ''),
            time: currentTime,
            type: type,
            url: url,
            fileName: this.selectedFile.name
        });
        this.selectedFile = null;
    }

    if (this.newMessage.trim()) {
      this.signalRService.sendMessage(this.chatId, this.newMessage.trim())
        .then(() => {
          this.newMessage = '';
        })
        .catch((err: any) => {
          console.error('Failed to send message:', err);
          alert('Failed to send message. Please try again.');
        });
    }

    this.scrollToBottom();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('Selected file:', this.selectedFile.name, this.selectedFile.type);
    } else {
      this.selectedFile = null;
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
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
