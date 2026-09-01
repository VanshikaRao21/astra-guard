import os
import cv2
import numpy as np

def create_mock_sequence(base_dir, seq_name, num_frames=60, width=640, height=480):
    seq_dir = os.path.join(base_dir, seq_name)
    images_dir = os.path.join(seq_dir, 'images')
    labels_dir = os.path.join(seq_dir, 'labels')
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    # Object starting position
    x, y = 100, 100
    vx, vy = 5, 3
    box_w, box_h = 20, 20

    for i in range(num_frames):
        # Create a black image
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Add some noise/stars
        noise = np.random.randint(0, 50, (height, width, 3), dtype=np.uint8)
        img = cv2.add(img, noise)
        
        # Draw the object as a white rectangle
        cv2.rectangle(img, (int(x - box_w/2), int(y - box_h/2)), (int(x + box_w/2), int(y + box_h/2)), (255, 255, 255), -1)
        
        # Save image
        img_name = f"{i:04d}.jpg"
        cv2.imwrite(os.path.join(images_dir, img_name), img)
        
        # Save YOLO annotation
        # class_id x_center y_center width height
        x_center_norm = x / width
        y_center_norm = y / height
        w_norm = box_w / width
        h_norm = box_h / height
        
        label_name = f"{i:04d}.txt"
        with open(os.path.join(labels_dir, label_name), 'w') as f:
            f.write(f"0 {x_center_norm:.6f} {y_center_norm:.6f} {w_norm:.6f} {h_norm:.6f}\n")
            
        # Update position for next frame
        x += vx
        y += vy

if __name__ == "__main__":
    create_mock_sequence("C:/Users/ADMIN/.gemini/antigravity/scratch/mock_MSOD", "sequence_01")
    print("Mock sequence generated.")
