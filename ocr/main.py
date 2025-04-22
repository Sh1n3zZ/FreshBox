import os
import sys
import time
import signal
import argparse
import logging
from logging.handlers import RotatingFileHandler

from config import load_config
from server import OCRServer

# 设置日志格式
def setup_logging(config):
    log_level = getattr(logging, config["logging"]["level"].upper(), logging.INFO)
    log_format = config["logging"]["format"]
    log_file = config["logging"]["file"]
    
    # 创建日志格式器
    formatter = logging.Formatter(log_format)
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # 添加控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # 添加文件处理器
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    return root_logger

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='OCR服务')
    parser.add_argument('-c', '--config', help='配置文件路径')
    parser.add_argument('-p', '--port', type=int, help='服务端口')
    args = parser.parse_args()
    
    # 加载配置
    config = load_config(args.config)
    
    # 设置日志
    logger = setup_logging(config)
    
    # 如果命令行参数指定了端口，则覆盖配置
    if args.port:
        config["server"]["port"] = args.port
    
    # 创建并启动服务器
    server = OCRServer(
        port=config["server"]["port"],
        max_workers=config["server"]["max_workers"],
        ocr_config=config["ocr"]
    )
    
    # 注册信号处理函数，优雅关闭服务器
    def signal_handler(sig, frame):
        logger.info("接收到终止信号，正在关闭服务器...")
        server.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        logger.info("启动OCR服务器...")
        server.start()
        logger.info(f"OCR服务器已启动，监听端口: {config['server']['port']}")
        server.wait_for_termination()
    except Exception as e:
        logger.error(f"服务器出错: {str(e)}")
        server.stop()
        sys.exit(1)

if __name__ == "__main__":
    main()
