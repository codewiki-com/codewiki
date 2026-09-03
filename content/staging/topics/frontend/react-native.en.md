---
title: React Native Mobile App Guide
description: Master React Native for native mobile applications
track: frontend
section: react
difficulty: intermediate
tags:
  - React Native
  - Mobile
  - Cross-platform
  - iOS
  - Android
status: imported
origin: old/src/content/docs/frontend/react-native.en.md
divergence: 0.186
issues: []
legacy:
  category: Frontend
  subcategory: Mobile
  order: 29
  lastUpdated: 2026-01-07
---

React Native is an open-source mobile application development framework created by Meta (formerly Facebook) that enables developers to build truly native mobile applications using JavaScript and React. Since its release in 2015, React Native has become one of the leading choices for cross-platform mobile development, powering apps for companies like Instagram, Airbnb, Uber Eats, and Discord.

## Cross-Platform Development Comparison

When selecting a mobile development technology stack, understanding the characteristics of different approaches is crucial.

### React Native vs Flutter vs Native Development

| Feature | React Native | Flutter | Native Development |
|---------|-------------|---------|-------------------|
| Language | JavaScript/TypeScript | Dart | Swift/Kotlin |
| Rendering | Native Components | Custom Rendering Engine | Native Components |
| Learning Curve | Moderate (lower with React experience) | Moderate | Steep (two separate stacks) |
| Performance | Near-native | Near-native | Best |
| Hot Reload | Supported | Supported | Partial Support |
| Community | Mature and Rich | Rapidly Growing | Platform-specific |
| Code Reuse | 80-90% | 90-95% | 0% |

### When to Choose Each Approach

**Choose React Native when:**
- Your team has React/JavaScript experience
- You need rapid iteration with hot reload
- You want to leverage web development skills
- You need access to a vast ecosystem of third-party libraries

**Choose Flutter when:**
- You require highly consistent UI designs across platforms
- Your app needs complex animations
- You are willing to learn the Dart language
- You have strict performance requirements

**Choose Native Development when:**
- Application performance is the top priority
- You need deep platform integration
- You have sufficient development resources
- The application functionality is relatively straightforward

## Environment Setup and Project Creation

### Prerequisites

Before starting React Native development, you need to configure your development environment:

```bash
# Check Node.js version (requires 18 or higher)
node --version

# Install React Native CLI
npm install -g react-native-cli

# macOS users need to install Watchman
brew install watchman

# iOS development requires Xcode (macOS only)
xcode-select --install

# Android development requires Android Studio and JDK
# Configure ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Creating a New Project

React Native offers multiple ways to create projects:

```bash
# Create a project using the official CLI
npx react-native init MyApp

# Create with TypeScript template
npx react-native init MyApp --template react-native-template-typescript

# Use Expo (recommended for beginners)
npx create-expo-app MyApp
cd MyApp
npx expo start
```

### Project Structure

```
MyApp/
├── android/           # Android native code
├── ios/               # iOS native code
├── src/               # Source code directory
│   ├── components/    # Reusable components
│   ├── screens/       # Screen components
│   ├── navigation/    # Navigation configuration
│   ├── services/      # API services
│   ├── store/         # State management
│   └── utils/         # Utility functions
├── App.tsx            # Application entry point
├── package.json       # Dependency configuration
├── metro.config.js    # Metro bundler configuration
└── babel.config.js    # Babel configuration
```

### Running the Project

```bash
# Start Metro bundler
npx react-native start

# Run iOS app (macOS only)
npx react-native run-ios

# Run Android app
npx react-native run-android

# Specify device or simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
npx react-native run-android --deviceId="emulator-5554"
```

## Core Components Deep Dive

React Native provides a set of core components that map to their native counterparts on each platform.

### View Component

`View` is the most fundamental container component, similar to HTML's `div`:

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const ViewExample = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Basic container */}
        <View style={styles.box}>
          <View style={styles.innerBox} />
        </View>

        {/* Using flex layout */}
        <View style={styles.row}>
          <View style={[styles.cell, { backgroundColor: '#3498db' }]} />
          <View style={[styles.cell, { backgroundColor: '#e74c3c' }]} />
          <View style={[styles.cell, { backgroundColor: '#2ecc71' }]} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  box: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  innerBox: {
    width: 100,
    height: 100,
    backgroundColor: '#9b59b6',
    borderRadius: 50,
  },
  row: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cell: {
    flex: 1,
    height: 80,
    marginHorizontal: 5,
    borderRadius: 8,
  },
});

export default ViewExample;
```

### Text Component

`Text` is used to display text content and supports nesting and style inheritance:

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TextExample = () => {
  return (
    <View style={styles.container}>
      {/* Basic text */}
      <Text style={styles.title}>React Native Text Component</Text>

      {/* Nested text (style inheritance) */}
      <Text style={styles.paragraph}>
        This is regular text that contains
        <Text style={styles.bold}> bold</Text> and
        <Text style={styles.italic}> italic</Text> as well as
        <Text style={styles.link} onPress={() => console.log('Link pressed')}>
          {' '}a clickable link
        </Text>
        .
      </Text>

      {/* Multi-line text with ellipsis */}
      <Text numberOfLines={2} ellipsizeMode="tail" style={styles.paragraph}>
        This is a long text that will be truncated with an ellipsis when it
        exceeds the specified number of lines. React Native's Text component
        provides rich text processing capabilities.
      </Text>

      {/* Selectable text */}
      <Text selectable style={styles.paragraph}>
        Long press to select and copy this text
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

export default TextExample;
```

### Image Component

`Image` is used to display images and supports both local and network resources:

```jsx
import React from 'react';
import { View, Image, Text, StyleSheet, ImageBackground } from 'react-native';

const ImageExample = () => {
  return (
    <View style={styles.container}>
      {/* Local image */}
      <Image
        source={require('./assets/logo.png')}
        style={styles.localImage}
      />

      {/* Network image (dimensions required) */}
      <Image
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        style={styles.networkImage}
        resizeMode="contain"
      />

      {/* Image with loading states */}
      <Image
        source={{ uri: 'https://example.com/large-image.jpg' }}
        style={styles.largeImage}
        loadingIndicatorSource={require('./assets/placeholder.png')}
        onLoadStart={() => console.log('Loading started')}
        onLoadEnd={() => console.log('Loading completed')}
        onError={(error) => console.log('Loading failed', error)}
      />

      {/* Background image */}
      <ImageBackground
        source={{ uri: 'https://example.com/background.jpg' }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 10 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Content overlaid on image</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  localImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  networkImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  largeImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  backgroundImage: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 10,
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
  },
});

export default ImageExample;
```

### ScrollView and FlatList

Two core components for handling scrollable content:

```jsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl
} from 'react-native';

// ScrollView - Suitable for small amounts of content
const ScrollViewExample = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.scrollItem}>
          <Text style={styles.itemText}>Item {item}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// FlatList - Suitable for large datasets (virtualized list)
const FlatListExample = () => {
  const data = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    title: `List Item ${i + 1}`,
  }));

  const renderItem = useCallback(({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>{item.title}</Text>
    </View>
  ), []);

  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerText}>List Header</Text>
    </View>
  ), []);

  const renderEmpty = useCallback(() => (
    <View style={styles.empty}>
      <Text>No data available</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      // Performance optimization settings
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // Scroll events
      onEndReached={() => console.log('Reached end of list')}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  scrollItem: {
    backgroundColor: '#3498db',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});

export { ScrollViewExample, FlatListExample };
```

### TextInput Component

Used to receive user input:

```jsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TextInputExample = () => {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [multiline, setMultiline] = useState('');

  return (
    <View style={styles.container}>
      {/* Basic input */}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Enter text"
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
        autoComplete="password"
      />

      {/* Multiline input */}
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={multiline}
        onChangeText={setMultiline}
        placeholder="Enter multiline content"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Input with validation */}
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Enter email"
        onSubmitEditing={() => console.log('Submitted')}
        returnKeyType="done"
      />

      {/* Numeric input */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter number"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 120,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#3498db',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TextInputExample;
```

## Styling and Layout

React Native uses JavaScript objects to define styles, with a layout system based on Flexbox.

### StyleSheet API

```jsx
import { StyleSheet } from 'react-native';

// Create a stylesheet (recommended approach)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Combined styles
  text: {
    fontSize: 16,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

// Using styles
<View style={styles.container}>
  <Text style={[styles.text, styles.boldText]}>Combined styles</Text>
  <Text style={[styles.text, { color: 'red' }]}>Dynamic styles</Text>
</View>

// Common StyleSheet methods
StyleSheet.hairlineWidth;  // Thinnest line width (1 pixel)
StyleSheet.absoluteFill;   // Absolute positioning fill
StyleSheet.flatten(styles.container);  // Flatten style arrays
```

### Flexbox Layout System

React Native's Flexbox is slightly different from the web version, with `flexDirection` defaulting to `column`:

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FlexboxExample = () => {
  return (
    <View style={styles.container}>
      {/* Main axis direction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flexDirection: row</Text>
        <View style={[styles.box, { flexDirection: 'row' }]}>
          <View style={[styles.item, { backgroundColor: '#e74c3c' }]} />
          <View style={[styles.item, { backgroundColor: '#3498db' }]} />
          <View style={[styles.item, { backgroundColor: '#2ecc71' }]} />
        </View>
      </View>

      {/* Main axis alignment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>justifyContent: space-between</Text>
        <View style={[styles.box, {
          flexDirection: 'row',
          justifyContent: 'space-between'
        }]}>
          <View style={[styles.item, { backgroundColor: '#9b59b6' }]} />
          <View style={[styles.item, { backgroundColor: '#f39c12' }]} />
          <View style={[styles.item, { backgroundColor: '#1abc9c' }]} />
        </View>
      </View>

      {/* Cross axis alignment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>alignItems: center</Text>
        <View style={[styles.box, {
          flexDirection: 'row',
          alignItems: 'center',
          height: 100
        }]}>
          <View style={[styles.item, { height: 30 }]} />
          <View style={[styles.item, { height: 50 }]} />
          <View style={[styles.item, { height: 70 }]} />
        </View>
      </View>

      {/* Flex proportions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flex ratio distribution</Text>
        <View style={[styles.box, { flexDirection: 'row' }]}>
          <View style={[styles.item, { flex: 1, backgroundColor: '#e74c3c' }]} />
          <View style={[styles.item, { flex: 2, backgroundColor: '#3498db' }]} />
          <View style={[styles.item, { flex: 1, backgroundColor: '#2ecc71' }]} />
        </View>
      </View>

      {/* Flex wrap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flexWrap: wrap</Text>
        <View style={[styles.box, {
          flexDirection: 'row',
          flexWrap: 'wrap'
        }]}>
          {[1,2,3,4,5,6].map(i => (
            <View key={i} style={styles.wrapItem} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  box: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  item: {
    width: 50,
    height: 50,
    backgroundColor: '#3498db',
    margin: 4,
    borderRadius: 4,
  },
  wrapItem: {
    width: 80,
    height: 50,
    backgroundColor: '#9b59b6',
    margin: 4,
    borderRadius: 4,
  },
});

export default FlexboxExample;
```

### Responsive Design

```jsx
import { Dimensions, Platform, PixelRatio, useWindowDimensions } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Using Hook (recommended, supports screen rotation)
const ResponsiveComponent = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;

  return (
    <View style={[
      styles.container,
      isLandscape && styles.landscapeContainer,
      isTablet && styles.tabletContainer
    ]}>
      {/* Content */}
    </View>
  );
};

// Platform-specific styles
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      android: 16,
      default: 12,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// Pixel density adaptation
const normalize = (size) => {
  const scale = width / 375; // Based on iPhone 8 width
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
```

## Navigation System (React Navigation)

React Navigation is the most popular navigation library for React Native applications.

### Installation and Configuration

```bash
# Install core dependencies
npm install @react-navigation/native

# Install required dependencies
npm install react-native-screens react-native-safe-area-context

# Install navigators
npm install @react-navigation/native-stack  # Native stack navigator
npm install @react-navigation/bottom-tabs   # Bottom tab navigator
npm install @react-navigation/drawer        # Drawer navigator
```

### Basic Stack Navigation

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

// Define type parameters (TypeScript)
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number; title: string };
  Profile: { userId: string };
};

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type DetailsProps = NativeStackScreenProps<RootStackParamList, 'Details'>;
type ProfileProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Home Screen
function HomeScreen({ navigation }: HomeProps) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Home</Text>
      <Button
        title="View Details"
        onPress={() => navigation.navigate('Details', {
          itemId: 42,
          title: 'Product Details'
        })}
      />
      <Button
        title="Profile"
        onPress={() => navigation.navigate('Profile', {
          userId: 'user123'
        })}
      />
    </View>
  );
}

// Details Screen
function DetailsScreen({ route, navigation }: DetailsProps) {
  const { itemId, title } = route.params;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text>Item ID: {itemId}</Text>
      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="Go to Home"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
}

// Profile Screen
function ProfileScreen({ route }: ProfileProps) {
  const { userId } = route.params;
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>User: {userId}</Text>
    </View>
  );
}

// App Entry Point
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#3498db' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

### Tab Navigation with Nesting

```tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <HomeStack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: 'Details' }}
      />
    </HomeStack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </SettingsStack.Navigator>
  );
}

// Screen Components
function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Home</Text>
      <Button
        title="View Details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Details Screen</Text>
    </View>
  );
}

function SettingsScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Button
        title="About Us"
        onPress={() => navigation.navigate('About')}
      />
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>About</Text>
    </View>
  );
}

// Main Application
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

### Navigation Hooks and Utilities

```tsx
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  useIsFocused
} from '@react-navigation/native';
import { useCallback } from 'react';

function MyComponent() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  // Run effect when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Fetch data or subscribe when screen gains focus
      const fetchData = async () => {
        const response = await api.getData();
        setData(response);
      };

      fetchData();

      return () => {
        // Cleanup when screen loses focus
        console.log('Screen unfocused');
      };
    }, [])
  );

  return (
    <View>
      <Text>Current route: {route.name}</Text>
      <Text>Is focused: {isFocused ? 'Yes' : 'No'}</Text>
      <Button
        title="Navigate"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}
```

## State Management

React Native supports multiple state management solutions, from built-in options to third-party libraries.

### React Context + useReducer

```tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define state types
interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  cart: CartItem[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const initialState: AppState = {
  user: null,
  isLoading: false,
  error: null,
  cart: [],
};

// Action types
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, quantity: 1 }] };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Wrap actions
  const actions = {
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    addToCart: (item: CartItem) => dispatch({ type: 'ADD_TO_CART', payload: item }),
    removeFromCart: (id: string) => dispatch({ type: 'REMOVE_FROM_CART', payload: id }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Usage Example
function CartScreen() {
  const { state, removeFromCart, clearCart } = useApp();

  const totalPrice = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Cart ({state.cart.length})</Text>
      {state.cart.map(item => (
        <View key={item.id} style={styles.cartItem}>
          <Text>{item.name} x {item.quantity}</Text>
          <Text>${(item.price * item.quantity).toFixed(2)}</Text>
          <Button
            title="Remove"
            onPress={() => removeFromCart(item.id)}
          />
        </View>
      ))}
      <Text style={styles.total}>Total: ${totalPrice.toFixed(2)}</Text>
      <Button title="Clear Cart" onPress={clearCart} />
    </View>
  );
}
```

### Zustand (Recommended Lightweight Solution)

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface StoreState {
  // State
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  cart: CartItem[];

  // Actions
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  toggleTheme: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
}

// Create Store
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      theme: 'light',
      cart: [],

      // Actions
      setUser: (user) => set({ user }),

      login: async (credentials) => {
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });
          const data = await response.json();
          set({ user: data.user, token: data.token });
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },

      logout: () => set({ user: null, token: null, cart: [] }),

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId),
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ).filter(item => item.quantity > 0),
      })),

      getCartTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        theme: state.theme,
      }),
    }
  )
);

// Component Usage
function ProfileScreen() {
  const { user, logout, theme, toggleTheme } = useStore();

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <Text style={theme === 'dark' ? styles.darkText : styles.lightText}>
        {user?.name}
      </Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

// Selector optimization (avoids unnecessary re-renders)
function CartBadge() {
  const cartCount = useStore((state) => state.cart.length);
  return <Text style={styles.badge}>{cartCount}</Text>;
}

function CartTotal() {
  const getCartTotal = useStore((state) => state.getCartTotal);
  return <Text>Total: ${getCartTotal().toFixed(2)}</Text>;
}

export default useStore;
```

### TanStack Query (React Query) for Server State

```tsx
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

// Wrap app with provider
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
    </QueryClientProvider>
  );
}

// Fetching data
function ProductList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ProductItem product={item} />}
      refreshing={isLoading}
      onRefresh={refetch}
    />
  );
}

// Mutations
function AddProductButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newProduct: Product) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return (
    <Button
      title="Add Product"
      onPress={() => mutation.mutate({ name: 'New Product', price: 9.99 })}
      disabled={mutation.isPending}
    />
  );
}
```

## Native Modules and Bridging

React Native allows you to call native code to implement platform-specific functionality.

### Calling Native Modules

```tsx
import { NativeModules, Platform } from 'react-native';

// Access native modules
const { CalendarModule, DeviceInfo } = NativeModules;

// Call native methods
async function createCalendarEvent(name: string, location: string): Promise<string> {
  try {
    const eventId = await CalendarModule.createCalendarEvent(name, location);
    console.log(`Event created with id: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Get device information
function getDeviceInfo() {
  return {
    brand: DeviceInfo.brand,
    model: DeviceInfo.model,
    systemVersion: DeviceInfo.systemVersion,
  };
}

// Platform-specific module access
const PlatformModule = Platform.select({
  ios: () => NativeModules.IOSSpecificModule,
  android: () => NativeModules.AndroidSpecificModule,
})?.();
```

### Creating Native Modules (iOS - Swift)

```swift
// CalendarModule.swift
import Foundation
import EventKit

@objc(CalendarModule)
class CalendarModule: NSObject {

  private let eventStore = EKEventStore()

  @objc
  func createCalendarEvent(
    _ name: String,
    location: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    eventStore.requestAccess(to: .event) { granted, error in
      if let error = error {
        reject("ERROR", "Failed to access calendar", error)
        return
      }

      guard granted else {
        reject("PERMISSION_DENIED", "Calendar access denied", nil)
        return
      }

      let event = EKEvent(eventStore: self.eventStore)
      event.title = name
      event.location = location
      event.startDate = Date()
      event.endDate = Date().addingTimeInterval(3600)
      event.calendar = self.eventStore.defaultCalendarForNewEvents

      do {
        try self.eventStore.save(event, span: .thisEvent)
        resolve(event.eventIdentifier)
      } catch {
        reject("SAVE_ERROR", "Failed to save event", error)
      }
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
```

```objc
// CalendarModule.m (Bridge file)
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarModule, NSObject)

RCT_EXTERN_METHOD(createCalendarEvent:(NSString *)name
                  location:(NSString *)location
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### Creating Native Modules (Android - Kotlin)

```kotlin
// CalendarModule.kt
package com.myapp

import com.facebook.react.bridge.*
import android.content.ContentValues
import android.provider.CalendarContract

class CalendarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "CalendarModule"

    @ReactMethod
    fun createCalendarEvent(name: String, location: String, promise: Promise) {
        try {
            val contentResolver = reactApplicationContext.contentResolver
            val values = ContentValues().apply {
                put(CalendarContract.Events.TITLE, name)
                put(CalendarContract.Events.EVENT_LOCATION, location)
                put(CalendarContract.Events.DTSTART, System.currentTimeMillis())
                put(CalendarContract.Events.DTEND, System.currentTimeMillis() + 3600000)
                put(CalendarContract.Events.CALENDAR_ID, 1)
                put(CalendarContract.Events.EVENT_TIMEZONE, "UTC")
            }

            val uri = contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
            val eventId = uri?.lastPathSegment
            promise.resolve(eventId)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }
}

// CalendarPackage.kt
package com.myapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CalendarPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(CalendarModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

### Turbo Modules (New Architecture)

```typescript
// NativeCalendarModule.ts
import { TurboModuleRegistry, TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  createCalendarEvent(name: string, location: string): Promise<string>;
  getConstants(): {
    DEFAULT_EVENT_DURATION: number;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('CalendarModule');

// Usage
import NativeCalendarModule from './NativeCalendarModule';

async function createEvent() {
  const eventId = await NativeCalendarModule.createCalendarEvent('Meeting', 'Office');
  console.log('Created event:', eventId);
}
```

## Debugging and Performance Optimization

### Debugging Tools

```tsx
// Development environment debugging
if (__DEV__) {
  console.log('Development environment');
}

// React DevTools
// Use react-devtools package for component debugging

// Flipper integration (recommended)
// Provides network inspection, logging, layout inspection, and more

// Performance monitoring
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ['measure'] });
```

### Performance Optimization Strategies

```tsx
import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Image, TouchableOpacity, Text, View } from 'react-native';

// 1. Use memo to avoid unnecessary re-renders
const ListItem = memo(function ListItem({
  item,
  onPress
}: {
  item: { id: string; title: string };
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.item.id === nextProps.item.id;
});

// 2. Use useCallback to cache callback functions
function ProductList({ products, navigation }) {
  const handlePress = useCallback((id: string) => {
    navigation.navigate('Details', { id });
  }, [navigation]);

  // 3. Use useMemo to cache computed results
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.price - b.price);
  }, [products]);

  // 4. FlatList performance optimization
  const renderItem = useCallback(({ item }) => (
    <ListItem item={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const ITEM_HEIGHT = 60;
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <FlatList
      data={sortedProducts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      // Performance configuration
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // Avoid anonymous functions
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

// 5. Image optimization
function OptimizedImage({ uri, style }) {
  return (
    <Image
      source={{ uri }}
      style={style}
      // Use appropriate sizing
      resizeMode="cover"
      // Progressive loading
      fadeDuration={300}
      // Cache policy (iOS)
      cache="force-cache"
    />
  );
}

// 6. Avoid creating new objects during render
// Bad practice
<View style={{ flex: 1, padding: 20 }}>

// Good practice
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }
});
<View style={styles.container}>
```

### Memory Management

```tsx
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

function useMemoryManagement() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Monitor application state changes
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App came to foreground, can refresh data
          console.log('App came to foreground');
        }

        if (nextAppState === 'background') {
          // App went to background, clear cache
          console.log('App went to background');
          clearCache();
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

// Clean up timers and subscriptions
function DataFetcher() {
  useEffect(() => {
    const intervalId = setInterval(fetchData, 5000);
    const subscription = eventEmitter.addListener('update', handleUpdate);

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);
}

// Cancel network requests on unmount
function useAbortableFetch(url: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        const response = await fetch(url, { signal: abortController.signal });
        const result = await response.json();
        setData(result);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [url]);

  return { data, loading };
}
```

## Application Publishing

### iOS Release Process

```bash
# Configure distribution certificates and provisioning profiles
# Create in Apple Developer Portal

# Configure Xcode project
# - Set Bundle Identifier
# - Configure Signing & Capabilities
# - Set version number and build number

# Build release version
cd ios
xcodebuild -workspace MyApp.xcworkspace \
  -scheme MyApp \
  -configuration Release \
  -archivePath build/MyApp.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/MyApp.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist

# Upload to App Store Connect
xcrun altool --upload-app \
  -f build/MyApp.ipa \
  -u "apple_id@example.com" \
  -p "@keychain:AC_PASSWORD"
```

### Android Release Process

```bash
# Generate signing key
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Configure gradle.properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****

# Configure build.gradle
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

# Build AAB (recommended) or APK
cd android
./gradlew bundleRelease  # AAB
./gradlew assembleRelease  # APK

# Upload to Google Play Console
# Build artifacts located at android/app/build/outputs/bundle/release/
```

### Continuous Integration Configuration (GitHub Actions)

```yaml
# .github/workflows/release.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Build Android Release
        run: |
          cd android
          ./gradlew bundleRelease
        env:
          MYAPP_UPLOAD_STORE_FILE: ${{ secrets.ANDROID_KEYSTORE }}
          MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
          MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/bundle/release/

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Pods
        run: cd ios && pod install

      - name: Build iOS Release
        run: |
          cd ios
          xcodebuild -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -archivePath build/MyApp.xcarchive \
            archive
```

## Interview Key Points

### Fundamental Concepts

**Q1: How does React Native work?**

React Native runs React code on a JavaScript thread and communicates with the native thread through a Bridge. The new architecture introduces JSI (JavaScript Interface), enabling synchronous native code calls, and uses the Fabric renderer and Turbo Modules to improve performance.

**Q2: What are the main differences between React Native and React?**

```jsx
// React (Web)
<div className="container">
  <span onClick={handleClick}>Hello</span>
</div>

// React Native
<View style={styles.container}>
  <Text onPress={handlePress}>Hello</Text>
</View>
```

Key differences:
- Uses native components instead of DOM elements
- Styles use JavaScript objects instead of CSS
- Layout uses Flexbox by default, with flexDirection defaulting to column
- Event handler naming differs (onClick vs onPress)
- No CSS selectors or inheritance (except Text)

### Components and Performance

**Q3: How do you optimize FlatList performance?**

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Key optimization configuration
  initialNumToRender={10}        // Initial render count
  maxToRenderPerBatch={10}       // Items per batch
  windowSize={5}                 // Render window size
  removeClippedSubviews={true}   // Remove offscreen views
  getItemLayout={getItemLayout}  // Pre-calculate layout
  // Wrap renderItem with memo
/>
```

**Q4: How do you handle different screen sizes in React Native?**

```jsx
import { Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';

function ResponsiveComponent() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  // Dynamic size calculation
  const fontSize = width * 0.04;

  // Pixel density adaptation
  const normalize = (size: number) => {
    const scale = width / 375;
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  };

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      <Text style={{ fontSize: normalize(16) }}>Responsive Text</Text>
    </View>
  );
}
```

### Architecture and Principles

**Q5: Explain React Native's New Architecture (Fabric + TurboModules)**

Core improvements of the new architecture:

1. **JSI (JavaScript Interface)**: Replaces the Bridge's asynchronous communication, enabling synchronous calls between JavaScript and native code.

2. **Fabric**: The new rendering system that supports synchronous rendering and better priority scheduling.

3. **TurboModules**: Lazy loading of native modules, reducing startup time.

4. **Codegen**: Automatically generates type-safe native code bindings.

```tsx
// TurboModule example
import { TurboModuleRegistry } from 'react-native';

interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('Calculator');
const result = NativeModule.multiply(2, 3); // Synchronous call
```

**Q6: How do you handle Deep Linking in React Native?**

```tsx
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'user/:id',
      Settings: {
        path: 'settings',
        screens: {
          Notifications: 'notifications',
        },
      },
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        {/* screens */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Handle links
useEffect(() => {
  const handleDeepLink = ({ url }: { url: string }) => {
    // Parse and navigate
  };

  const subscription = Linking.addEventListener('url', handleDeepLink);

  // Check initial URL
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });

  return () => {
    subscription.remove();
  };
}, []);
```

### Practical Experience

**Q7: How do you handle offline state in a React Native application?**

```tsx
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);

      if (state.isConnected && pendingActions.length > 0) {
        syncPendingActions();
      }
    });

    return unsubscribe;
  }, [pendingActions]);

  const queueAction = async (action: Action) => {
    if (isOnline) {
      await executeAction(action);
    } else {
      const newPending = [...pendingActions, action];
      setPendingActions(newPending);
      await AsyncStorage.setItem('pendingActions', JSON.stringify(newPending));
    }
  };

  const syncPendingActions = async () => {
    for (const action of pendingActions) {
      await executeAction(action);
    }
    setPendingActions([]);
    await AsyncStorage.removeItem('pendingActions');
  };

  return { isOnline, queueAction };
}
```

**Q8: React Native Security Best Practices?**

```tsx
// 1. Secure storage for sensitive data
import * as Keychain from 'react-native-keychain';

async function storeCredentials(username: string, password: string) {
  await Keychain.setGenericPassword(username, password);
}

async function getCredentials() {
  const credentials = await Keychain.getGenericPassword();
  return credentials || null;
}

// 2. Certificate Pinning
// Use react-native-ssl-pinning library

// 3. Code obfuscation (Android)
// Enable ProGuard in build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android.txt')
    }
  }
}

// 4. Environment variable management
// Use react-native-config
import Config from 'react-native-config';
const apiUrl = Config.API_URL;

// 5. Input validation
function validateInput(input: string) {
  // Prevent XSS and injection attacks
  const sanitized = input.replace(/<[^>]*>/g, '');
  return sanitized;
}

// 6. Secure API communication
async function secureApiCall(endpoint: string, data: object) {
  const token = await Keychain.getGenericPassword();

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token?.password}`,
    },
    body: JSON.stringify(data),
  });
}
```

## Summary

React Native, as a leading cross-platform mobile development framework, offers several core advantages:

1. **Code Reuse**: A single codebase supports both iOS and Android platforms
2. **Development Efficiency**: Hot reload, rich community ecosystem, and leveraging web development experience
3. **Native Performance**: Renders native components for near-native application experience
4. **Flexible Extension**: Supports native module integration to meet specific requirements

Mastering React Native development requires understanding:
- Core components and the styling system
- Navigation and state management
- Performance optimization strategies
- Native module development
- Application publishing process

The new architecture (Fabric, TurboModules) continues to improve React Native's performance and developer experience, making it an excellent choice for mobile application development.

## Further Reading

### Official Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [New Architecture Working Group](https://github.com/reactwg/react-native-new-architecture)

### Popular Libraries

- **State Management**: Zustand, Redux Toolkit, Jotai
- **Data Fetching**: TanStack Query, SWR
- **UI Components**: React Native Paper, NativeBase, Tamagui
- **Navigation**: React Navigation, Expo Router
- **Forms**: React Hook Form, Formik
- **Testing**: Jest, React Native Testing Library, Detox

### Development Tools

- **Expo**: Simplified development and deployment platform
- **Flipper**: Debugging and profiling tool
- **Reactotron**: Desktop app for inspecting React Native apps
- **React DevTools**: Component hierarchy and state inspection
