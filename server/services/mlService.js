const axios = require('axios');

/**
 * AI Price Prediction Service Integration
 */
async function predictLandPrice(landData) {
  try {
    const response = await axios.post('http://localhost:8001/predict', {
      area_sqft: landData.area_sqft,
      latitude: landData.latitude,
      longitude: landData.longitude,
      district: landData.district,
      state: landData.state,
      land_type: landData.land_type,
      pincode: landData.pincode || null,
      road_width: landData.road_width || null,
      electricity: landData.electricity !== false,
      water_supply: landData.water_supply !== false
    }, {
      timeout: 10000 // 10 second timeout
    });
    
    console.log('ML Service response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('ML Service error:', error.message);
    // Return fallback estimation
    return null;
  }
}

module.exports = { predictLandPrice };
