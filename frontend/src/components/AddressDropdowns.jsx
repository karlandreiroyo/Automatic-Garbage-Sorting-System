import React, { useState, useEffect, useRef } from 'react';
import philippinesData from '../assets/philippines.json';
import './AddressDropdowns.css';

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
  const [openField, setOpenField] = useState(null); // 'region' | 'province' | 'city_municipality' | 'barangay' | null
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside; clear search when closing
  useEffect(() => {
    if (!openField) return;
    setSearchQuery('');
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenField(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openField]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (openField) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [openField]);

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
    setOpenField(null);
    setSearchQuery('');
  };

  const handleOpenDropdown = (field, isOpen) => {
    if (isOpen) {
      setOpenField(null);
      setSearchQuery('');
    } else {
      setSearchQuery('');
      setOpenField(field);
    }
  };

  // Custom dropdown with type-to-search; options list stays inside modal
  const CustomSelect = ({ field, placeholder, options, valueKey, labelKey, value: currentValue, hasError, disabled: fieldDisabled, searchPlaceholder }) => {
    const isOpen = openField === field;
    const isDisabled = disabled || fieldDisabled;
    const getVal = (o) => (typeof o === 'string' ? o : (o[valueKey] ?? o.name ?? o));
    const getLabel = (o) => (typeof o === 'string' ? o : (o[labelKey] ?? o.name ?? o));
    const displayValue = currentValue
      ? (options.find(o => getVal(o) === currentValue) ? getLabel(options.find(o => getVal(o) === currentValue)) : currentValue)
      : '';
    const query = isOpen ? searchQuery : '';
    const filteredOptions = query.trim()
      ? options.filter((opt) => getLabel(opt).toLowerCase().includes(query.trim().toLowerCase()))
      : options;
    return (
      <div className="address-select-wrapper" ref={field === openField ? dropdownRef : null}>
        <button
          type="button"
          className={`address-select-trigger ${hasError ? 'error' : ''}`}
          onClick={() => !isDisabled && handleOpenDropdown(field, isOpen)}
          disabled={isDisabled}
          title={displayValue || placeholder}
        >
          <span className={!displayValue ? 'placeholder' : ''}>{displayValue || placeholder}</span>
          <span className="address-select-arrow">▾</span>
        </button>
        {isOpen && (
          <div className="address-select-list" role="listbox">
            <div className="address-select-search-wrap">
              <input
                ref={searchInputRef}
                key={`address-search-${field}`}
                type="text"
                className="address-select-search"
                placeholder={searchPlaceholder || 'Type to search...'}
                value={query}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  requestAnimationFrame(() => searchInputRef.current?.focus());
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={`Search ${placeholder}`}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="address-select-option"
              onClick={() => handleChange(field, '')}
              role="option"
            >
              {placeholder}
            </button>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const val = getVal(opt);
                const label = getLabel(opt);
                return (
                  <button
                    key={val}
                    type="button"
                    className={`address-select-option ${currentValue === val ? 'selected' : ''}`}
                    onClick={() => handleChange(field, val)}
                    role="option"
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <div className="address-select-no-results">No matches</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="address-fields">
      <div className="form-group">
        <label>Region *</label>
        <CustomSelect
          field="region"
          placeholder="Select Region"
          searchPlaceholder="Type region..."
          options={regions}
          valueKey="code"
          labelKey="name"
          value={value.region || ''}
          hasError={touched.region && errors.region}
        />
        {touched.region && errors.region && (
          <span className="error-message">{errors.region}</span>
        )}
      </div>

      <div className="form-group">
        <label>Province *</label>
        <CustomSelect
          field="province"
          placeholder="Select Province"
          searchPlaceholder="Type province..."
          options={provinces}
          valueKey="name"
          labelKey="name"
          value={value.province || ''}
          hasError={touched.province && errors.province}
          disabled={disabled || !value.region}
        />
        {touched.province && errors.province && (
          <span className="error-message">{errors.province}</span>
        )}
      </div>

      <div className="form-group">
        <label>City/Municipality *</label>
        <CustomSelect
          field="city_municipality"
          placeholder="Select City/Municipality"
          options={cities}
          valueKey="name"
          labelKey="name"
          value={value.city_municipality || ''}
          hasError={touched.city_municipality && errors.city_municipality}
          disabled={disabled || !value.province}
        />
        {touched.city_municipality && errors.city_municipality && (
          <span className="error-message">{errors.city_municipality}</span>
        )}
      </div>

      <div className="form-group">
        <label>Barangay *</label>
        <CustomSelect
          field="barangay"
          placeholder="Select Barangay"
          searchPlaceholder="Type barangay..."
          options={barangays}
          valueKey="name"
          labelKey="name"
          value={value.barangay || ''}
          hasError={touched.barangay && errors.barangay}
          disabled={disabled || !value.city_municipality}
        />
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
