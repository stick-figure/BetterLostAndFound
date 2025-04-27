import type {
    CompositeScreenProps,
    NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { FirebaseError } from 'firebase/app';
import { ItemData, PostData, RoomData, UserData } from '../assets/Types';

export type RootStackParamList = {
    'My Drawer': NavigatorScreenParams<MyDrawerParamList>;
    'My Stack': NavigatorScreenParams<MyStackParamList>;
};
export type RootStackScreenProps<T extends keyof RootStackParamList> =
    StackScreenProps<RootStackParamList, T>;

export type MyDrawerParamList = {
    'Home Tabs': NavigatorScreenParams<HomeTabParamList>;
    'Notifications': undefined;
    'Settings': undefined;
};

export type MyDrawerScreenProps<T extends keyof MyDrawerParamList> =
    CompositeScreenProps<
        DrawerScreenProps<MyDrawerParamList, T>,
        RootStackScreenProps<keyof RootStackParamList>
    >;


export type HomeTabParamList = {
    'Home': undefined;
    'Return Item': undefined;
    'My Chat Rooms': undefined;
    'My Items': undefined;
};

export type HomeTabScreenProps<T extends keyof HomeTabParamList> =
    CompositeScreenProps<
        BottomTabScreenProps<HomeTabParamList, T>,
        RootStackScreenProps<keyof RootStackParamList>
    >;

export type MyStackParamList = {
    /* Screens for logged in users */
    'Post Lost Item': undefined;
    'Notifications': undefined;
    'Add Item': {
        nextScreen: string
    } | undefined;
    'View Item': {
        itemId?: string,
        itemName?: string,
        item: ItemData,
    } | {
        itemId: string,
        itemName: string,
        item?: ItemData,
    };
    'Scan Code': undefined;
    'New Lost Post': { 
        item: ItemData, 
        owner?: UserData, 
    };
    'View Lost Post': {
        post: PostData, 
        item: ItemData, 
        owner?: UserData,
        author: UserData,
    };
    'New Found Post': { 
        item: ItemData, 
        owner?: UserData 
    };
    'Search Items': undefined;
    'Chat Room': {
        room: RoomData,
        users?: UserData[],
        post?: PostData;
    };
    
    /* Auth screens */
    'Login': undefined;
    'Register': {
        email?: string;
        password?: string;
    };
    
    /* Common modal screens */
    'Error': { 
        error: FirebaseError | Error | any, 
        onClose?: any,
    };
    'Loading': undefined;
};

export type MyStackScreenProps<T extends keyof MyStackParamList> =
    CompositeScreenProps<
        DrawerScreenProps<MyStackParamList, T>,
        RootStackScreenProps<keyof RootStackParamList>
    >;

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}  