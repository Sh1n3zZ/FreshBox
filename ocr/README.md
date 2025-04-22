# OCR gRPC 服务

这是一个基于Python的OCR服务，使用gRPC与Golang后端通信。该服务使用CnOCR进行图像文字识别处理。

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