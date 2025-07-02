// src/app/components/chat/chat.component.ts
import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, HostBinding } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../Services/chat.service';

interface Message {
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @HostBinding('class.chat-component-host') hostClass = true;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.addBotMessage('Welcome to the Project Assistant. How can I help with your tasks today?');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const messageToSend = this.newMessage.trim();
    if (!messageToSend || this.isLoading) {
      return;
    }

    this.addUserMessage(messageToSend);
    this.newMessage = '';
    this.isLoading = true;

    // الآن سيستقبل الـ next() الرسالة الناجحة أو رسالة الخطأ من الخدمة
    this.chatService.sendMessage(messageToSend).subscribe({
      next: (response) => {
        this.addBotMessage(response);
        this.isLoading = false;
      },
      // هذا الجزء لن يتم استدعاؤه غالبًا لأننا نستخدم catchError في الخدمة، ولكنه جيد كإجراء احترازي
      error: (err) => {
        console.error('An unexpected error propagated to the component:', err);
        this.addBotMessage('A critical system error occurred. Please check the console.');
        this.isLoading = false;
      }
    });
  }

  private addUserMessage(text: string): void {
    this.messages.push({ text: text, isUser: true });
  }

  private addBotMessage(text: string): void {
    this.messages.push({ text: text, isUser: false });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}
