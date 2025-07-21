import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string; // URL to avatar image
  unreadCount?: number; // Optional unread message count
  isPinned?: boolean; // To simulate pinned chats
}

@Component({
  selector: 'app-all-chats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-chats.component.html',
  styleUrls: ['./all-chats.component.css'] // Corrected to styleUrls
})
export class AllChatsComponent implements OnInit {
  searchTerm: string = '';
  chats: Chat[] = [];
  filteredChats: Chat[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Simulate fetching chat data with some pinned chats
    this.chats = [
      { id: 1, name: 'Alice Smith', lastMessage: 'Okay, see you tomorrow at 10 AM.', time: '10:30 AM', avatar: 'https://i.pravatar.cc/150?img=1', unreadCount: 2, isPinned: true },
      { id: 6, name: 'Frank White', lastMessage: 'Can you call me? Urgent matter.', time: '8:45 AM', avatar: 'https://i.pravatar.cc/150?img=6', isPinned: true },
      { id: 3, name: 'Charlie Brown', lastMessage: 'See you next week!', time: 'Mon', avatar: 'https://i.pravatar.cc/150?img=3', unreadCount: 1 },
      { id: 2, name: 'Bob Johnson', lastMessage: 'I sent you the files you requested.', time: 'Yesterday', avatar: 'https://i.pravatar.cc/150?img=2' },
      { id: 4, name: 'Diana Prince', lastMessage: 'Confirmed. Thank you very much!', time: 'Sun', avatar: 'https://i.pravatar.cc/150?img=4' },
      { id: 5, name: 'Eve Adams', lastMessage: 'We need to meet soon.', time: '2/15/2025', avatar: 'https://i.pravatar.cc/150?img=5' },
      { id: 7, name: 'Grace Lee', lastMessage: 'Project updates are ready.', time: 'Yesterday', avatar: 'https://i.pravatar.cc/150?img=7' },
      { id: 8, name: 'Harry Potter', lastMessage: 'Magic is real, my friend!', time: 'Thur', avatar: 'https://i.pravatar.cc/150?img=8' },
      { id: 9, name: 'Ivy Green', lastMessage: 'Meeting has been rescheduled.', time: 'Wed', avatar: 'https://i.pravatar.cc/150?img=9' },
      { id: 10, name: 'Jack Black', lastMessage: 'Got it!', time: '11:00 AM', avatar: 'https://i.pravatar.cc/150?img=10' },
    ];
    this.sortAndFilterChats(); // Initialize filtered and sorted chats
  }

  filterChats(): void {
    this.sortAndFilterChats();
  }

  // Method to sort chats: pinned first, then by name
  sortAndFilterChats(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredChats = this.chats
      .filter(chat => chat.name.toLowerCase().includes(term))
      .sort((a, b) => {
        // Pinned chats come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
  }

  goToChat(chatId: number): void {
    this.router.navigate(['/chat', chatId]);
  }

  // New: Toggle pin status for a chat
  togglePin(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    chat.isPinned = !chat.isPinned;
    this.sortAndFilterChats(); // Re-sort the list
    console.log(`Chat ${chat.name} ${chat.isPinned ? 'pinned' : 'unpinned'}.`);
  }

  // New: Mark chat as read
  markAsRead(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    chat.unreadCount = 0;
    console.log(`Chat ${chat.name} marked as read.`);
  }

  // New: Delete chat
  deleteChat(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    this.chats = this.chats.filter(c => c.id !== chat.id);
    this.sortAndFilterChats(); // Update the filtered list
    console.log(`Chat ${chat.name} deleted.`);
    // In a real application, you'd send this to a backend service
  }
}
