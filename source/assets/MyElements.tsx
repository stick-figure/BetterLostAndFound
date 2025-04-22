import { useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';

const PressableOpacity = ({ children, ...props }) => {
  const animated = useRef(new Animated.Value(1)).current;
 
  const fadeIn = () => {
    Animated.timing(animated, {
      toValue: props.activeOpacity || 0.1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  const fadeOut = () => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
    
  return (
    <Animated.View style={props.disabled ? (props.disabledStyle || {opacity: 0.6}) : { opacity: animated }}>
        <Pressable onPressIn={fadeIn} onPressOut={fadeOut} {...props}>
            {children}
        </Pressable>
    </Animated.View>
  );
};
export default PressableOpacity;