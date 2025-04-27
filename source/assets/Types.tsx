import { FieldValue, Timestamp } from "firebase/firestore";
import { User } from "react-native-gifted-chat";

export enum TypeType {
    LOST = 'Lost',
    FOUND = 'Found',
}

export type ItemData = {
    id: string,
    name: string,
    description: string,
    ownerId: string,
    isLost: boolean,
    secretPhrase: string | null,
    createdAt: Timestamp | null,
    imageUrl: string,
    timesLost: number,
    lostPostId: string | null,
};

export type UserData = {
    id: string,
    name: string,
    email: string,
    phoneNumber: string | null,
    address: string | null,
    pfpUrl: string | null,
    emailVertified: boolean,
    createdAt: Timestamp | null,
    timesOwnItemLost: number,
    timesOwnItemFound: number,
    timesOthersItemFound: number,
    blockedList: string[],
    friendsList: string[],
    privateStats: boolean,
};

export type PostData = {
    id: string,
    type: TypeType,
    itemId: string,
    title: string,
    message: string,
    authorId: string,
    createdAt: Timestamp | null,
    resolved: boolean,
    resolvedAt: Timestamp | null,
    resolveReason: string | null,
    views: number,
    roomIds: string[],
    showPhoneNumber: boolean,
    showAddress: boolean,
    imageUrls: string[],
};

export type RoomData = {
    id: string,
    type: TypeType,
    userIds: string[],
    postId: string | null,
    createdAt: Timestamp | null,
//                secretPhraseValidated: false,
};

export type ChatRoomTile = {
    users: UserData[],
    room: RoomData, 
    post: PostData,
    lastMessage?: GiftedMessageData,
}

export type GiftedMessageData = {
    id: string,
    messageId: string,
    createdAt: Timestamp | null,
    text: string,
    user: User,
}