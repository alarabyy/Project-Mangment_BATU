// src/app/shared/dtos.ts

// DTOs matching your C# backend

export interface ChatCreateRequest {
    name: string;
    memberIds: number[];
}

export interface UserMinimalDto {
    id: number;
    name: string;
}

export interface ChatMinimalDto {
    id: number;
    name: string;
}

export interface ChatDto {
    id: number;
    name: string;
    ownerId: number;
    members: UserMinimalDto[]; // Array of UserMinimalDto
}

export interface ChatMessageDto {
    id: number;
    message: string;
    date: string; // ISO 8601 string from backend (DateTime.UtcNow)
    senderId: number;
    chatId: number;
}
