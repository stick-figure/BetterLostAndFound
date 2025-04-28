import { FieldValue, Timestamp } from "firebase/firestore";
import { User } from "react-native-gifted-chat";

export enum TypeType {
    LOST = 'Lost',
    FOUND = 'Found',
}

export enum LostPostResolveReasons {
    FOUND_ITEM = 'found-item',
    SELF_FOUND_ITEM = 'self-found-item',
    
    GAVE_UP = 'self-removed-post-gave-up',
    DIDNT_MEAN_TO_POST = 'self-removed-post-mistake',
    REMOVED_OTHER_REASON = 'self-removed-post-other',
    POST_EXPIRED = 'post-expired',
    ADMIN_REMOVED_POST = 'admin-removed-post',
}

export enum FoundPostResolveReasons {
    ITEM_CLAIMED = 'item-claimed',

    GAVE_UP = 'self-removed-post-gave-up',
    DIDNT_MEAN_TO_POST = 'self-removed-post-mistake',
    REMOVED_OTHER_REASON = 'self-removed-post-other',
    POST_EXPIRED = 'post-expired',
    ADMIN_REMOVED_POST = 'admin-removed-post',
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

export type ItemDataUpload = Omit<ItemData, 'createdAt'> & {
    createdAt: FieldValue,
}

export type UserData = {
    id: string,
    name: string,
    email: string,
    phoneNumber: string | null,
    address: string | null,
    pfpUrl: string | null,
    emailVertified: boolean,
    createdAt: Timestamp | null,
    timesLostItem: number,
    timesSelfFoundItem: number,
    timesOthersFoundItem: number,
    timesFoundOthersItem: number,
    blockedList: string[],
    friendsList: string[],
    privateStats: boolean,
};
export type UserDataUpload = Omit<UserData, 'createdAt'> & {
    createdAt: FieldValue,
}

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

export type LostPostData = Omit<PostData, 'type'|'resolveReason'> & {
    type: TypeType.LOST,
    resolveReason: LostPostResolveReasons | null,
    foundBy: UserData | null,
}

export type FoundPostData = Omit<PostData, 'type'|'resolveReason'> & {
    type: TypeType.LOST,
    resolveReason: FoundPostResolveReasons | null,
    claimedBy: UserData | null,
}

export type LostPostDataUpload = Omit<LostPostData, 'createdAt'|'resolvedAt'> & {
    createdAt: FieldValue,
    resolvedAt: FieldValue | null,
}

export type RoomData = {
    id: string,
    type: TypeType,
    userIds: string[],
    postId: string | null,
    createdAt: Timestamp | null,
    resolved: boolean,
    resolvedAt: Timestamp | null,
//                secretPhraseValidated: false,
};

export type RoomDataUpload = Omit<RoomData, 'createdAt'|'resolvedAt'> & {
    createdAt: FieldValue,
    resolvedAt: FieldValue,
}

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