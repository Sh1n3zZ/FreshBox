import logging
import grpc
from concurrent import futures
from typing import Dict, Any

from ocr import OCRProcessor
from proto import ocr_service_pb2, ocr_service_pb2_grpc

logger = logging.getLogger(__name__)

class OCRServicer(ocr_service_pb2_grpc.OCRServiceServicer):
    def __init__(self, ocr_config: Dict[str, Any] = None):
        self.ocr_processor = OCRProcessor(ocr_config)
        logger.info("OCR服务初始化完成")
    
    def ProcessImage(self, request, context):
        """处理单个图像请求"""
        logger.info("接收到单图像OCR请求")
        
        # 从请求中提取参数
        image_data = request.image_data
        image_format = request.image_format
        auto_rotate = request.auto_rotate
        
        # 处理图像
        success, error_message, text_blocks = self.ocr_processor.process_image(
            image_data, image_format, auto_rotate
        )
        
        # 构建响应
        response = ocr_service_pb2.OCRResponse(
            success=success,
            error_message=error_message
        )
        
        # 添加文本块
        for block in text_blocks:
            text_block = ocr_service_pb2.TextBlock(
                text=block["text"],
                confidence=block["confidence"]
            )
            
            # 添加边界框
            box = ocr_service_pb2.BoundingBox(
                x1=block["box"]["x1"],
                y1=block["box"]["y1"],
                x2=block["box"]["x2"],
                y2=block["box"]["y2"],
                x3=block["box"]["x3"],
                y3=block["box"]["y3"],
                x4=block["box"]["x4"],
                y4=block["box"]["y4"]
            )
            text_block.box.CopyFrom(box)
            
            response.text_blocks.append(text_block)
        
        return response
    
    def ProcessBatchImages(self, request, context):
        """处理批量图像请求"""
        logger.info(f"接收到批量图像OCR请求，共{len(request.images)}张图像")
        
        # 构建图像请求列表
        image_requests = []
        for img_req in request.images:
            image_request = {
                "image_data": img_req.image_data,
                "image_format": img_req.image_format,
                "auto_rotate": img_req.auto_rotate
            }
            image_requests.append(image_request)
        
        # 批量处理图像
        batch_results = self.ocr_processor.process_batch_images(image_requests)
        
        # 构建响应
        response = ocr_service_pb2.BatchOCRResponse(
            success=all(result[0] for result in batch_results),
            error_message=""
        )
        
        # 添加每个图像的处理结果
        for success, error_message, text_blocks in batch_results:
            batch_result = ocr_service_pb2.BatchResult(
                success=success,
                error_message=error_message
            )
            
            # 添加文本块
            for block in text_blocks:
                text_block = ocr_service_pb2.TextBlock(
                    text=block["text"],
                    confidence=block["confidence"]
                )
                
                # 添加边界框
                box = ocr_service_pb2.BoundingBox(
                    x1=block["box"]["x1"],
                    y1=block["box"]["y1"],
                    x2=block["box"]["x2"],
                    y2=block["box"]["y2"],
                    x3=block["box"]["x3"],
                    y3=block["box"]["y3"],
                    x4=block["box"]["x4"],
                    y4=block["box"]["y4"]
                )
                text_block.box.CopyFrom(box)
                
                batch_result.text_blocks.append(text_block)
            
            response.results.append(batch_result)
        
        return response


class OCRServer:
    def __init__(self, port: int = 50051, max_workers: int = 10, ocr_config: Dict[str, Any] = None):
        """
        初始化OCR服务器
        
        Args:
            port: 服务器端口
            max_workers: 最大工作线程数
            ocr_config: OCR配置
        """
        self.port = port
        self.max_workers = max_workers
        self.ocr_config = ocr_config
        self.server = None
        
    def start(self):
        """启动gRPC服务器"""
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=self.max_workers))
        ocr_service_pb2_grpc.add_OCRServiceServicer_to_server(
            OCRServicer(self.ocr_config), self.server
        )
        self.server.add_insecure_port(f'[::]:{self.port}')
        self.server.start()
        logger.info(f"OCR服务器启动成功，监听端口: {self.port}")
        
    def stop(self, grace: int = 5):
        """停止gRPC服务器"""
        if self.server:
            self.server.stop(grace)
            logger.info("OCR服务器已停止")
    
    def wait_for_termination(self):
        """等待服务器终止"""
        if self.server:
            self.server.wait_for_termination()
            logger.info("OCR服务器已终止")
