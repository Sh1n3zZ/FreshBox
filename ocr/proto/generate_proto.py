import os
import sys
import subprocess

def generate_proto():
    """
    生成Python版本的proto文件
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    proto_file = os.path.join(current_dir, 'ocr_service.proto')
    
    # 检查protoc是否安装
    try:
        subprocess.run(['protoc', '--version'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except (subprocess.SubprocessError, FileNotFoundError):
        print("错误: protoc 未安装或不在PATH中。请安装 Protocol Buffers 编译器。")
        print("安装指南: https://grpc.io/docs/protoc-installation/")
        sys.exit(1)
    
    # 生成Python代码
    cmd = [
        'python', '-m', 'grpc_tools.protoc',
        f'--proto_path={current_dir}',
        f'--python_out={current_dir}',
        f'--grpc_python_out={current_dir}',
        proto_file
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"成功生成proto文件: {os.path.basename(proto_file)}")
        
        # 修复导入路径
        pb2_file = os.path.join(current_dir, 'ocr_service_pb2.py')
        pb2_grpc_file = os.path.join(current_dir, 'ocr_service_pb2_grpc.py')
        
        # 读取 pb2_grpc_file 文件内容
        with open(pb2_grpc_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修改导入语句
        content = content.replace(
            'import ocr_service_pb2 as ocr__service__pb2',
            'from proto import ocr_service_pb2 as ocr__service__pb2'
        )
        
        # 写回文件
        with open(pb2_grpc_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("修复导入路径完成")
        
    except subprocess.SubprocessError as e:
        print(f"生成proto文件失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    generate_proto()
