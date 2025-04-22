import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# 默认配置
DEFAULT_CONFIG = {
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
        "context": "gpu" if os.environ.get("USE_GPU", "0") == "1" else "cpu"
    },
    "logging": {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        "file": "ocr_server.log"
    }
}

def load_config(config_file: str = None) -> Dict[str, Any]:
    """
    加载配置文件
    
    Args:
        config_file: 配置文件路径，如果为None则使用默认配置
        
    Returns:
        配置字典
    """
    config = DEFAULT_CONFIG.copy()
    
    if config_file and os.path.exists(config_file):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                
            # 递归更新配置
            def update_dict(d, u):
                for k, v in u.items():
                    if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                        update_dict(d[k], v)
                    else:
                        d[k] = v
            
            update_dict(config, user_config)
            logger.info(f"从{config_file}加载配置成功")
        except Exception as e:
            logger.error(f"加载配置文件失败: {str(e)}")
    
    return config 