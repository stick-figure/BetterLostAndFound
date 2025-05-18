import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";
import { Icon } from "react-native-elements";
import { DarkThemeColors, LightThemeColors } from "../assets/Colors";
import HomeScreen from "../components/Home";
import MyChatRoomsScreen from "../components/MyChatRooms";
import MyItemsScreen from "../components/MyItems";
import PostLostItemScreen from "../components/PostLostItem";
import ReturnItemScreen from "../components/ReturnItem";
import { HomeTabParamList } from "./Types";
import MyStuffScreen from "../components/MyStuff";

export const Tab = createBottomTabNavigator<HomeTabParamList>();

export function HomeTab() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, 
                tabBarActiveTintColor: colors.primary,
                tabBarActiveBackgroundColor: colors.card,
                tabBarInactiveTintColor: colors.border,
                tabBarInactiveBackgroundColor: colors.card,
                headerStyle: {
                    backgroundColor: colors.card,
                },
                tabBarStyle: {
                    backgroundColor: colors.card,
                }
            }}
            initialRouteName={'Home'}>
            <Tab.Screen 
                name='Home' 
                component={HomeScreen} 
                options={{ 
                    title: 'Home', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        return <Icon name={focused ? 'home' : 'home-outline'} type='material-community' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='Post Lost Item' 
                component={PostLostItemScreen} 
                options={{ 
                    title: 'Post Lost Item', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        if (focused) return <Icon name='post' type='material-community' size={size} color={color} />;
                        return <Icon name='post-outline' type='material-community' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='Return Item' 
                component={ReturnItemScreen} 
                options={{
                    title: 'Return Item', 
                    headerShown: false, 
                    tabBarIcon: ({ focused, color, size }) => {
                        if (focused) return <Icon name='hand-holding-heart' type='font-awesome-5' size={size} color={color} />;
                        return <Icon name='hand-holding' type='font-awesome-5' size={size} color={color} />;
                    },
                }} />
            <Tab.Screen 
                name='My Stuff' 
                component={MyStuffScreen} 
                options={{ 
                    title: 'My Stuff', 
                    headerShown: false, 
                    tabBarIcon({ focused, color, size }) {
                        return <Icon name={focused ? 'person' : 'person-outline'} type='material-icons' size={size} color={color} />;
                    },
                }} />
        </Tab.Navigator>
    );
}

export default HomeTab;