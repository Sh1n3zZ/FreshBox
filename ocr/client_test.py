import os
import argparse
import grpc

# 导入生成的gRPC模块
from proto import ocr_service_pb2, ocr_service_pb2_grpc

def test_process_image(stub, image_path):
    """
    测试单张图片OCR处理
    
    Args:
        stub: gRPC客户端存根
        image_path: 图片路径
    """
    print(f"测试图片: {image_path}")
    
    # 读取图片数据
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    # 获取图片格式
    _, ext = os.path.splitext(image_path)
    image_format = ext[1:].lower()  # 去掉点，转小写
    
    # 创建请求
    request = ocr_service_pb2.ImageRequest(
        image_data=image_data,
        image_format=image_format,
        auto_rotate=True
    )
    
    # 发送请求
    try:
        response = stub.ProcessImage(request)
        print(f"OCR结果: {'成功' if response.success else '失败'}")
        
        if response.success:
            print(f"识别到{len(response.text_blocks)}个文本块:")
            
            for i, block in enumerate(response.text_blocks):
                print(f"文本块 #{i+1}: {block.text} (置信度: {block.confidence:.4f})")
                box = block.box
                print(f"  位置: [({box.x1},{box.y1}), ({box.x2},{box.y2}), ({box.x3},{box.y3}), ({box.x4},{box.y4})]")
        else:
            print(f"错误信息: {response.error_message}")
            
    except grpc.RpcError as e:
        print(f"gRPC错误: {e.code()}: {e.details()}")

def main():
    parser = argparse.ArgumentParser(description="OCR客户端测试工具")
    parser.add_argument("--host", default="localhost", help="服务器主机名")
    parser.add_argument("--port", type=int, default=50051, help="服务器端口")
    parser.add_argument("--image", required=True, help="图片路径")
    args = parser.parse_args()
    
    # 创建gRPC通道
    channel = grpc.insecure_channel(f"{args.host}:{args.port}")
    
    # 创建存根
    stub = ocr_service_pb2_grpc.OCRServiceStub(channel)
    
    # 测试单张图片
    test_process_image(stub, args.image)
    
    # 关闭通道
    channel.close()

if __name__ == "__main__":
    main()
