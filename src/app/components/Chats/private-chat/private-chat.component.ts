import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';


interface Message {
  id: number;
  sender: 'me' | 'other';
  content: string;
  time: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file'; // New: Message type
  url?: string; // For image, audio, video messages
  fileName?: string; // For file messages (e.g., PDF, DOCX)
}

interface ChatContact {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean; // Online status
  lastSeen?: string; // Last seen status
}

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.css'] // Corrected to styleUrls
})
export class PrivateChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageList') private messageListRef!: ElementRef;

  chatId: number | null = null;
  contact: ChatContact | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  isTyping: boolean = false; // Typing indicator
  isUserOnline: boolean = false; // User online status (for the contact)
  selectedFile: File | null = null; // For file attachment

  private routeSubscription?: Subscription;
  private typingTimer?: any;
  private onlineStatusChecker?: Subscription;

  private dummyContacts: ChatContact[] = [
    { id: 1, name: 'Alice Smith', avatar: 'https://i.pravatar.cc/150?img=1', isOnline: true, lastSeen: 'Online' },
    { id: 2, name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=2', isOnline: false, lastSeen: 'Last seen today at 3:45 PM' },
    { id: 3, name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?img=3', isOnline: true, lastSeen: 'Online' },
    { id: 4, name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?img=4', isOnline: false, lastSeen: 'Last seen yesterday' },
    { id: 5, name: 'Eve Adams', avatar: 'https://i.pravatar.cc/150?img=5', isOnline: true, lastSeen: 'Online' },
    { id: 6, name: 'Frank White', avatar: 'https://i.pravatar.cc/150?img=6', isOnline: false, lastSeen: 'Last seen 2 days ago' },
    { id: 7, name: 'Grace Lee', avatar: 'https://i.pravatar.cc/150?img=7', isOnline: true, lastSeen: 'Online' },
    { id: 8, name: 'Harry Potter', avatar: 'https://i.pravatar.cc/150?img=8', isOnline: false, lastSeen: 'Last seen on Mon' },
    { id: 9, name: 'Ivy Green', avatar: 'https://i.pravatar.cc/150?img=9', isOnline: true, lastSeen: 'Online' },
    { id: 10, name: 'Jack Black', avatar: 'https://i.pravatar.cc/150?img=10', isOnline: false, lastSeen: 'Last seen 1/1/2025' },
  ];

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chatId = +id;
        this.loadChatData(this.chatId);
      } else {
        this.router.navigate(['/chats']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom(); // Scroll to bottom on initial load
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.onlineStatusChecker?.unsubscribe();
  }

  loadChatData(id: number): void {
    this.contact = this.dummyContacts.find(c => c.id === id) || null;

    if (this.contact) {
      this.messages = [
        { id: 1, sender: 'other', content: `Hello ${this.contact.name}, how are you today?`, time: '10:00 AM', type: 'text' },
        { id: 2, sender: 'me', content: 'I\'m doing great, thank you! How about you?', time: '10:01 AM', type: 'text' },
        { id: 3, sender: 'other', content: 'I\'m good too. Just finished up some work.', time: '10:03 AM', type: 'text' },
        { id: 4, sender: 'me', content: 'Sounds busy! What are your plans for the weekend?', time: '10:05 AM', type: 'text' },
        { id: 5, sender: 'other', content: 'Thinking of going for a hike if the weather permits. You?', time: '10:07 AM', type: 'text' },
        { id: 6, sender: 'me', content: 'Maybe I\'ll just relax and read some books.', time: '10:08 AM', type: 'text' },
        { id: 7, sender: 'other', content: 'That sounds nice and relaxing!', time: '10:09 AM', type: 'text' },
        { id: 8, sender: 'other', content: '', time: '10:10 AM', type: 'image', url: 'https://picsum.photos/id/237/200/200' }, // Image message
        { id: 9, sender: 'me', content: 'Cool picture! Where did you take it?', time: '10:11 AM', type: 'text' },
        { id: 10, sender: 'me', content: 'By the way, did you get my email about the project?', time: '10:15 AM', type: 'text' },
        { id: 11, sender: 'other', content: 'Ah, yes! I just saw it. I\'ll get back to you soon.', time: '10:16 AM', type: 'text' },
        { id: 12, sender: 'me', content: 'Great, no rush!', time: '10:17 AM', type: 'text' },
        { id: 13, sender: 'other', content: 'Here\'s a sample audio file.', time: '10:20 AM', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', fileName: 'SoundHelix-Song-1.mp3' },
        { id: 14, sender: 'me', content: 'Nice, checking it out.', time: '10:21 AM', type: 'text' },
        { id: 15, sender: 'other', content: 'And a quick video.', time: '10:25 AM', type: 'video', url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', fileName: 'sample-mp4-file.mp4' },
      ];

      this.isUserOnline = this.contact.isOnline; // Set initial online status
      this.startOnlineStatusChecker(); // Start checking online status periodically
      setTimeout(() => this.scrollToBottom(), 100); // Ensure scroll after messages load
    } else {
      this.messages = [];
    }
  }

  // New: Toggle the contact's online status manually for testing
  toggleContactOnlineStatus(): void {
    if (this.contact) {
      this.contact.isOnline = !this.contact.isOnline;
      this.isUserOnline = this.contact.isOnline;
      this.contact.lastSeen = this.contact.isOnline ? 'Online' : `Last seen ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      console.log(`Contact ${this.contact.name} is now ${this.contact.isOnline ? 'online' : 'offline'}.`);
    }
  }

  startOnlineStatusChecker(): void {
    if (this.onlineStatusChecker) {
      this.onlineStatusChecker.unsubscribe(); // Clear previous interval
    }
    // Simulate online/offline status change every 5-10 seconds
    this.onlineStatusChecker = interval(Math.random() * 5000 + 5000).pipe(
      takeWhile(() => !!this.contact) // Keep alive as long as contact exists
    ).subscribe(() => {
      // Commenting out automated toggle to allow manual control for testing
      // if (this.contact) {
      //   this.contact.isOnline = !this.contact.isOnline; // Toggle status
      //   this.isUserOnline = this.contact.isOnline;
      //   this.contact.lastSeen = this.contact.isOnline ? 'Online' : `Last seen ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      // }
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (this.selectedFile) {
        const fileType = this.selectedFile.type.split('/')[0]; // image, audio, video
        let type: 'text' | 'image' | 'audio' | 'video' | 'file' = 'file'; // Default to generic file

        let url = '';
        if (fileType === 'image') {
          type = 'image';
        } else if (fileType === 'audio') {
          type = 'audio';
        } else if (fileType === 'video') {
          type = 'video';
        }
        // For actual files (like PDF, DOCX), type will remain 'file'
        // For media, createObjectURL to display locally
        url = URL.createObjectURL(this.selectedFile);

        this.messages.push({
            id: this.messages.length + 1,
            sender: 'me',
            content: (type === 'file' ? `Sent file: ${this.selectedFile.name}` : ''), // Only text for generic files
            time: currentTime,
            type: type,
            url: url,
            fileName: this.selectedFile.name
        });

        this.selectedFile = null; // Clear selected file
      }

      if (this.newMessage.trim()) {
        this.messages.push({
          id: this.messages.length + 1,
          sender: 'me',
          content: this.newMessage.trim(),
          time: currentTime,
          type: 'text'
        });
        this.newMessage = ''; // Clear input field
      }

      this.scrollToBottom();

      // Simulate a reply from the other user after a short delay
      this.isTyping = true;
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.isTyping = false;
        const replyContent = this.getSimulatedReply();
        this.messages.push({
          id: this.messages.length + 1,
          sender: 'other',
          content: replyContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        });
        this.scrollToBottom();
      }, 1500 + Math.random() * 1000); // Random delay for typing simulation
    }
  }

  getSimulatedReply(): string {
    const replies = [
      'Okay, understood. Thank you.',
      'That\'s interesting!',
      'I\'ll get back to you soon.',
      'How can I help you?',
      'I completely agree.',
      'Is there anything else?',
      'Thanks for the info.',
      'I need some time to think about this.',
      'Alright, see you soon then.',
      'I understand that.'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
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
    // Reset file input value if needed (optional)
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  scrollToBottom(): void {
    // Small delay to ensure DOM updates before scrolling
    setTimeout(() => {
      try {
        this.messageListRef.nativeElement.scrollTop = this.messageListRef.nativeElement.scrollHeight;
      } catch (err) { /* Handle error */ }
    }, 0);
  }

  goBack(): void {
    this.router.navigate(['/chats']);
  }
}
