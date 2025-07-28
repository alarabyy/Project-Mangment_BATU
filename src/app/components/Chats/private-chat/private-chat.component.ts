import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { PersonalChatApiService } from '../../../Services/personal-chats-api.service';
import { SignalRService } from '../../../Services/signalr.service';
import { AuthService } from '../../../Services/auth.service';
import { ChatDto, ChatMessageDto, UserMinimalDto } from '../../../models/dtos';
import { environment } from '../../../environments/environment';

interface Message {
  id: number;
  sender: 'me' | 'other';
  senderName?: string;
  content: string;
  time: string;
  attachments?: Attachment[];
}

interface Attachment {
  url: string;
  fileName: string;
  type: 'image' | 'pdf';
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
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  isUserOnline: boolean = false;
  showParticipantsOverlay: boolean = false;
  selectedFiles: File[] = [];

  currentUserId: number | null = null;
  private routeSubscription?: Subscription;
  private receiveMessageSubscription?: Subscription;
  private chatDeletedSubscription?: Subscription;
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
    setTimeout(() => this.scrollToBottom(), 100);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.receiveMessageSubscription?.unsubscribe();
    this.chatDeletedSubscription?.unsubscribe();
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  private async loadChatData(id: number): Promise<void> {
    try {
      const chatDetailsResponse = await firstValueFrom(this.chatApiService.getChatDetails(id));

      if (!chatDetailsResponse || Object.keys(chatDetailsResponse).length === 0) {
        console.error('Chat details not found or user not authorized (response empty/malformed).');
        this.chatDetails = null;
        Swal.fire('Error', 'Chat not found or you do not have access.', 'error');
        this.router.navigate(['/chats']);
        return;
      }
      this.chatDetails = chatDetailsResponse;

      this.isUserOnline = false;

      const messagesDto = await firstValueFrom(this.chatApiService.getChatMessages(id));
      this.messages = messagesDto.map((dto: ChatMessageDto) => this.mapChatMessageDtoToMessage(dto));

      setTimeout(() => this.scrollToBottom(), 100);

    } catch (error: any) {
      console.error('Error loading chat data:', error);
      this.chatDetails = null;
      let errorMessage = 'An error occurred while loading chat data.';
      if (error && error.message) {
        errorMessage = error.message;
      }
      Swal.fire('Error', errorMessage, 'error');
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
      Swal.fire('Error', 'Failed to connect to real-time chat service.', 'error');
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

        this.chatDeletedSubscription = this.signalRService.onChatDeleted().subscribe((deletedChatId: number) => {
            if (deletedChatId === this.chatId) {
                Swal.fire({
                  title: 'Chat Deleted',
                  text: 'This chat has been deleted by its owner and is no longer available.',
                  icon: 'info',
                  confirmButtonText: 'OK'
                }).then(() => {
                  this.router.navigate(['/chats']);
                });
            }
        });

      } catch (err: any) {
        console.error(`Failed to join chat ${this.chatId} via SignalR:`, err);
        Swal.fire('Error', 'Failed to join chat for real-time messages. You might need to refresh.', 'error');
      }
    }
  }

  private mapChatMessageDtoToMessage(dto: ChatMessageDto): Message {
    const isMe = dto.senderId === this.currentUserId;
    const date = new Date(dto.date);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let senderName: string = '';
    if (this.chatDetails && this.chatDetails.members) {
      const senderMember = this.chatDetails.members.find((m: UserMinimalDto) => m.id === dto.senderId);
      senderName = senderMember ? senderMember.name : 'Unknown User';
    }

    let attachments: Attachment[] = [];
    if (dto.attachments && dto.attachments.length > 0) {
      attachments = dto.attachments.map(fileName => {
        const isPdf = fileName.toLowerCase().endsWith('.pdf');
        const attachmentUrl = `${environment.apiUploadUrl}${fileName}`;
        return {
          url: attachmentUrl,
          fileName: fileName,
          type: isPdf ? 'pdf' : 'image'
        };
      });
    }

    return {
      id: dto.id,
      sender: isMe ? 'me' : 'other',
      senderName: senderName,
      content: dto.message,
      time: timeString,
      attachments: attachments
    };
  }

  // New getter to format member names for display
  get displayMemberNames(): string {
    if (!this.chatDetails?.members || this.chatDetails.members.length === 0) {
      return 'No participants';
    }
    const memberNames = this.chatDetails.members.slice(0, 3).map(m => m.name);
    if (this.chatDetails.members.length > 3) {
      return memberNames.join(', ') + '...';
    }
    return memberNames.join(', ');
  }

  toggleContactOnlineStatus(): void {
    this.isUserOnline = !this.isUserOnline;
    console.log(`User online status toggled to ${this.isUserOnline ? 'online' : 'offline'}.`);
  }

  toggleParticipantsOverlay(): void {
    this.showParticipantsOverlay = !this.showParticipantsOverlay;
  }

  sendMessage(): void {
    if (this.chatId === null) return;

    const messageText = this.newMessage.trim();
    const hasText = messageText.length > 0;
    const hasFiles = this.selectedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    if (hasFiles) {
      const formData = new FormData();
      formData.append('chatId', this.chatId.toString());
      formData.append('senderId', this.currentUserId!.toString());

      if (hasText) {
        formData.append('message', messageText);
      }

      this.selectedFiles.forEach((file, index) => {
        formData.append(`attachments`, file, file.name);
      });

      firstValueFrom(this.chatApiService.sendMessageWithAttachments(formData))
        .then(() => {
          this.newMessage = '';
          this.selectedFiles = [];
          this.clearSelectedFile();
          this.scrollToBottom();
        })
        .catch(err => {
          console.error('Failed to send message with attachments:', err);
          Swal.fire('Error', 'Could not upload files. Please try again.', 'error');
        });

    } else if (hasText) {
      this.signalRService.sendMessage(this.chatId, messageText)
        .then(() => {
          this.newMessage = '';
          this.scrollToBottom();
        })
        .catch(err => {
          console.error('Failed to send text message:', err);
          Swal.fire('Error', 'Failed to send message. Please try again.', 'error');
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
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
    requestAnimationFrame(() => {
      try {
        if (this.messageListRef && this.messageListRef.nativeElement) {
            this.messageListRef.nativeElement.scrollTop = this.messageListRef.nativeElement.scrollHeight;
        }
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/chats']);
  }

  async onDeleteChat(): Promise<void> {
      if (!this.chatId) return;

      const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'Do you want to permanently delete this chat? This action cannot be undone and will affect all participants.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
          try {
              await firstValueFrom(this.chatApiService.deleteChat(this.chatId));
              console.log(`Chat ${this.chatId} delete request sent successfully.`);
          } catch (error: any) {
              console.error('Failed to delete chat:', error);
              let errorMessage = 'An error occurred while trying to delete the chat.';
              if (error && error.message) {
                  errorMessage = error.message;
              }
              Swal.fire('Error!', errorMessage, 'error');
          }
      }
  }
}
