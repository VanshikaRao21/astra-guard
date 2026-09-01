from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import glob
from typing import List

app = FastAPI(title="ASTRA-GUARD Phase 1 MVP")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = os.getenv("MSOD_DATASET_PATH", "D:/Smod/MSOD")

class TrackletFrame(BaseModel):
    frame_number: int
    object_id: int
    bounding_box: List[float] # [x_min, y_min, x_max, y_max]
    center_x: float
    center_y: float
    confidence: float

@app.get("/optical-track/{sequence_id}", response_model=List[TrackletFrame])
def get_optical_track(sequence_id: str):
    seq_dir = os.path.join(DATASET_PATH, sequence_id)
    images_dir = os.path.join(seq_dir, "images")
    labels_dir = os.path.join(seq_dir, "labels")

    if not os.path.exists(seq_dir):
        raise HTTPException(status_code=404, detail=f"Sequence {sequence_id} not found in {DATASET_PATH}")
    
    if not os.path.exists(images_dir) or not os.path.exists(labels_dir):
        raise HTTPException(status_code=404, detail=f"Sequence {sequence_id} missing images or labels directory")

    label_files = sorted(glob.glob(os.path.join(labels_dir, "*.txt")))
    
    # We also need image dimensions to convert YOLO normalized coords to pixel coords
    # Instead of reading every image, we'll read the first one to get dimensions, 
    # assuming all frames in a sequence have the same dimensions.
    image_files = sorted(glob.glob(os.path.join(images_dir, "*.jpg")) + glob.glob(os.path.join(images_dir, "*.png")))
    if not image_files:
        raise HTTPException(status_code=404, detail="No images found to determine dimensions")

    try:
        import cv2
        first_img = cv2.imread(image_files[0])
        img_h, img_w = first_img.shape[:2]
    except Exception as e:
        # Fallback to standard dimensions if cv2 fails or isn't available
        img_w, img_h = 640, 480
        print(f"Failed to read image dimensions: {e}. Using default {img_w}x{img_h}")

    tracklet = []
    
    for i, label_file in enumerate(label_files):
        try:
            with open(label_file, "r") as f:
                lines = f.readlines()
            
            # Extract frame number from filename (e.g. 0001.txt -> 1)
            filename = os.path.basename(label_file)
            frame_num = int(os.path.splitext(filename)[0])
            
            for line_idx, line in enumerate(lines):
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    x_center_norm = float(parts[1])
                    y_center_norm = float(parts[2])
                    w_norm = float(parts[3])
                    h_norm = float(parts[4])
                    confidence = float(parts[5]) if len(parts) > 5 else 1.0

                    # Convert to pixel coordinates
                    center_x = x_center_norm * img_w
                    center_y = y_center_norm * img_h
                    w = w_norm * img_w
                    h = h_norm * img_h

                    x_min = center_x - w / 2
                    y_min = center_y - h / 2
                    x_max = center_x + w / 2
                    y_max = center_y + h / 2

                    tracklet.append(TrackletFrame(
                        frame_number=frame_num,
                        object_id=class_id, # Simplified object ID using class ID for now
                        bounding_box=[x_min, y_min, x_max, y_max],
                        center_x=center_x,
                        center_y=center_y,
                        confidence=confidence
                    ))
        except Exception as e:
            print(f"Error processing {label_file}: {e}")

    return tracklet

# Serve static images so frontend can access them
from fastapi.staticfiles import StaticFiles
app.mount("/dataset", StaticFiles(directory=DATASET_PATH), name="dataset")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
