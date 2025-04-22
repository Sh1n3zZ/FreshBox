import io
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image
from cnocr import CnOcr

logger = logging.getLogger(__name__)

class OCRProcessor:
    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化OCR处理器
        
        Args:
            config: OCR配置参数
        """
        self.config = config or {}
        # 初始化CnOCR模型
        self.ocr = CnOcr(**self.config)
        logger.info("OCR处理器初始化完成")
        
    def process_image(self, image_data: bytes, image_format: str = "jpg", auto_rotate: bool = False) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        处理单个图像
        
        Args:
            image_data: 图像二进制数据
            image_format: 图像格式
            auto_rotate: 是否自动旋转
            
        Returns:
            (success, error_message, text_blocks)
        """
        try:
            # 将二进制数据转换为PIL图像
            image = Image.open(io.BytesIO(image_data))
            
            # 转换为numpy数组
            img_array = np.array(image)
            
            # 使用CnOCR处理图像
            ocr_result = self.ocr.ocr(img_array)
            
            # 转换结果格式
            text_blocks = []
            for block in ocr_result:
                text_block = {
                    "text": block['text'],
                    "confidence": float(block['score']),
                    "box": {
                        "x1": float(block['position'][0][0]),
                        "y1": float(block['position'][0][1]),
                        "x2": float(block['position'][1][0]),
                        "y2": float(block['position'][1][1]),
                        "x3": float(block['position'][2][0]),
                        "y3": float(block['position'][2][1]),
                        "x4": float(block['position'][3][0]),
                        "y4": float(block['position'][3][1])
                    }
                }
                text_blocks.append(text_block)
                
            return True, "", text_blocks
            
        except Exception as e:
            logger.error(f"OCR处理失败: {str(e)}")
            return False, str(e), []
            
    def process_batch_images(self, image_requests: List[Dict[str, Any]]) -> List[Tuple[bool, str, List[Dict[str, Any]]]]:
        """
        批量处理图像
        
        Args:
            image_requests: 图像请求列表，每个请求包含image_data, image_format, auto_rotate
            
        Returns:
            处理结果列表
        """
        results = []
        for req in image_requests:
            image_data = req.get("image_data", b"")
            image_format = req.get("image_format", "jpg")
            auto_rotate = req.get("auto_rotate", False)
            
            result = self.process_image(image_data, image_format, auto_rotate)
            results.append(result)
            
        return results
