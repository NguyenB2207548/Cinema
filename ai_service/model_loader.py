import torch
import os
from transformers import CLIPProcessor, CLIPModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- Hàm khởi tạo và load model CLIP đã train ---
def load_trained_model(checkpoint_dir):
    print("🔄 Đang khởi tạo model CLIP...")
    
    # 1. Load Config để lấy tên model gốc
    config_path = os.path.join(checkpoint_dir, "config.pt")
    if os.path.exists(config_path):
        config = torch.load(config_path, map_location=DEVICE)
        model_name = config.get('model_name', "openai/clip-vit-base-patch32")
    else:
        model_name = "openai/clip-vit-base-patch32" # Fallback mặc định
        
    print(f"   - Base model: {model_name}")

    # 2. Khởi tạo Model & Processor chuẩn từ Hugging Face
    model = CLIPModel.from_pretrained(model_name).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(model_name)
    
    # 3. Load Weights cho Projection Layers (Phần bạn đã train)
    # Lưu ý: Các file .pt phải khớp tên với lúc lưu
    text_proj_path = os.path.join(checkpoint_dir, "text_proj.pt")
    image_proj_path = os.path.join(checkpoint_dir, "image_proj.pt")
    
    if os.path.exists(text_proj_path):
        print("   - Loading Text Projection weights...")
        model.text_projection.load_state_dict(torch.load(text_proj_path, map_location=DEVICE))
        
    if os.path.exists(image_proj_path):
        print("   - Loading Image Projection weights...")
        # Trong CLIPModel chuẩn, lớp này tên là visual_projection
        model.visual_projection.load_state_dict(torch.load(image_proj_path, map_location=DEVICE))
    
    model.eval() # Chuyển sang chế độ đánh giá (không train)
    print("✅ Model loaded successfully!")

    # Trả về model và processor (thay thế cho tokenizer/image_processor cũ)
    return model, processor