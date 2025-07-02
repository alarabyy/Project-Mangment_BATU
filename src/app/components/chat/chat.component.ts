// src/app/components/chat/chat.component.ts
import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, HostBinding } from '@angular/core';
import { ChatService } from '../../Services/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Represents a single message in the chat, identifying its sender.
 */
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
  // Binds a CSS class to the host element for better styling encapsulation.
  @HostBinding('class.chat-component-host') hostClass = true;

  // A reference to the message container element for auto-scrolling.
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // The list of messages to be displayed in the chat interface.
  messages: Message[] = [];

  // The message text entered by the user in the input field.
  newMessage: string = '';

  // Flag to control the loading state and disable the input/button.
  isLoading: boolean = false;

  /**
   * Constructs the component and injects the ChatService.
   * @param chatService The service responsible for handling chat logic and API calls.
   */
  constructor(private chatService: ChatService) {}

  /**
   * Lifecycle hook that runs after the component is initialized.
   * Adds the initial welcome message from the assistant.
   */
  ngOnInit(): void {
    this.addBotMessage('Welcome to the Project Assistant. How can I help with your tasks today?');
  }

  /**
   * Lifecycle hook that runs after every check of the component's view.
   * Ensures the chat always scrolls to the bottom to show the latest message.
   */
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * Handles sending a message to the bot.
   * - Validates the input.
   * - Adds the user's message to the chat.
   * - Calls the chat service to get a response.
   * - Manages the loading state.
   */
  sendMessage(): void {
    const messageToSend = this.newMessage.trim();
    if (!messageToSend) {
      return; // Do nothing if the message is empty or just whitespace.
    }

    // Add the user's message to the messages array.
    this.addUserMessage(messageToSend);

    // Clear the input field and activate the loading state.
    this.newMessage = '';
    this.isLoading = true;

    // Send the message to the chat service.
    this.chatService.sendMessage(messageToSend).subscribe({
      next: (response) => {
        // Add the bot's response and deactivate the loading state.
        this.addBotMessage(response);
        this.isLoading = false;
      },
      error: (err) => {
        // Handle API errors gracefully.
        console.error('Failed to get response from chat service:', err);
        this.addBotMessage('An error occurred. Please try again later.');
        this.isLoading = false;
      }
    });
  }

  /**
   * Helper function to add a message from the user.
   * @param text The message text.
   */
  private addUserMessage(text: string): void {
    this.messages.push({ text: text, isUser: true });
  }

  /**
   * Helper function to add a message from the bot.
   * @param text The message text.
   */
  private addBotMessage(text: string): void {
    this.messages.push({ text: text, isUser: false });
  }

  /**
   * Scrolls the chat message container to the bottom.
   * This ensures the latest message is always visible.
   */
  private scrollToBottom(): void {
    // A safe way to access the native element and scroll.
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }
}
