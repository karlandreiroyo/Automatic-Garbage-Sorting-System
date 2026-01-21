import React, { useState, useEffect } from 'react';
import philippinesData from '../assets/philippines.json';

const AddressDropdowns = ({ 
  value = {}, 
  onChange, 
  disabled = false,
  errors = {},
  touched = {}
}) => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Initialize regions on mount
  useEffect(() => {
    const regionList = Object.keys(philippinesData).map(key => ({
      code: key,
      name: philippinesData[key].region_name
    }));
    setRegions(regionList);
  }, []);

  // Update provinces when region changes
  useEffect(() => {
    if (value.region) {
      const regionData = philippinesData[value.region];
      if (regionData) {
        const provinceList = Object.keys(regionData.province_list).map(name => ({
          name: name
        }));
        setProvinces(provinceList);
      }
    } else {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
    }
  }, [value.region]);

  // Update cities when province changes
  useEffect(() => {
    if (value.region && value.province) {
      const regionData = philippinesData[value.region];
      if (regionData && regionData.province_list[value.province]) {
        const cityList = Object.keys(regionData.province_list[value.province].municipality_list).map(name => ({
          name: name
        }));
        setCities(cityList);
      }
    } else {
      setCities([]);
      setBarangays([]);
    }
  }, [value.region, value.province]);

  // Update barangays when city changes
  useEffect(() => {
    if (value.region && value.province && value.city_municipality) {
      const regionData = philippinesData[value.region];
      if (regionData && 
          regionData.province_list[value.province] && 
          regionData.province_list[value.province].municipality_list[value.city_municipality]) {
        const barangayList = regionData.province_list[value.province].municipality_list[value.city_municipality].barangay_list;
        setBarangays(barangayList);
      }
    } else {
      setBarangays([]);
    }
  }, [value.region, value.province, value.city_municipality]);

  const handleChange = (field, selectedValue) => {
    let newValue = { ...value, [field]: selectedValue };

    // Reset dependent fields when parent changes
    if (field === 'region') {
      newValue = { region: selectedValue, province: '', city_municipality: '', barangay: '', street_address: value.street_address || '' };
    } else if (field === 'province') {
      newValue = { ...value, province: selectedValue, city_municipality: '', barangay: '' };
    } else if (field === 'city_municipality') {
      newValue = { ...value, city_municipality: selectedValue, barangay: '' };
    }

    onChange(newValue);
  };

  return (
    <div className="address-fields">
      <div className="form-group">
        <label>Region *</label>
        <select
          className={`form-input ${touched.region && errors.region ? 'error' : ''}`}
          value={value.region || ''}
          onChange={(e) => handleChange('region', e.target.value)}
          disabled={disabled}
        >
          <option value="">Select Region</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        {touched.region && errors.region && (
          <span className="error-message">{errors.region}</span>
        )}
      </div>

      <div className="form-group">
        <label>Province *</label>
        <select
          className={`form-input ${touched.province && errors.province ? 'error' : ''}`}
          value={value.province || ''}
          onChange={(e) => handleChange('province', e.target.value)}
          disabled={disabled || !value.region}
        >
          <option value="">Select Province</option>
          {provinces.map((province) => (
            <option key={province.name} value={province.name}>
              {province.name}
            </option>
          ))}
        </select>
        {touched.province && errors.province && (
          <span className="error-message">{errors.province}</span>
        )}
      </div>

      <div className="form-group">
        <label>City/Municipality *</label>
        <select
          className={`form-input ${touched.city_municipality && errors.city_municipality ? 'error' : ''}`}
          value={value.city_municipality || ''}
          onChange={(e) => handleChange('city_municipality', e.target.value)}
          disabled={disabled || !value.province}
        >
          <option value="">Select City/Municipality</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
        {touched.city_municipality && errors.city_municipality && (
          <span className="error-message">{errors.city_municipality}</span>
        )}
      </div>

      <div className="form-group">
        <label>Barangay *</label>
        <select
          className={`form-input ${touched.barangay && errors.barangay ? 'error' : ''}`}
          value={value.barangay || ''}
          onChange={(e) => handleChange('barangay', e.target.value)}
          disabled={disabled || !value.city_municipality}
        >
          <option value="">Select Barangay</option>
          {barangays.map((barangay) => (
            <option key={barangay} value={barangay}>
              {barangay}
            </option>
          ))}
        </select>
        {touched.barangay && errors.barangay && (
          <span className="error-message">{errors.barangay}</span>
        )}
      </div>

      <div className="form-group">
        <label>Street Address (House Number, Street Name)</label>
        <input
          type="text"
          className="form-input"
          value={value.street_address || ''}
          onChange={(e) => handleChange('street_address', e.target.value)}
          disabled={disabled}
          placeholder="e.g., 123 Main Street"
        />
      </div>
    </div>
  );
};

export default AddressDropdowns;