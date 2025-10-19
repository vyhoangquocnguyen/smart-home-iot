import React from "react";

const FilterControls = ({ filters, setFilters, devices }) => {
  return (
    <div className="flex gap-4 mb-4 flex-wrap items-center">
      {/* Filter by device */}
      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Device:</span>
        <select
          value={filters.deviceId}
          onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
          className="border rounded px-2 py-1"
        >
          <option value="">All Devices</option>
          {devices.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      {/* Alerts checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.alertOnly}
          onChange={(e) => setFilters({ ...filters, alertOnly: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-600">Alerts only</span>
      </label>

      {/* Time window */}
      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Window:</span>
        <select
          value={filters.windowMinutes}
          onChange={(e) => setFilters({ ...filters, windowMinutes: Number(e.target.value) })}
          className="border rounded px-2 py-1"
        >
          <option value={0}>All time</option>
          <option value={5}>Last 5 min</option>
          <option value={15}>Last 15 min</option>
          <option value={60}>Last 1 hour</option>
        </select>
      </label>
    </div>
  );
};

export default FilterControls;
