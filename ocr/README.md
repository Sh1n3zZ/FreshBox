# FreshBox OCR Service

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10-3776AB.svg?style=flat&logo=python)](https://www.python.org/)
[![YOLOv5](https://img.shields.io/badge/YOLOv5-7.0-00FFFF.svg?style=flat)](https://github.com/ultralytics/yolov5)
[![gRPC](https://img.shields.io/badge/gRPC-1.54-244c5a.svg?style=flat&logo=google)](https://grpc.io/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.8-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org/)

</div>

> 🔍 FreshBox的OCR服务组件，基于YOLOv5和CnOCR，通过gRPC提供高性能的食品图像识别和文字识别服务。

## ✨ 特性

- 🎯 **精准识别**
  - 食品图像识别
  - 包装文字识别
  - 保质期识别
  - 多语言支持

- 🚀 **高性能**
  - GPU加速支持
  - 批量处理优化
  - 流式识别

- 🛠 **易扩展**
  - 模块化设计
  - 插件系统
  - 自定义预处理

## 目录结构

```
.
├── config/             # 配置相关
│   ├── __init__.py
│   └── settings.py
├── ocr/                # OCR处理相关
│   ├── __init__.py
│   └── processor.py
├── proto/              # gRPC协议相关
│   ├── __init__.py
│   ├── generate_proto.py
│   └── ocr_service.proto
├── server/             # gRPC服务器相关
│   ├── __init__.py
│   └── ocr_server.py
├── main.py             # 程序入口
├── requirements.txt    # 依赖项
└── README.md           # 说明文档
```

## 安装依赖

```bash
pip install -r requirements.txt
```

## 生成gRPC代码

```bash
python -m proto.generate_proto
```

## 启动服务

```bash
# 使用默认配置启动
python main.py

# 指定配置文件启动
python main.py --config config.json

# 指定端口启动
python main.py --port 8000
```

## 图像预处理功能

OCR服务提供了多种图像预处理方法，以提高OCR识别的准确性：

- **auto**: 自动选择预处理方法（默认）
- **basic**: 基础预处理（灰度化、对比度增强、锐化）
- **text**: 针对文本优化的预处理（灰度化、自适应阈值、降噪）
- **document**: 针对文档优化的预处理（透视矫正、二值化、降噪）
- **none**: 不进行预处理

在请求中可以通过`preprocess_type`参数指定预处理类型。

## 配置文件示例

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 50051,
    "max_workers": 10
  },
  "ocr": {
    "det_model_name": "db_resnet34",
    "rec_model_name": "densenet_lite_136-gru",
    "det_model_backend": "onnx",
    "rec_model_backend": "onnx",
    "context": "cpu"
  },
  "logging": {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "ocr_server.log"
  }
}
```

## 使用GPU加速

设置环境变量以使用GPU:

```bash
export USE_GPU=1
python main.py
```

## 与Golang交互

从Golang后端可以通过gRPC调用以下方法：

1. `ProcessImage`: 处理单个图像
2. `ProcessBatchImages`: 批量处理多个图像

## 测试客户端

提供了一个简单的测试客户端，可以用来测试OCR服务：

```bash
# 使用自动预处理
python client_test.py --image path/to/image.jpg

# 指定预处理类型
python client_test.py --image path/to/image.jpg --preprocess text

# 可用的预处理类型: auto, basic, text, document, none
``` 