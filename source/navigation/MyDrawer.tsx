import { createDrawerNavigator } from "@react-navigation/drawer";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useColorScheme, View, Text } from "react-native";
import { Icon } from "react-native-elements";
import { DarkThemeColors, LightThemeColors } from "../assets/Colors";
import NotificationsScreen from "../components/Notifications";
import { SettingsScreen } from "../components/Settings";
import { PressableOpacity } from "../hooks/MyElements";
import HomeTab from "./HomeTab";
import { MyDrawerParamList } from "./Types";

export const Drawer = createDrawerNavigator<MyDrawerParamList>();

export function MyDrawer() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;
    const navigation = useNavigation();

    return (
        <Drawer.Navigator
            screenOptions={{
                drawerType: 'slide',
                drawerActiveTintColor: colors.primary,
                headerTitleStyle: {
                    color: colors.text,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                    elevation: 0,
                    shadowOpacity: 0.5,
                    shadowOffset: {width: 3, height: 3},
                },
                drawerStyle: {
                    backgroundColor: colors.card,
                },
                drawerInactiveTintColor: colors.text,
                headerTintColor: colors.primary,
                headerLeft: ({ tintColor, pressColor, pressOpacity, labelVisible }) => {
                    return (
                        <PressableOpacity 
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            activeOpacity={pressOpacity}
                            style={{
                                height: '100%', 
                                alignItems: 'stretch', 
                                justifyContent: 'center',
                                aspectRatio: 1}}>
                            <Icon name='menu' type='material-icons' size={24} color={tintColor} />
                        </PressableOpacity>
                    );
                },
            }}
            initialRouteName={'Home Tabs'}
            >
            <Drawer.Screen 
                name='Home Tabs' 
                component={HomeTab} 
                options={{
                    title: 'Home Tabs',
                    headerTitle: 'Better Lost and Found', 
                    headerShown: true, 
                    drawerItemStyle: {
                        height: 150,
                        flexDirection: 'column-reverse',
                    },
                    

                    drawerIcon({ focused, color, size }) {
                        if (focused) return (
                            <View style={{flexDirection: 'row'}}>
                                <Text style={{fontSize: size, color: color, fontWeight: '700'}}>Better Lost and Found</Text>
                            </View>
                        );
                        return (
                            <Icon name='home' type='material-icons' size={size} color={color} />
                        );
                    },
                    drawerLabel({ focused, color }) {
                        if (focused) return (
                            <Text></Text>
                        );
                        return (
                            <Text style={{color: color}}>Home</Text>
                        );
                    },
                }} />
            <Drawer.Screen 
                name='Notifications' 
                component={NotificationsScreen} 
                options={{ 
                    title: 'Notifications',
                    headerTitle: 'Notifications',
                    drawerIcon({ focused, color, size }) {
                        return <Icon name='notifications' type='material-icons' size={size} color={color} />;
                    },
                }} />
            <Drawer.Screen 
                name='Settings' 
                component={SettingsScreen} 
                options={{ 
                    title: 'Settings',
                    headerTitle: 'Settings', 
                    drawerIcon({ focused, color, size }) {
                        return <Icon name='settings' type='material-icons' size={size} color={color} />;
                    },
                }} />
        </Drawer.Navigator>
    );
}

export default MyDrawer;