import os
import sys

# 检查是否存在生成的proto文件
current_dir = os.path.dirname(os.path.abspath(__file__))
pb2_file = os.path.join(current_dir, 'ocr_service_pb2.py')
pb2_grpc_file = os.path.join(current_dir, 'ocr_service_pb2_grpc.py')

if not (os.path.exists(pb2_file) and os.path.exists(pb2_grpc_file)):
    # 如果文件不存在，则提示用户生成
    print("警告: proto文件未生成。请运行以下命令生成:")
    print("python -m proto.generate_proto")
    
    # 尝试自动生成
    try:
        from proto.generate_proto import generate_proto
        generate_proto()
    except ImportError:
        print("无法自动生成proto文件，请手动运行上述命令")

# 导入proto文件
try:
    from proto import ocr_service_pb2, ocr_service_pb2_grpc
    __all__ = ['ocr_service_pb2', 'ocr_service_pb2_grpc']
except ImportError:
    print("错误: 无法导入proto模块。请确保正确生成了proto文件")
    __all__ = [] 