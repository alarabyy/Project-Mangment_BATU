// src/app/models/dtos.ts

export interface ChatCreateRequest {
    name: string;
    memberIds: number[];
}

// UserMinimalDto should come from UserService or be defined here
export interface UserMinimalDto {
    id: number;
    name: string;
    // ... possibly other minimal user properties like avatar if backend provides
}

export interface ChatMinimalDto {
    id: number;
    name: string;
    // lastMessage?: string; // If your API sends this for the all-chats list
    // lastMessageTime?: string;
    // unreadCount?: number;
}

export interface ChatDto {
    id: number;
    name: string;
    ownerId: number;
    members: UserMinimalDto[]; // Array of UserMinimalDto for participants
    // You might also have memberIds: number[] here
}

export interface ChatMessageDto {
    id: number;
    message: string;
    date: string; // ISO 8601 string from backend (DateTime.UtcNow)
    senderId: number;
    chatId: number;
    attachments: string[]; // Array of attachment filenames/keys from backend
    // Other properties like sender name, etc. could be here if backend sends them
}
