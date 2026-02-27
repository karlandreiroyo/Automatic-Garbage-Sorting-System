/**
 * Reusable Bin List Card Component
 * Matches the Super Admin bin monitoring card: green header (icon, bin name, Assign For),
 * white body (Fill Level, progress bar, Last Collection).
 * Can optionally show assigned employee in body instead of header (Admin format).
 *
 * @param {Object} bin - { id, name, fillLevel, lastUpdate, assigned_collector_name, category, location }
 * @param {Function} onClick - Optional click handler
 * @param {boolean} isArchived - Optional, applies archived styling
 * @param {'header'|'body'} assignedPosition - 'header' = "Assign For: name" in green header (image format); 'body' = "Assigned Employee" row in white body
 */

import React from 'react';

const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

function getFillLevelColor(fillLevel) {
  if (fillLevel >= 50) return '#10b981';
  if (fillLevel >= 30) return '#eab308';
  if (fillLevel >= 15) return '#f97316';
  return '#ef4444';
}

function getColorClass(category) {
  if (category === 'Biodegradable') return 'green';
  if (category === 'Non-Biodegradable' || category === 'Non Biodegradable') return 'red';
  if (category === 'Recyclable') return 'blue';
  return 'lime';
}

export default function BinListCard({
  bin,
  onClick,
  isArchived = false,
  assignedPosition = 'header',
  showArchiveCheckbox = false,
  isSelectedForArchive = false,
  onArchiveCheckboxChange,
  showUnassignButton = false,
  onUnassign
}) {
  const assignedName = bin.assigned_collector_name ?? 'Unassigned';
  const colorClass = getColorClass(bin.category);
  const fillColor = getFillLevelColor(bin.fillLevel ?? 0);
  const level = bin.fillLevel ?? 0;
  const hasAssignedCollector = bin.assigned_collector_id != null;

  return (
    <div
      className={`bin-list-card ${isArchived ? 'archived' : colorClass} ${showArchiveCheckbox ? 'bin-list-card-has-archive-checkbox' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {showArchiveCheckbox && (
        <div
          className="bin-list-card-archive-checkbox-wrap"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <input
            type="checkbox"
            className="bin-list-card-archive-checkbox"
            checked={isSelectedForArchive}
            onChange={onArchiveCheckboxChange}
            aria-label={`Select ${bin.name || 'bin'} for ${isArchived ? 'unarchive' : 'archive'}`}
          />
        </div>
      )}
      <div className="bin-list-header">
        <div className="bin-list-icon-wrapper">
          <TrashIcon />
        </div>
        <h3 className="bin-list-category-name">{bin.name}</h3>
        {assignedPosition === 'header' && (
          <>
            <p className="bin-list-assigned-for">
              Assign For: <span className="assign-for-name">{assignedName}</span>
            </p>
            {showUnassignButton && hasAssignedCollector && onUnassign && (
              <div className="bin-list-assign-in-header" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="bin-list-unassign-btn"
                  onClick={(e) => onUnassign(bin, e)}
                  aria-label={`Unassign ${assignedName} from ${bin.name || 'bin'}`}
                >
                  Unassign Collector
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bin-list-body">
        <div className="bin-list-fill-info">
          <div className="fill-level-section">
            <span className="fill-level-label">Fill Level</span>
            <span className="fill-percent" style={{ color: fillColor }}>
              {level}%
            </span>
          </div>
          <div className="fill-bar">
            <div
              className="fill-progress"
              style={{ width: `${level}%`, backgroundColor: fillColor }}
            />
          </div>
          {(bin.location || bin.description) && (
            <p className="bin-list-description" title={bin.description || bin.location}>
              {bin.description || bin.location}
            </p>
          )}
          <div className="bin-list-meta-info">
            {bin.id != null && (
              <div className="bin-list-info-row">
                <span className="info-label">Bin ID</span>
                <span className="info-value">{bin.id}</span>
              </div>
            )}
            {assignedPosition === 'body' && (
              <div className="bin-list-info-row">
                <span className="info-label">Assigned Employee</span>
                <span className="info-value">{assignedName}</span>
              </div>
            )}
            <div className="bin-list-info-row">
              <span className="info-label">Last Collection</span>
              <span className="info-value">{bin.lastUpdate ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
