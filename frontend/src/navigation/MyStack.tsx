import { createStackNavigator } from "@react-navigation/stack";
import { useColorScheme } from "react-native";
import { DarkThemeColors, LightThemeColors } from "../assets/Colors";
import AddItemScreen from "../components/AddItem";
import ChatRoomScreen from "../components/ChatRoom";
import ErrorScreen from "../components/Error";
import LoadingScreen from "../components/Loading";
import LoginScreen from "../components/Login";
import NewFoundPostScreen from "../components/NewFoundPost";
import NewLostPostScreen from "../components/NewLostPost";
import RegisterScreen from "../components/Register";
import SearchItemsScreen from "../components/SearchItems";
import ViewItemScreen from "../components/ViewItem";
import ViewLostPostScreen from "../components/ViewLostPost";
import WhoFoundScreen from "../components/WhoFound";
import { MyStackParamList } from "./Types";

export const Stack = createStackNavigator<MyStackParamList>();

export function MyStack() {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? DarkThemeColors : LightThemeColors;

    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: colors.text,
                headerBackTitleStyle: {
                    color: colors.primary,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                    elevation: 0,
                    shadowOpacity: 0.5,
                    shadowOffset: {width: 3, height: 3},
                },
            }}
            initialRouteName={'Login'}
            >
            {/* Screens for logged in users */}
            <Stack.Group>
                <Stack.Screen name='Add Item' component={AddItemScreen} options={{ title: 'Add Item', headerBackTitle: 'Back', }} />
                <Stack.Screen 
                    name='View Item' 
                    options={({ route }) => ({
                        title: route.params?.itemName,
                        headerBackTitle: 'Back',
                        headerShown: false,
                    })}
                    component={ViewItemScreen} 
                />
                <Stack.Screen name='New Lost Post' component={NewLostPostScreen} options={{ title: 'New Post' }} />
                <Stack.Screen name='View Lost Post' component={ViewLostPostScreen} options={{ title: 'View Lost Post', headerShown: false }} />
                <Stack.Screen name='Search Items' component={SearchItemsScreen} options={{ 
                    title: 'Search Items', 
                    headerShown: false}} />
                <Stack.Screen name='New Found Post' component={NewFoundPostScreen} options={{ title: 'New Post', headerBackTitle: 'Back', }} />
                <Stack.Screen name='Chat Room' component={ChatRoomScreen} options={{title: 'Chat Room', headerBackTitle: 'Back', }} />
            </Stack.Group>
            
            {/* Auth screens */}
            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name='Login' component={LoginScreen} options={{ title: 'Login' }} />
                <Stack.Screen name='Register' component={RegisterScreen} options={{ title: 'Register' }} />
            </Stack.Group>

            

            {/* Common modal screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name='Error' component={ErrorScreen} options={{ title: 'Error' }} />
                <Stack.Screen name='Loading' component={LoadingScreen} options={{ title: 'Loading' }} />
                <Stack.Screen name='Who Found' component={WhoFoundScreen} options={{ title: 'Who found your item?' }} />
            </Stack.Group>
        </Stack.Navigator>
    );
}

export default MyStack;
