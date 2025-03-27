import pandas as pd
import json

# Đọc dữ liệu từ file CSV
file_path = "project_heart_disease.csv"
df = pd.read_csv(file_path)

# Chuẩn hóa tên cột để tránh lỗi khoảng trắng
df.columns = df.columns.str.strip()

# Chỉ lấy hai cột quan trọng
filtered_data = df[["Family Heart Disease", "Heart Disease Status"]]

# Loại bỏ các dòng có giá trị trống hoặc NaN
filtered_data = filtered_data.dropna()

# Chuyển đổi thành danh sách JSON
json_data = filtered_data.to_dict(orient="records")

# Lưu ra file JSON
json_path = "family_heart_disease.json"
with open(json_path, "w") as f:
    json.dump(json_data, f, indent=4)

print(f"Dữ liệu đã được lưu tại: {json_path}")
