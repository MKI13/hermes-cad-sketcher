import React from 'react';

type MeasurementBoxProps = {
  activeMeasurement: string;
  value: string;
  status?: string;
  onValueChange: (value: string) => void;
  onApply: () => void;
};

export function MeasurementBox({ activeMeasurement, value, status, onValueChange, onApply }: MeasurementBoxProps) {
  return (
    <form
      className="measurement-field measurement-box-active"
      aria-label="Aktive Maßeingabe"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <strong>Maße</strong>
      <output>{activeMeasurement}</output>
      <label>
        <span className="sr-only">Maß oder Koordinaten in Millimeter eingeben</span>
        <input
          value={value}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          placeholder="600,400,720 · 1200,600 · 1200"
          aria-label="Maß oder Koordinaten in Millimeter"
        />
      </label>
      <button type="submit">OK</button>
      <small>{status ?? 'mm · Enter erstellt oder ändert das aktive Element'}</small>
    </form>
  );
}
