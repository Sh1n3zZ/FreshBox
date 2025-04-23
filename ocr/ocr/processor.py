import io
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2
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
        
    def preprocess_image(self, image: np.ndarray, preprocess_type: str = "auto") -> np.ndarray:
        """
        图像预处理
        
        Args:
            image: 输入图像的numpy数组
            preprocess_type: 预处理类型，可选值有:
                - "auto": 自动选择预处理方法
                - "basic": 基础预处理（灰度化、锐化、对比度增强）
                - "text": 针对文本优化的预处理
                - "document": 针对文档优化的预处理
                - "none": 不进行预处理
        
        Returns:
            预处理后的图像numpy数组
        """
        if preprocess_type == "none":
            return image
            
        # 转换为PIL图像便于处理
        pil_image = Image.fromarray(image)
        
        if preprocess_type == "basic" or preprocess_type == "auto":
            # 基础处理：灰度化、对比度增强、锐化
            pil_image = pil_image.convert("L")  # 灰度化
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(2.0)  # 增强对比度
            pil_image = pil_image.filter(ImageFilter.SHARPEN)  # 锐化
            
        elif preprocess_type == "text":
            # 文本优化：灰度化、自适应阈值处理、降噪
            # 使用OpenCV进行处理
            img_cv = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            # 高斯自适应阈值
            img_cv = cv2.adaptiveThreshold(
                img_cv, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            # 中值滤波去噪
            img_cv = cv2.medianBlur(img_cv, 3)
            return img_cv
            
        elif preprocess_type == "document":
            # 文档优化：透视矫正、二值化、降噪
            # 转换为OpenCV格式
            img_cv = np.array(pil_image)
            if len(img_cv.shape) == 3:
                img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2GRAY)
                
            # 二值化
            _, binary = cv2.threshold(img_cv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 腐蚀和膨胀操作减少噪点
            kernel = np.ones((2, 2), np.uint8)
            binary = cv2.erode(binary, kernel, iterations=1)
            binary = cv2.dilate(binary, kernel, iterations=1)
            
            # 尝试进行倾斜校正
            try:
                coords = np.column_stack(np.where(binary > 0))
                angle = cv2.minAreaRect(coords)[-1]
                
                # 如果角度小于-45度，加上90度
                if angle < -45:
                    angle = 90 + angle
                
                # 只有当倾斜角度明显时才进行校正
                if abs(angle) > 0.5:
                    (h, w) = img_cv.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    binary = cv2.warpAffine(binary, M, (w, h), 
                                          flags=cv2.INTER_CUBIC, 
                                          borderMode=cv2.BORDER_REPLICATE)
            except:
                # 忽略倾斜校正错误
                logger.warning("倾斜校正失败，使用原图像")
                
            return binary
        
        # 将PIL图像转回numpy数组
        return np.array(pil_image)
        
    def process_image(self, image_data: bytes, image_format: str = "jpg", auto_rotate: bool = False, preprocess_type: str = "auto") -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        处理单个图像
        
        Args:
            image_data: 图像二进制数据
            image_format: 图像格式
            auto_rotate: 是否自动旋转
            preprocess_type: 预处理类型
            
        Returns:
            (success, error_message, text_blocks)
        """
        try:
            # 将二进制数据转换为PIL图像
            image = Image.open(io.BytesIO(image_data))
            
            # 转换为numpy数组
            img_array = np.array(image)
            
            # 进行图像预处理
            preprocessed_image = self.preprocess_image(img_array, preprocess_type)
            
            # 使用CnOCR处理图像
            ocr_result = self.ocr.ocr(preprocessed_image)
            
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
            image_requests: 图像请求列表，每个请求包含image_data, image_format, auto_rotate, preprocess_type
            
        Returns:
            处理结果列表
        """
        results = []
        for req in image_requests:
            image_data = req.get("image_data", b"")
            image_format = req.get("image_format", "jpg")
            auto_rotate = req.get("auto_rotate", False)
            preprocess_type = req.get("preprocess_type", "auto")
            
            result = self.process_image(image_data, image_format, auto_rotate, preprocess_type)
            results.append(result)
            
        return results
