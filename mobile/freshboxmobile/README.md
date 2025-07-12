# FreshBox Mobile

<div align="center">

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg?style=flat&logo=flutter)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.x-0175C2.svg?style=flat&logo=dart)](https://dart.dev/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green.svg?style=flat)]()

</div>

## 📱 功能特性

- 📦 盲盒浏览与购买
- 🎁 开盒动画效果
- 📷 OCR食品识别
- 🗺️ 配送追踪
- 👤 用户中心
- 🌙 深色模式

## 🚀 快速开始

```bash
# 确保Flutter环境正确设置
flutter doctor

# 获取依赖
flutter pub get

# 运行应用
flutter run

# 构建发布版本
flutter build apk  # Android
flutter build ios  # iOS
```

## 📱 支持平台

- Android 6.0 (API 23) 及以上
- iOS 12.0 及以上

## 🔧 环境配置

### Android 配置

1. 在 `android/app/build.gradle` 中配置应用信息：

```gradle
android {
    defaultConfig {
        applicationId "com.freshbox.app"
        minSdkVersion 23
        targetSdkVersion 33
    }
}
```

### iOS 配置

1. 在 `ios/Runner/Info.plist` 中添加必要的权限：

```xml
<key>NSCameraUsageDescription</key>
<string>需要使用相机进行食品识别</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册来选择图片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要获取位置信息用于配送服务</string>
```

## 📂 项目结构

```
lib/
├── api/           # API 服务
├── bloc/          # 状态管理
├── config/        # 配置文件
├── models/        # 数据模型
├── screens/       # 页面
├── services/      # 服务
├── utils/         # 工具类
└── widgets/       # UI组件
```

## 🔨 开发指南

### 架构说明

本项目采用 BLoC 模式进行状态管理：

```dart
// 示例: 盲盒状态管理
class BlindBoxBloc extends Bloc<BlindBoxEvent, BlindBoxState> {
    BlindBoxBloc() : super(BlindBoxInitial()) {
        on<LoadBlindBoxes>((event, emit) async {
            emit(BlindBoxLoading());
            try {
                final boxes = await repository.getBlindBoxes();
                emit(BlindBoxLoaded(boxes));
            } catch (e) {
                emit(BlindBoxError(e.toString()));
            }
        });
    }
}
```

### 主题配置

使用 Material 3 主题系统：

```dart
class MyApp extends StatelessWidget {
    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            theme: ThemeData(
                useMaterial3: true,
                colorScheme: lightColorScheme,
            ),
            darkTheme: ThemeData(
                useMaterial3: true,
                colorScheme: darkColorScheme,
            ),
            home: HomePage(),
        );
    }
}
```

## 🧪 测试

```bash
# 运行所有测试
flutter test

# 运行单个测试文件
flutter test test/widget_test.dart

# 运行集成测试
flutter drive --target=test_driver/app.dart
```

## 📦 发布

### Android

```bash
# 生成签名密钥
keytool -genkey -v -keystore android/app/key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key

# 构建发布版APK
flutter build apk --release
```

### iOS

```bash
# 构建发布版
flutter build ios --release

# 在Xcode中配置签名并上传到App Store
open ios/Runner.xcworkspace
```

## 🔍 故障排除

### 常见问题

1. Gradle构建失败
```bash
flutter clean
flutter pub get
cd android
./gradlew clean
```

2. iOS构建错误
```bash
cd ios
pod install --repo-update
```

## 📚 依赖项

主要依赖：

- `flutter_bloc`: ^8.0.0
- `dio`: ^5.0.0
- `get_it`: ^7.0.0
- `shared_preferences`: ^2.0.0
- `cached_network_image`: ^3.0.0
- `google_ml_kit`: ^1.0.0
- `geolocator`: ^9.0.0

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交Pull Request
