import os
import torch
import numpy as np
import faiss
from flask import Flask, request, jsonify
from PIL import Image
from model_loader import load_trained_model, DEVICE

os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
app = Flask(__name__)

# --- CẤU HÌNH ĐƯỜNG DẪN ---
CHECKPOINT_DIR = "./checkpoints"
FAISS_INDEX_PATH = "./faiss_index/movie_index.bin"
MAPPING_PATH = "./faiss_index/movie_mapping.npy"

# --- LOAD MODEL ---
model, processor = load_trained_model(CHECKPOINT_DIR)

# --- KHỞI TẠO / LOAD FAISS ---
vector_dim = model.projection_dim

if os.path.exists(FAISS_INDEX_PATH):
    print(f"Đang load Faiss Index từ disk (dim={vector_dim})...")
    index = faiss.read_index(FAISS_INDEX_PATH)
    if os.path.exists(MAPPING_PATH):
        id_mapping = np.load(MAPPING_PATH).tolist()
    else:
        id_mapping = []
else:
    print(f"Tạo mới Faiss Index (dim={vector_dim})...")
    index = faiss.IndexFlatIP(vector_dim)
    id_mapping = []

# --- HÀM HỖ TRỢ ---
def get_image_embedding(image):
    inputs = processor(images=image, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        img = model.get_image_features(**inputs)
        img = img / img.norm(dim=-1, keepdim=True)
    return img.cpu().numpy()

def get_text_embedding(text):
    inputs = processor(text=[text], padding=True, truncation=True, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        txt = model.get_text_features(**inputs)
        txt = txt / txt.norm(dim=-1, keepdim=True)
    return txt.cpu().numpy()

def save_faiss():
    faiss.write_index(index, FAISS_INDEX_PATH)
    np.save(MAPPING_PATH, np.array(id_mapping))


@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "message": "AI Service (CLIP) is running"}), 200


@app.route('/api/add_movie', methods=['POST'])
def add_movie():
    try:
        movie_id = request.form.get('movie_id')
        overview = request.form.get('overview', '')

        if 'poster' not in request.files:
            return jsonify({"error": "No poster file provided"}), 400

        file = request.files['poster']
        image = Image.open(file).convert("RGB")

        img_vec = get_image_embedding(image)

        if overview.strip():
            txt_vec = get_text_embedding(overview)
            final_vec = (img_vec + txt_vec) / 2
            final_vec = final_vec / np.linalg.norm(final_vec, axis=1, keepdims=True)
        else:
            final_vec = img_vec

        final_vec = final_vec.astype('float32')
        faiss.normalize_L2(final_vec)

        index.add(final_vec)
        id_mapping.append(int(movie_id))

        save_faiss()

        return jsonify({"status": "success", "movie_id": movie_id}), 200

    except Exception as e:
        print("Error adding movie:", e)
        return jsonify({"error": str(e)}), 500


# ================= NGƯỠNG MỚI =================
MIN_THRESHOLD = 0.6   # <<< CHỈ THAY ĐỔI DÒNG NÀY


@app.route('/api/search_by_image', methods=['POST'])
def search_by_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files['image']
        image = Image.open(file).convert("RGB")

        top_k = int(request.form.get('top_k', 10))

        query_vec = get_image_embedding(image).astype('float32')

        scores, indices = index.search(query_vec, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if score < MIN_THRESHOLD:
                continue

            if idx != -1 and idx < len(id_mapping):
                results.append({
                    "movie_id": int(id_mapping[idx]),
                    "score": float(score)
                })

        if not results:
            return jsonify({
                "status": "success",
                "results": [],
                "message": "Không tìm thấy phim nào đủ giống"
            }), 200

        return jsonify({"status": "success", "results": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/search_by_text', methods=['POST'])
def search_by_text_api():
    try:
        data = request.json
        query = data.get('query', '')
        top_k = data.get('top_k', 5)

        if not query:
            return jsonify({"error": "No query provided"}), 400

        text_vec = get_text_embedding(query).astype('float32')
        scores, indices = index.search(text_vec, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if score < MIN_THRESHOLD:
                continue

            if idx != -1 and idx < len(id_mapping):
                results.append({
                    "movie_id": int(id_mapping[idx]),
                    "score": float(score)
                })

        return jsonify({"status": "success", "results": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    if not os.path.exists("./faiss_index"):
        os.makedirs("./faiss_index")

    app.run(host='0.0.0.0', port=5000, debug=True)
