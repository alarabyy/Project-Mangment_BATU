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

import Swal from 'sweetalert2';

interface Chat {
  id: number;
  name: string;
  lastMessage?: string; // Can be undefined or null
  time?: string; // Can be undefined or null
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
          lastMessage: undefined, // Changed to undefined for dynamic display
          time: undefined, // Changed to undefined
          unreadCount: 0,
          isPinned: false,
        }));
        this.filterChats();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching my chats:', err);
        Swal.fire('Error', 'Failed to load chats. Please try again later.', 'error');
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
          const currentUserIdString = this.authService.getUserId();
          const currentUserId = currentUserIdString ? parseInt(currentUserIdString, 10) : null;
          this.searchResults = users.filter(user =>
            user.id !== currentUserId && !this.isUserSelected(user)
          );
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
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete chat with "${chat.name}"? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.chatApiService.deleteChat(chat.id).subscribe({
          next: () => {
            this.chats = this.chats.filter(c => c.id !== chat.id);
            this.filterChats();
            Swal.fire('Deleted!', `Chat with "${chat.name}" has been deleted.`, 'success');
          },
          error: (err) => {
            console.error('Error deleting chat:', err);
            Swal.fire('Error!', `Failed to delete chat: ${err.message}`, 'error');
          }
        });
      }
    });
  }

  toggleUserSelection(user: Dean): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
      if (this.userSearchTerm.trim() !== '') {
          const searchIndex = this.searchResults.findIndex(u => u.id === user.id);
          if (searchIndex === -1) {
              this.searchResults.push(user);
              this.searchResults.sort((a, b) => a.name.localeCompare(b.name));
          }
      }
    } else {
      this.selectedUsers.push(user);
      this.searchResults = this.searchResults.filter(u => u.id !== user.id);
    }
    console.log('Currently selected users for new chat:', this.selectedUsers);
  }

  isUserSelected(user: Dean): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  async createChatWithSelectedUsers(): Promise<void> {
    const currentUserIdString = this.authService.getUserId();
    if (!currentUserIdString) {
      Swal.fire('Error', 'You must be logged in to create a chat.', 'error');
      this.router.navigate(['/Login']);
      return;
    }

    const currentUserId = parseInt(currentUserIdString, 10);
    if (isNaN(currentUserId)) {
        Swal.fire('Error', 'Invalid user ID. Please log in again.', 'error');
        this.router.navigate(['/Login']);
        return;
    }

    if (this.selectedUsers.length === 0) {
      Swal.fire('Info', 'Please select at least one user to create a chat.', 'info');
      return;
    }

    const { value: chatName } = await Swal.fire({
      title: 'Enter Chat Name',
      input: 'text',
      inputLabel: 'Name of your new chat group',
      inputValue: '',
      showCancelButton: true,
      inputValidator: (value: string) => {
        if (!value || value.trim() === '') {
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
      name: chatName.trim(),
      memberIds: memberIds
    };

    this.chatApiService.createChat(request).subscribe({
      next: (errorMessage: string) => {
        if (!errorMessage) {
          console.log(`New chat "${chatName}" created successfully.`);
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
        Swal.fire('Error!', `An unexpected error occurred while creating the chat. ${err.message}`, 'error');
      }
    });
  }
}
