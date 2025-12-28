import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib
import re

def clean_price(price_str):
    """Convert price string like '₹1.99 Cr' to numeric value"""
    if pd.isna(price_str):
        return None
    
    price_str = str(price_str).replace('₹', '').replace(',', '').strip()
    
    # Handle Crores (Cr)
    if 'Cr' in price_str or 'cr' in price_str:
        value = float(re.findall(r'[\d.]+', price_str)[0])
        return value * 10000000  # 1 Cr = 10 million
    
    # Handle Lakhs (L)
    elif 'L' in price_str or 'l' in price_str or 'Lakh' in price_str:
        value = float(re.findall(r'[\d.]+', price_str)[0])
        return value * 100000  # 1 Lakh = 100,000
    
    # Handle thousands (K)
    elif 'K' in price_str or 'k' in price_str:
        value = float(re.findall(r'[\d.]+', price_str)[0])
        return value * 1000
    
    # Plain number
    else:
        try:
            return float(price_str)
        except:
            return None

def extract_bhk(title):
    """Extract BHK count from property title"""
    match = re.search(r'(\d+)\s*BHK', title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    match = re.search(r'(\d+)\s*RK', title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return 2  # Default

def extract_property_type(title):
    """Extract property type from title"""
    title_lower = title.lower()
    if 'villa' in title_lower:
        return 'VILLA'
    elif 'independent house' in title_lower or 'house' in title_lower:
        return 'INDEPENDENT_HOUSE'
    elif 'flat' in title_lower or 'apartment' in title_lower:
        return 'FLAT'
    else:
        return 'FLAT'

def extract_district(location):
    """Extract district from location string"""
    if pd.isna(location):
        return 'Chennai'
    
    # Common Chennai areas
    location_lower = location.lower()
    
    # Try to extract the last part after comma (usually the city/district)
    parts = location.split(',')
    if len(parts) > 1:
        district = parts[-1].strip()
        if 'chennai' in district.lower():
            # Get the area before Chennai
            if len(parts) > 2:
                return parts[-2].strip().title()
            return 'Chennai'
        return district.title()
    
    return location.strip().title()

def main():
    print("🚀 Starting ML Model Training...")
    print("=" * 60)
    
    # Load CSV
    print("\n📂 Loading CSV file...")
    csv_path = r'C:\Users\Abhijith\OneDrive\Desktop\main project\blockchain\Real Estate Data V21.csv'
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} records")
    
    # Data preprocessing
    print("\n🔧 Preprocessing data...")
    
    # Clean price
    df['Price_Clean'] = df['Price'].apply(clean_price)
    
    # Extract features
    df['BHK'] = df['Property Title'].apply(extract_bhk)
    df['Property_Type'] = df['Property Title'].apply(extract_property_type)
    df['District'] = df['Location'].apply(extract_district)
    
    # Convert balcony to numeric
    df['Has_Balcony'] = df['Balcony'].apply(lambda x: 1 if str(x).lower() == 'yes' else 0)
    
    # Remove rows with missing critical data
    df_clean = df.dropna(subset=['Price_Clean', 'Total_Area', 'Price_per_SQFT'])
    
    # Remove outliers (prices too low or too high)
    df_clean = df_clean[(df_clean['Price_Clean'] > 100000) & (df_clean['Price_Clean'] < 1000000000)]
    df_clean = df_clean[(df_clean['Total_Area'] > 100) & (df_clean['Total_Area'] < 10000)]
    
    print(f"✅ Cleaned data: {len(df_clean)} valid records")
    
    # Encode categorical features
    print("\n🏷️  Encoding categorical features...")
    le_property_type = LabelEncoder()
    le_district = LabelEncoder()
    
    df_clean['Property_Type_Encoded'] = le_property_type.fit_transform(df_clean['Property_Type'])
    df_clean['District_Encoded'] = le_district.fit_transform(df_clean['District'])
    
    # Prepare features and target
    feature_columns = [
        'Total_Area', 'BHK', 'Baths', 'Has_Balcony',
        'Property_Type_Encoded', 'District_Encoded', 'Price_per_SQFT'
    ]
    
    X = df_clean[feature_columns].fillna(0)
    y = df_clean['Price_Clean']
    
    print(f"✅ Features: {feature_columns}")
    print(f"✅ Target: Price_Clean")
    
    # Split data
    print("\n✂️  Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"✅ Training set: {len(X_train)} samples")
    print(f"✅ Test set: {len(X_test)} samples")
    
    # Scale features
    print("\n📊 Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("\n🤖 Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    
    model.fit(X_train_scaled, y_train)
    print("✅ Model trained successfully!")
    
    # Evaluate model
    print("\n📈 Evaluating model...")
    y_train_pred = model.predict(X_train_scaled)
    y_test_pred = model.predict(X_test_scaled)
    
    train_r2 = r2_score(y_train, y_train_pred)
    test_r2 = r2_score(y_test, y_test_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    
    print(f"\n{'='*60}")
    print("📊 MODEL PERFORMANCE")
    print(f"{'='*60}")
    print(f"Training R² Score:   {train_r2:.4f}")
    print(f"Testing R² Score:    {test_r2:.4f}")
    print(f"Mean Absolute Error: ₹{test_mae:,.0f}")
    print(f"Root Mean Squared Error: ₹{test_rmse:,.0f}")
    print(f"{'='*60}")
    
    # Feature importance
    print("\n🎯 Feature Importance:")
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(feature_importance.to_string(index=False))
    
    # Save model and artifacts
    print("\n💾 Saving model and artifacts...")
    joblib.dump(model, 'trained_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    joblib.dump(le_property_type, 'property_type_encoder.pkl')
    joblib.dump(le_district, 'district_encoder.pkl')
    joblib.dump(feature_columns, 'feature_names.pkl')
    
    print("✅ Saved: trained_model.pkl")
    print("✅ Saved: scaler.pkl")
    print("✅ Saved: property_type_encoder.pkl")
    print("✅ Saved: district_encoder.pkl")
    print("✅ Saved: feature_names.pkl")
    
    # Test prediction
    print("\n🧪 Testing prediction with sample data...")
    sample = X_test_scaled[0:1]
    sample_actual = y_test.iloc[0]
    sample_pred = model.predict(sample)[0]
    
    print(f"Actual Price:    ₹{sample_actual:,.0f}")
    print(f"Predicted Price: ₹{sample_pred:,.0f}")
    print(f"Error:           ₹{abs(sample_actual - sample_pred):,.0f} ({abs(sample_actual - sample_pred) / sample_actual * 100:.1f}%)")
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60)
    print("\n🎉 Your ML model is now ready for production use!")
    print("   The model will automatically be used for price predictions.")

if __name__ == "__main__":
    main()
