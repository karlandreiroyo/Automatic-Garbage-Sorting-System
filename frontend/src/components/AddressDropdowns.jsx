import React, { useState, useEffect, useRef } from 'react';
import './AddressDropdowns.css';

const PSGC_BASE = 'https://psgc.cloud/api';

// Fetch and parse JSON with UTF-8 so PSGC names (e.g. Las Piñas, Parañaque) display correctly
async function fetchPsgcJson(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const text = new TextDecoder('utf-8').decode(buffer);
  if (!res.ok) throw new Error('Request failed');
  return JSON.parse(text);
}
async function fetchPsgcJsonOrEmpty(url) {
  try {
    return await fetchPsgcJson(url);
  } catch {
    return [];
  }
}

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
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [openField, setOpenField] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch regions on mount
  useEffect(() => {
    let cancelled = false;
    setApiError(null);
    setLoadingRegions(true);
    fetchPsgcJson(`${PSGC_BASE}/regions`)
      .then((data) => {
        if (!cancelled) {
          setRegions(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setApiError(err.message || 'Failed to load address data');
          setRegions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRegions(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch provinces when region changes. If region has no provinces (e.g. NCR), use a single "—" option and load cities from region.
  useEffect(() => {
    if (!value.region) {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      return;
    }
    const regionCode = regions.find((r) => r.name === value.region)?.code;
    if (!regionCode) {
      setProvinces([]);
      return;
    }
    let cancelled = false;
    setLoadingProvinces(true);
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    fetchPsgcJsonOrEmpty(`${PSGC_BASE}/regions/${regionCode}/provinces`)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          setProvinces(list);
        } else {
          // Region has no provinces (e.g. NCR); check for cities/municipalities under region
          return fetchPsgcJsonOrEmpty(`${PSGC_BASE}/regions/${regionCode}/cities`)
            .then((citiesFromRegion) => {
              if (cancelled) return;
              const hasRegionLevel = Array.isArray(citiesFromRegion) && citiesFromRegion.length > 0;
              if (hasRegionLevel) {
                setProvinces([{ name: '—', code: regionCode, isRegionLevel: true }]);
              } else {
                setProvinces([]);
              }
            });
        }
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => { cancelled = true; };
  }, [value.region, regions]);

  // Fetch cities + municipalities when province changes (or from region when province is "—" for NCR-style regions)
  useEffect(() => {
    if (!value.region || !value.province) {
      setCities([]);
      setBarangays([]);
      return;
    }
    const selectedProvince = provinces.find((p) => p.name === value.province);
    const provinceCode = selectedProvince?.code;
    const isRegionLevel = selectedProvince?.isRegionLevel === true;
    const regionCode = regions.find((r) => r.name === value.region)?.code;
    if (!provinceCode && !isRegionLevel) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    setCities([]);
    setBarangays([]);
    const base = isRegionLevel ? `${PSGC_BASE}/regions/${regionCode}` : `${PSGC_BASE}/provinces/${provinceCode}`;
    const fetchCities = fetchPsgcJsonOrEmpty(`${base}/cities`);
    const fetchMunicipalities = fetchPsgcJsonOrEmpty(`${base}/municipalities`);
    Promise.all([fetchCities, fetchMunicipalities]).then(([citiesData, munData]) => {
        const citiesList = Array.isArray(citiesData) ? citiesData : [];
        const munList = Array.isArray(munData) ? munData : [];
        const combined = [...citiesList.map((c) => ({ ...c, type: c.type || 'City' })), ...munList.map((m) => ({ ...m, type: m.type || 'Mun' }))];
        combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!cancelled) setCities(combined);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => { cancelled = true; };
  }, [value.region, value.province, provinces, regions]);

  // Fetch barangays when city/municipality changes
  useEffect(() => {
    if (!value.region || !value.province || !value.city_municipality) {
      setBarangays([]);
      return;
    }
    const selected = cities.find((c) => c.name === value.city_municipality);
    if (!selected?.code) {
      setBarangays([]);
      return;
    }
    const isCity = (selected.type || '').toLowerCase() === 'city';
    const url = isCity
      ? `${PSGC_BASE}/cities/${selected.code}/barangays`
      : `${PSGC_BASE}/municipalities/${selected.code}/barangays`;
    let cancelled = false;
    setLoadingBarangays(true);
    setBarangays([]);
    fetchPsgcJson(url)
      .then((data) => {
        if (!cancelled) {
          setBarangays(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setBarangays([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBarangays(false);
      });
    return () => { cancelled = true; };
  }, [value.region, value.province, value.city_municipality, cities]);

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

  useEffect(() => {
    if (openField) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [openField]);

  const handleChange = (field, selectedValue) => {
    let newValue = { ...value, [field]: selectedValue };
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

  const CustomSelect = ({
    field,
    placeholder,
    options,
    valueKey,
    labelKey,
    value: currentValue,
    hasError,
    disabled: fieldDisabled,
    searchPlaceholder,
    loading
  }) => {
    const isOpen = openField === field;
    const isDisabled = disabled || fieldDisabled;
    const getVal = (o) => (typeof o === 'string' ? o : (o[valueKey] ?? o.name ?? o));
    const getLabel = (o) => (typeof o === 'string' ? o : (o[labelKey] ?? o.name ?? o));
    const displayValue = currentValue
      ? (options.find((o) => getVal(o) === currentValue) ? getLabel(options.find((o) => getVal(o) === currentValue)) : currentValue)
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
          <span className={!displayValue ? 'placeholder' : ''}>
            {loading ? 'Loading...' : displayValue || placeholder}
          </span>
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
            <button type="button" className="address-select-option" onClick={() => handleChange(field, '')} role="option">
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
              <div className="address-select-no-results">{loading ? 'Loading...' : 'No matches'}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="address-fields">
      {apiError && (
        <div className="address-api-error" role="alert">
          {apiError}
        </div>
      )}
      <div className="form-group">
        <label>Region *</label>
        <CustomSelect
          field="region"
          placeholder="Select Region"
          searchPlaceholder="Type region..."
          options={regions}
          valueKey="name"
          labelKey="name"
          value={value.region || ''}
          hasError={touched.region && errors.region}
          loading={loadingRegions}
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
          loading={loadingProvinces}
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
          searchPlaceholder="Type city or municipality..."
          options={cities}
          valueKey="name"
          labelKey="name"
          value={value.city_municipality || ''}
          hasError={touched.city_municipality && errors.city_municipality}
          disabled={disabled || !value.province}
          loading={loadingCities}
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
          loading={loadingBarangays}
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
