// src/app/components/Chats/all-chats/all-chats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { PersonalChatApiService } from '../../../Services/personal-chats-api.service';
import { AuthService } from '../../../Services/auth.service';
import { UserService, Dean } from '../../../Services/user.service';
import { ChatCreateRequest, ChatMinimalDto } from '../../../models/dtos';

import Swal from 'sweetalert2'; // **لا تغيير هنا بعد التثبيت**

interface Chat {
  id: number;
  name: string;
  lastMessage?: string;
  time?: string;
  avatar?: string;
  unreadCount?: number;
  isPinned?: boolean;
}

@Component({
  selector: 'app-all-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './all-chats.component.html',
  styleUrls: ['./all-chats.component.css']
})
export class AllChatsComponent implements OnInit {
  chatSearchTerm: string = '';
  chats: Chat[] = [];
  filteredChats: Chat[] = [];

  userSearchTerm: string = '';
  searchResults: Dean[] = [];
  selectedUsers: Dean[] = [];

  showUserSearch: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private chatApiService: PersonalChatApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/Login']);
      return;
    }
    this.loadMyChats();
  }

  loadMyChats(): void {
    this.chatApiService.getMyChats().subscribe({
      next: (data: ChatMinimalDto[]) => {
        this.chats = data.map(chat => ({
          id: chat.id,
          name: chat.name,
          avatar: 'https://i.pravatar.cc/150?img=' + (chat.id % 10 + 1),
          lastMessage: 'No recent messages',
          time: '',
          unreadCount: 0,
          isPinned: false,
        }));
        this.filterChats();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching my chats:', err);
        alert('Failed to load chats. Please try again later.');
      }
    });
  }

  toggleUserSearchMode(): void {
    this.showUserSearch = !this.showUserSearch;
    this.chatSearchTerm = '';
    this.userSearchTerm = '';
    this.searchResults = [];
    this.selectedUsers = [];
    this.filterChats();
  }

  filterChats(): void {
    const term = this.chatSearchTerm.toLowerCase();
    this.filteredChats = this.chats
      .filter(chat => chat.name.toLowerCase().includes(term))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  searchUsers(): void {
    const term = this.userSearchTerm.trim();
    if (term) {
      this.userService.searchUsers(term).subscribe({
        next: (users: Dean[]) => {
          this.searchResults = users;
          console.log('User search results:', this.searchResults);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error searching users:', err);
          this.searchResults = [];
        }
      });
    } else {
      this.searchResults = [];
    }
  }

  goToChat(chatId: number): void {
    this.router.navigate(['/chat', chatId]);
  }

  togglePin(chat: Chat, event: MouseEvent): void {
    event.stopPropagation();
    chat.isPinned = !chat.isPinned;
    this.filterChats();
    console.log(`Chat ${chat.name} ${chat.isPinned ? 'pinned' : 'unpinned'} (UI only).`);
  }

  markAsRead(chat: Chat, event: MouseEvent): void {
    event.stopPropagation();
    chat.unreadCount = 0;
    console.log(`Chat ${chat.name} marked as read (UI only).`);
  }

  deleteChat(chat: Chat, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete chat with ${chat.name}?`)) {
      this.chats = this.chats.filter(c => c.id !== chat.id);
      this.filterChats();
      console.log(`Chat ${chat.name} deleted client-side only.`);
    }
  }

  toggleUserSelection(user: Dean): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
    console.log('Currently selected users for new chat:', this.selectedUsers);
  }

  isUserSelected(user: Dean): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  async createChatWithSelectedUsers(): Promise<void> {
    const currentUserIdString = this.authService.getUserId();
    if (!currentUserIdString) {
      alert('You must be logged in to create a chat.');
      this.router.navigate(['/Login']);
      return;
    }

    const currentUserId = parseInt(currentUserIdString, 10);
    if (isNaN(currentUserId)) {
        alert('Invalid user ID. Please log in again.');
        this.router.navigate(['/Login']);
        return;
    }

    if (this.selectedUsers.length === 0) {
      alert('Please select at least one user to create a chat.');
      return;
    }

    // **التعديل هنا: تحديد نوع `value`**
    const { value: chatName } = await Swal.fire({
      title: 'Enter Chat Name',
      input: 'text',
      inputLabel: 'Name of your new chat group',
      inputValue: '',
      showCancelButton: true,
      inputValidator: (value: string) => { // **تم التصحيح: (value: string)**
        if (!value) {
          return 'You need to enter a chat name!';
        }
        return null;
      }
    });

    if (!chatName) {
      return;
    }

    let memberIds = this.selectedUsers.map(u => u.id);
    if (!memberIds.includes(currentUserId)) {
        memberIds.push(currentUserId);
    }

    const request: ChatCreateRequest = {
      name: chatName,
      memberIds: memberIds
    };

    this.chatApiService.createChat(request).subscribe({
      next: (errorMessage: string) => {
        if (!errorMessage) {
          console.log(`New chat created with: ${this.selectedUsers.map(u => u.name).join(', ')}`);
          Swal.fire('Success!', `New chat "${chatName}" created successfully!`, 'success');
          this.selectedUsers = [];
          this.userSearchTerm = '';
          this.searchResults = [];
          this.toggleUserSearchMode();
          this.loadMyChats();
        } else {
          Swal.fire('Error!', `Failed to create chat: ${errorMessage}`, 'error');
          console.error('Failed to create chat:', errorMessage);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creating chat:', err);
        Swal.fire('Error!', `An unexpected error occurred while creating the chat.`, 'error');
      }
    });
  }
}
