// src/app/all-chats/all-chats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Dean, UserService } from '../../../Services/user.service';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
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
  // For searching existing chats
  chatSearchTerm: string = '';
  chats: Chat[] = [];
  filteredChats: Chat[] = [];

  // For searching users to create new chats
  userSearchTerm: string = '';
  searchResults: Dean[] = [];
  selectedUsers: Dean[] = [];

  // Controls which search section is active/visible
  showUserSearch: boolean = false; // False means show existing chats by default

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    // Simulate fetching initial chat data
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
    this.filterChats(); // Initialize filtered chats for the default view
  }

  /**
   * Toggles between showing the existing chat list search and the new user search.
   * Resets the search terms and results when switching modes to ensure a clean state.
   */
  toggleUserSearchMode(): void {
    this.showUserSearch = !this.showUserSearch;
    // Clear search terms and results when switching modes
    this.chatSearchTerm = '';
    this.userSearchTerm = '';
    this.searchResults = [];
    this.selectedUsers = [];
    this.filterChats(); // Re-filter existing chats if returning to chat view
  }

  /**
   * Filters the existing chat list based on chatSearchTerm.
   * This method is called when the user types in the "Search Existing Chats" input.
   * Pinned chats appear first, then chats are sorted alphabetically.
   */
  filterChats(): void {
    const term = this.chatSearchTerm.toLowerCase();
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

  /**
   * Calls the UserService to search for users based on userSearchTerm.
   * This method is called when the user types in the "Search Users to Chat With" input.
   * Populates the searchResults array with the returned users.
   */
  searchUsers(): void {
    const term = this.userSearchTerm.trim();
    if (term) {
      this.userService.searchUsers(term).subscribe({
        next: (users) => {
          this.searchResults = users;
          console.log('User search results:', this.searchResults);
        },
        error: (err) => {
          console.error('Error searching users:', err);
          // In a real app, you might show an error message to the user
          this.searchResults = []; // Clear results on error
        }
      });
    } else {
      this.searchResults = []; // Clear results if search term is empty
    }
  }

  /**
   * Navigates to a specific chat based on its ID.
   * @param chatId The ID of the chat to navigate to.
   */
  goToChat(chatId: number): void {
    this.router.navigate(['/chat', chatId]);
  }

  /**
   * Toggles the 'pinned' status of a chat.
   * Prevents event propagation to avoid navigating to the chat when clicking the pin icon.
   * @param chat The chat object to toggle.
   * @param event The mouse event.
   */
  togglePin(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    chat.isPinned = !chat.isPinned;
    this.filterChats(); // Re-sort the list after pinning/unpinning
    console.log(`Chat ${chat.name} ${chat.isPinned ? 'pinned' : 'unpinned'}.`);
  }

  /**
   * Marks a chat as read by setting its unreadCount to 0.
   * Prevents event propagation.
   * @param chat The chat object to mark as read.
   * @param event The mouse event.
   */
  markAsRead(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    chat.unreadCount = 0;
    console.log(`Chat ${chat.name} marked as read.`);
  }

  /**
   * Deletes a chat from the list.
   * Prevents event propagation.
   * @param chat The chat object to delete.
   * @param event The mouse event.
   */
  deleteChat(chat: Chat, event: MouseEvent): void {
    event.stopPropagation(); // Prevent navigating to chat
    this.chats = this.chats.filter(c => c.id !== chat.id); // Remove the chat from the main list
    this.filterChats(); // Update the filtered list
    console.log(`Chat ${chat.name} deleted.`);
    // In a real application, you'd send this deletion request to a backend service
  }

  /**
   * Toggles the selection status of a user for creating a new chat.
   * Adds the user to selectedUsers if not already present, removes if present.
   * @param user The user (Dean) object to toggle selection for.
   */
  toggleUserSelection(user: Dean): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1); // User is already selected, remove them
    } else {
      this.selectedUsers.push(user); // User is not selected, add them
    }
    console.log('Currently selected users for new chat:', this.selectedUsers);
  }

  /**
   * Checks if a given user is currently selected.
   * Used to set the 'checked' state of the checkbox in the UI.
   * @param user The user (Dean) object to check.
   * @returns True if the user is selected, false otherwise.
   */
  isUserSelected(user: Dean): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  /**
   * Placeholder method to "create" a chat based on the selected users.
   * In a real application, this would involve an API call to create a new chat room
   * with the selected participants.
   */
  createChatWithSelectedUsers(): void {
    if (this.selectedUsers.length > 0) {
      const userNames = this.selectedUsers.map(u => u.name).join(', ');
      console.log(`Initiating creation of a new chat with: ${userNames}`);
      // TODO: Implement actual backend call to create the chat
      // For now, simulate success and clear selections/search.

      // After successful creation, clear the state and switch back to main chat view:
      this.selectedUsers = [];
      this.userSearchTerm = ''; // Clear search term
      this.searchResults = []; // Clear search results
      this.toggleUserSearchMode(); // Switch back to main chat view
      alert(`New chat created with: ${userNames}`); // Using alert for demo, replace with custom modal
    } else {
      console.log('No users selected to create a chat.');
      alert('Please select at least one user to create a chat.'); // Using alert for demo
    }
  }
}
