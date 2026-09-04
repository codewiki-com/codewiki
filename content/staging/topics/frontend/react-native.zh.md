---
title: React Native 移动应用开发指南
description: 掌握React Native框架，使用React构建原生移动应用
track: frontend
section: react
difficulty: intermediate
tags:
  - React Native
  - 移动开发
  - 跨平台
  - iOS
  - Android
status: imported
origin: old/src/content/docs/frontend/react-native.zh.md
divergence: 0.186
issues: []
legacy:
  category: Frontend
  subcategory: Mobile
  order: 29
  lastUpdated: 2026-01-07
---

React Native 是由 Meta（原 Facebook）开发的开源移动应用开发框架，允许开发者使用 JavaScript 和 React 来构建真正的原生移动应用。自 2015 年发布以来，React Native 已成为跨平台移动开发的主流选择之一。

## 跨平台开发方案对比

在选择移动开发技术栈时，了解各种方案的特点至关重要。

### React Native vs Flutter vs 原生开发

| 特性 | React Native | Flutter | 原生开发 |
|------|-------------|---------|----------|
| 开发语言 | JavaScript/TypeScript | Dart | Swift/Kotlin |
| 渲染方式 | 原生组件 | 自绘引擎 | 原生组件 |
| 学习曲线 | 中等（熟悉 React 则较低） | 中等 | 较陡（需学两套） |
| 性能 | 接近原生 | 接近原生 | 最佳 |
| 热重载 | 支持 | 支持 | 部分支持 |
| 社区生态 | 成熟丰富 | 快速增长 | 各平台独立 |
| 代码复用率 | 80-90% | 90-95% | 0% |

### 选择建议

**选择 React Native 当：**
- 团队有 React/JavaScript 经验
- 需要快速迭代和热重载
- 希望复用 Web 开发经验
- 需要访问大量第三方库

**选择 Flutter 当：**
- 追求高度一致的 UI 设计
- 需要复杂的动画效果
- 愿意学习 Dart 语言
- 对性能有较高要求

**选择原生开发当：**
- 应用性能是首要考虑
- 需要深度平台集成
- 有充足的开发资源
- 应用功能相对简单

## 环境配置与项目创建

### 环境要求

开始 React Native 开发前，需要配置开发环境：

```bash
# 检查 Node.js 版本（需要 18 或更高）
node --version

# 安装 React Native CLI
npm install -g react-native-cli

# macOS 用户需要安装 Watchman
brew install watchman

# iOS 开发需要 Xcode（仅 macOS）
xcode-select --install

# Android 开发需要 Android Studio 和 JDK
# 配置 ANDROID_HOME 环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 创建新项目

React Native 提供多种项目创建方式：

```bash
# 使用官方 CLI 创建项目
npx react-native init MyApp

# 使用 TypeScript 模板
npx react-native init MyApp --template react-native-template-typescript

# 使用 Expo（推荐初学者）
npx create-expo-app MyApp
cd MyApp
npx expo start
```

### 项目结构

```
MyApp/
├── android/           # Android 原生代码
├── ios/               # iOS 原生代码
├── src/               # 源代码目录
│   ├── components/    # 可复用组件
│   ├── screens/       # 页面组件
│   ├── navigation/    # 导航配置
│   ├── services/      # API 服务
│   ├── store/         # 状态管理
│   └── utils/         # 工具函数
├── App.tsx            # 应用入口
├── package.json       # 依赖配置
├── metro.config.js    # Metro 打包配置
└── babel.config.js    # Babel 配置
```

### 运行项目

```bash
# 启动 Metro 打包服务
npx react-native start

# 运行 iOS 应用（仅 macOS）
npx react-native run-ios

# 运行 Android 应用
npx react-native run-android

# 指定设备或模拟器
npx react-native run-ios --simulator="iPhone 15 Pro"
npx react-native run-android --deviceId="emulator-5554"
```

## 核心组件详解

React Native 提供了一系列核心组件，映射到对应平台的原生视图。

### View 组件

`View` 是最基础的容器组件，类似于 HTML 的 `div`：

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const ViewExample = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* 基础容器 */}
        <View style={styles.box}>
          <View style={styles.innerBox} />
        </View>

        {/* 使用 flex 布局 */}
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

### Text 组件

`Text` 用于显示文本内容，支持嵌套和样式继承：

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TextExample = () => {
  return (
    <View style={styles.container}>
      {/* 基础文本 */}
      <Text style={styles.title}>React Native 文本组件</Text>

      {/* 嵌套文本（样式继承） */}
      <Text style={styles.paragraph}>
        这是一段普通文本，其中包含
        <Text style={styles.bold}>粗体</Text>和
        <Text style={styles.italic}>斜体</Text>以及
        <Text style={styles.link} onPress={() => console.log('链接被点击')}>
          可点击的链接
        </Text>
        。
      </Text>

      {/* 多行文本限制 */}
      <Text numberOfLines={2} ellipsizeMode="tail" style={styles.paragraph}>
        这是一段很长的文本，当超过指定行数时会自动截断并显示省略号。
        React Native 的 Text 组件提供了丰富的文本处理功能。
      </Text>

      {/* 可选择的文本 */}
      <Text selectable style={styles.paragraph}>
        长按可以选择这段文本进行复制
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

### Image 组件

`Image` 组件用于显示图片，支持本地和网络资源：

```jsx
import React from 'react';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';

const ImageExample = () => {
  return (
    <View style={styles.container}>
      {/* 本地图片 */}
      <Image
        source={require('./assets/logo.png')}
        style={styles.localImage}
      />

      {/* 网络图片（必须指定尺寸） */}
      <Image
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        style={styles.networkImage}
        resizeMode="contain"
      />

      {/* 带加载状态的图片 */}
      <Image
        source={{ uri: 'https://example.com/large-image.jpg' }}
        style={styles.largeImage}
        loadingIndicatorSource={require('./assets/placeholder.png')}
        onLoadStart={() => console.log('开始加载')}
        onLoadEnd={() => console.log('加载完成')}
        onError={(error) => console.log('加载失败', error)}
      />

      {/* 背景图片 */}
      <ImageBackground
        source={{ uri: 'https://example.com/background.jpg' }}
        style={styles.backgroundImage}
        imageStyle={{ borderRadius: 10 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>覆盖在图片上的内容</Text>
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

### ScrollView 与 FlatList

处理滚动内容的两个核心组件：

```jsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl
} from 'react-native';

// ScrollView - 适用于少量内容
const ScrollViewExample = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
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
          <Text style={styles.itemText}>项目 {item}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// FlatList - 适用于大量数据（虚拟化列表）
const FlatListExample = () => {
  const data = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    title: `列表项 ${i + 1}`,
  }));

  const renderItem = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemText}>{item.title}</Text>
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerText}>列表头部</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text>暂无数据</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      // 性能优化配置
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // 滚动事件
      onEndReached={() => console.log('到达底部')}
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
```

### TextInput 组件

用于接收用户输入：

```jsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TextInputExample = () => {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [multiline, setMultiline] = useState('');

  return (
    <View style={styles.container}>
      {/* 基础输入框 */}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="请输入内容"
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />

      {/* 密码输入框 */}
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="请输入密码"
        secureTextEntry
        autoComplete="password"
      />

      {/* 多行输入框 */}
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={multiline}
        onChangeText={setMultiline}
        placeholder="请输入多行内容"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* 带验证的输入框 */}
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="请输入邮箱"
        onSubmitEditing={() => console.log('提交')}
        returnKeyType="done"
      />

      {/* 数字输入框 */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="请输入数字"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>提交</Text>
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

## 样式与布局

React Native 使用 JavaScript 对象定义样式，布局系统基于 Flexbox。

### StyleSheet API

```jsx
import { StyleSheet } from 'react-native';

// 创建样式表（推荐方式）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // 组合样式
  text: {
    fontSize: 16,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

// 使用样式
<View style={styles.container}>
  <Text style={[styles.text, styles.boldText]}>组合样式</Text>
  <Text style={[styles.text, { color: 'red' }]}>动态样式</Text>
</View>

// 常用 StyleSheet 方法
StyleSheet.hairlineWidth;  // 最细线宽（1像素）
StyleSheet.absoluteFill;   // 绝对定位填充
StyleSheet.flatten(styles.container);  // 展平样式数组
```

### Flexbox 布局系统

React Native 的 Flexbox 与 Web 版本略有不同，默认 `flexDirection` 为 `column`：

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FlexboxExample = () => {
  return (
    <View style={styles.container}>
      {/* 主轴方向 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flexDirection: row</Text>
        <View style={[styles.box, { flexDirection: 'row' }]}>
          <View style={[styles.item, { backgroundColor: '#e74c3c' }]} />
          <View style={[styles.item, { backgroundColor: '#3498db' }]} />
          <View style={[styles.item, { backgroundColor: '#2ecc71' }]} />
        </View>
      </View>

      {/* 主轴对齐 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>justifyContent</Text>
        <View style={[styles.box, {
          flexDirection: 'row',
          justifyContent: 'space-between'
        }]}>
          <View style={[styles.item, { backgroundColor: '#9b59b6' }]} />
          <View style={[styles.item, { backgroundColor: '#f39c12' }]} />
          <View style={[styles.item, { backgroundColor: '#1abc9c' }]} />
        </View>
      </View>

      {/* 交叉轴对齐 */}
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

      {/* flex 比例 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flex 比例分配</Text>
        <View style={[styles.box, { flexDirection: 'row' }]}>
          <View style={[styles.item, { flex: 1, backgroundColor: '#e74c3c' }]} />
          <View style={[styles.item, { flex: 2, backgroundColor: '#3498db' }]} />
          <View style={[styles.item, { flex: 1, backgroundColor: '#2ecc71' }]} />
        </View>
      </View>

      {/* flexWrap 换行 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flexWrap: wrap</Text>
        <View style={[styles.box, {
          flexDirection: 'row',
          flexWrap: 'wrap'
        }]}>
          {[1,2,3,4,5,6].map(i => (
            <View key={i} style={[styles.wrapItem]} />
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

### 响应式设计

```jsx
import { Dimensions, Platform, PixelRatio, useWindowDimensions } from 'react-native';

// 获取屏幕尺寸
const { width, height } = Dimensions.get('window');

// 使用 Hook（推荐，支持屏幕旋转）
const ResponsiveComponent = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={[
      styles.container,
      isLandscape && styles.landscapeContainer
    ]}>
      {/* 内容 */}
    </View>
  );
};

// 平台特定样式
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

// 像素密度适配
const normalize = (size) => {
  const scale = width / 375; // 基于 iPhone 8 宽度
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
```

## 导航系统（React Navigation）

React Navigation 是 React Native 最流行的导航库。

### 安装与配置

```bash
# 安装核心依赖
npm install @react-navigation/native

# 安装必要的依赖
npm install react-native-screens react-native-safe-area-context

# 安装导航器
npm install @react-navigation/native-stack  # 原生栈导航
npm install @react-navigation/bottom-tabs   # 底部标签导航
npm install @react-navigation/drawer        # 抽屉导航
```

### 基础栈导航

```jsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 定义类型（TypeScript）
type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number; title: string };
  Profile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 首页
function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>首页</Text>
      <Button
        title="查看详情"
        onPress={() => navigation.navigate('Details', {
          itemId: 42,
          title: '商品详情'
        })}
      />
      <Button
        title="个人中心"
        onPress={() => navigation.navigate('Profile', {
          userId: 'user123'
        })}
      />
    </View>
  );
}

// 详情页
function DetailsScreen({ route, navigation }) {
  const { itemId, title } = route.params;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text>Item ID: {itemId}</Text>
      <Button
        title="返回"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="返回首页"
        onPress={() => navigation.popToTop()}
      />
    </View>
  );
}

// 个人中心
function ProfileScreen({ route }) {
  const { userId } = route.params;
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>用户: {userId}</Text>
    </View>
  );
}

// 应用入口
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
          options={{ title: '首页' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={({ route }) => ({ title: route.params.title })}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: '个人中心' }}
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

### 标签导航与嵌套

```jsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// 首页栈
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: '首页' }} />
      <HomeStack.Screen name="Details" component={DetailsScreen} options={{ title: '详情' }} />
    </HomeStack.Navigator>
  );
}

// 设置栈
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: '设置' }} />
      <SettingsStack.Screen name="About" component={AboutScreen} options={{ title: '关于' }} />
    </SettingsStack.Navigator>
  );
}

// 页面组件
function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>首页</Text>
      <Button
        title="查看详情"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>详情页</Text>
    </View>
  );
}

function SettingsScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>设置</Text>
      <Button
        title="关于我们"
        onPress={() => navigation.navigate('About')}
      />
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>关于</Text>
    </View>
  );
}

// 主应用
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
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
          options={{ tabBarLabel: '首页' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackScreen}
          options={{ tabBarLabel: '设置' }}
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

## 状态管理

React Native 支持多种状态管理方案。

### React Context + useReducer

```jsx
import React, { createContext, useContext, useReducer } from 'react';

// 定义状态类型
const initialState = {
  user: null,
  isLoading: false,
  error: null,
  cart: [],
};

// Action 类型
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload, error: null };
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ActionTypes.ADD_TO_CART:
      return { ...state, cart: [...state.cart, action.payload] };
    case ActionTypes.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };
    case ActionTypes.CLEAR_CART:
      return { ...state, cart: [] };
    default:
      return state;
  }
}

// 创建 Context
const AppContext = createContext();

// Provider 组件
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 封装 actions
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    addToCart: (item) => dispatch({ type: ActionTypes.ADD_TO_CART, payload: item }),
    removeFromCart: (id) => dispatch({ type: ActionTypes.REMOVE_FROM_CART, payload: id }),
    clearCart: () => dispatch({ type: ActionTypes.CLEAR_CART }),
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

// 自定义 Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// 使用示例
function CartScreen() {
  const { state, removeFromCart, clearCart } = useApp();

  return (
    <View>
      <Text>购物车 ({state.cart.length})</Text>
      {state.cart.map(item => (
        <View key={item.id}>
          <Text>{item.name}</Text>
          <Button
            title="移除"
            onPress={() => removeFromCart(item.id)}
          />
        </View>
      ))}
      <Button title="清空购物车" onPress={clearCart} />
    </View>
  );
}
```

### Zustand（推荐的轻量方案）

```jsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 创建 Store
const useStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      theme: 'light',
      cart: [],

      // Actions
      setUser: (user) => set({ user }),

      login: async (credentials) => {
        try {
          const response = await api.login(credentials);
          set({ user: response.user, token: response.token });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
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

      // 计算属性（使用 get）
      get cartTotal() {
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

// 组件中使用
function ProfileScreen() {
  const { user, logout, theme, toggleTheme } = useStore();

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <Text>{user?.name}</Text>
      <Button title="切换主题" onPress={toggleTheme} />
      <Button title="退出登录" onPress={logout} />
    </View>
  );
}

// 选择器优化（避免不必要的重渲染）
function CartBadge() {
  const cartCount = useStore((state) => state.cart.length);
  return <Text>{cartCount}</Text>;
}
```

## 原生模块与桥接

React Native 允许调用原生代码实现特定功能。

### 调用原生模块

```jsx
import { NativeModules, Platform } from 'react-native';

// 访问原生模块
const { CalendarModule, DeviceInfo } = NativeModules;

// 调用原生方法
async function createCalendarEvent(name, location) {
  try {
    const eventId = await CalendarModule.createCalendarEvent(name, location);
    console.log(`Event created with id: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// 获取设备信息
function getDeviceInfo() {
  return {
    brand: DeviceInfo.brand,
    model: DeviceInfo.model,
    systemVersion: DeviceInfo.systemVersion,
  };
}
```

### 创建原生模块（iOS - Swift）

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

### 创建原生模块（Android - Kotlin）

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
```

### Turbo Modules（新架构）

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
```

## 调试与性能优化

### 调试工具

```jsx
// 开发环境调试
if (__DEV__) {
  console.log('开发环境');
}

// React DevTools
// 使用 react-devtools 包进行组件调试

// Flipper 集成（推荐）
// 提供网络检查、日志、布局检查等功能

// 性能监控
import { PerformanceObserver } from 'react-native-performance';

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ['measure'] });
```

### 性能优化策略

```jsx
import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Image } from 'react-native';

// 1. 使用 memo 避免不必要的重渲染
const ListItem = memo(({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.item.id === nextProps.item.id;
});

// 2. 使用 useCallback 缓存回调函数
function ProductList({ products }) {
  const handlePress = useCallback((id) => {
    navigation.navigate('Details', { id });
  }, [navigation]);

  // 3. 使用 useMemo 缓存计算结果
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.price - b.price);
  }, [products]);

  // 4. FlatList 性能优化
  const renderItem = useCallback(({ item }) => (
    <ListItem item={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

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
      // 性能配置
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // 避免匿名函数
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

// 5. 图片优化
function OptimizedImage({ uri, style }) {
  return (
    <Image
      source={{ uri }}
      style={style}
      // 使用适当的尺寸
      resizeMode="cover"
      // 渐进式加载
      fadeDuration={300}
      // 缓存策略（iOS）
      cache="force-cache"
    />
  );
}

// 6. 避免在渲染中创建新对象
// 不好的做法
<View style={{ flex: 1, padding: 20 }}>

// 好的做法
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }
});
<View style={styles.container}>
```

### 内存管理

```jsx
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

function useMemoryManagement() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 监听应用状态变化
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 应用进入前台，可以刷新数据
        console.log('App came to foreground');
      }

      if (nextAppState === 'background') {
        // 应用进入后台，清理缓存
        console.log('App went to background');
        clearCache();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

// 清理定时器和订阅
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
```

## 应用发布

### iOS 发布流程

```bash
# 配置发布证书和描述文件
# 在 Apple Developer Portal 创建

# 配置 Xcode 项目
# - 设置 Bundle Identifier
# - 配置 Signing & Capabilities
# - 设置版本号和构建号

# 构建发布版本
cd ios
xcodebuild -workspace MyApp.xcworkspace \
  -scheme MyApp \
  -configuration Release \
  -archivePath build/MyApp.xcarchive \
  archive

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/MyApp.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist

# 上传到 App Store Connect
xcrun altool --upload-app \
  -f build/MyApp.ipa \
  -u "apple_id@example.com" \
  -p "@keychain:AC_PASSWORD"
```

### Android 发布流程

```bash
# 生成签名密钥
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 配置 gradle.properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****

# 配置 build.gradle
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

# 构建 AAB（推荐）或 APK
cd android
./gradlew bundleRelease  # AAB
./gradlew assembleRelease  # APK

# 上传到 Google Play Console
# 构建产物位于 android/app/build/outputs/bundle/release/
```

### 持续集成配置（GitHub Actions）

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
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Java
        uses: actions/setup-java@v3
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
        uses: actions/upload-artifact@v3
        with:
          name: android-release
          path: android/app/build/outputs/bundle/release/

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
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

## 面试要点

### 基础概念题

**Q1: React Native 的工作原理是什么？**

React Native 使用 JavaScript 线程运行 React 代码，通过 Bridge（桥接）与原生线程通信。新架构引入了 JSI（JavaScript Interface），实现同步调用原生代码，并使用 Fabric 渲染器和 Turbo Modules 提升性能。

**Q2: React Native 与 React 的主要区别？**

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

主要区别：
- 使用原生组件而非 DOM 元素
- 样式使用 JavaScript 对象而非 CSS
- 布局默认使用 Flexbox，且 flexDirection 默认为 column
- 事件处理器命名不同（onClick vs onPress）

### 组件与性能题

**Q3: 如何优化 FlatList 性能？**

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // 关键优化配置
  initialNumToRender={10}        // 首次渲染数量
  maxToRenderPerBatch={10}       // 每批渲染数量
  windowSize={5}                 // 渲染窗口大小
  removeClippedSubviews={true}   // 移除不可见子视图
  getItemLayout={getItemLayout}  // 预计算布局
  // 使用 memo 包装 renderItem
/>
```

**Q4: React Native 中如何处理不同屏幕尺寸？**

```jsx
import { Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';

function ResponsiveComponent() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  // 动态计算尺寸
  const fontSize = width * 0.04;

  // 像素密度适配
  const normalize = (size) => {
    const scale = width / 375;
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  };

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      <Text style={{ fontSize: normalize(16) }}>响应式文本</Text>
    </View>
  );
}
```

### 架构与原理题

**Q5: 解释 React Native 的新架构（Fabric + TurboModules）**

新架构的核心改进：

1. **JSI（JavaScript Interface）**：取代 Bridge 的异步通信，实现 JavaScript 与原生代码的同步调用。

2. **Fabric**：新的渲染系统，支持同步渲染和更好的优先级调度。

3. **TurboModules**：按需加载原生模块，减少启动时间。

4. **Codegen**：自动生成类型安全的原生代码绑定。

```jsx
// TurboModule 示例
import { TurboModuleRegistry } from 'react-native';

interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('Calculator');
const result = NativeModule.multiply(2, 3); // 同步调用
```

**Q6: 如何在 React Native 中处理深层链接（Deep Linking）？**

```jsx
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

// 处理链接
useEffect(() => {
  const handleDeepLink = ({ url }) => {
    // 解析并导航
  };

  Linking.addEventListener('url', handleDeepLink);

  // 检查初始 URL
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });

  return () => {
    Linking.removeEventListener('url', handleDeepLink);
  };
}, []);
```

### 实践经验题

**Q7: 如何处理 React Native 应用的离线状态？**

```jsx
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);

      if (state.isConnected && pendingActions.length > 0) {
        syncPendingActions();
      }
    });

    return unsubscribe;
  }, [pendingActions]);

  const queueAction = async (action) => {
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

**Q8: React Native 安全最佳实践？**

```jsx
// 1. 安全存储敏感数据
import * as Keychain from 'react-native-keychain';

async function storeCredentials(username, password) {
  await Keychain.setGenericPassword(username, password);
}

async function getCredentials() {
  const credentials = await Keychain.getGenericPassword();
  return credentials || null;
}

// 2. 证书固定（Certificate Pinning）
// 使用 react-native-ssl-pinning 库

// 3. 代码混淆（Android）
// 在 build.gradle 中启用 ProGuard
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android.txt')
    }
  }
}

// 4. 环境变量管理
// 使用 react-native-config
import Config from 'react-native-config';
const apiUrl = Config.API_URL;

// 5. 输入验证
function validateInput(input) {
  // 防止 XSS 和注入攻击
  const sanitized = input.replace(/<[^>]*>/g, '');
  return sanitized;
}
```

## 总结

React Native 作为跨平台移动开发的主流框架，具有以下核心优势：

1. **代码复用**：一套代码库同时支持 iOS 和 Android
2. **开发效率**：热重载、丰富的社区生态、Web 开发经验迁移
3. **原生性能**：渲染原生组件，接近原生应用体验
4. **灵活扩展**：支持原生模块集成，满足特定需求

掌握 React Native 开发需要理解：
- 核心组件和样式系统
- 导航和状态管理
- 性能优化策略
- 原生模块开发
- 应用发布流程

随着新架构（Fabric、TurboModules）的推进，React Native 的性能和开发体验将持续提升，是移动应用开发的优秀选择。
