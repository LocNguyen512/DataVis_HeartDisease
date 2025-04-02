import pandas as pd

df = pd.read_csv("project_heart_disease.csv")

for gender in ["Male", "Female"]:
    subset = df[df["Gender"] == gender]["Cholesterol Level"]
    print(f"{gender} - Min: {subset.min()}, Max: {subset.max()}, Mean: {subset.mean()}, Median: {subset.median()}")
