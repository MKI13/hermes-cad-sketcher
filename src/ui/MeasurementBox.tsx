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
      <strong>Aktive Maßeingabe</strong>
      <span>Aktuelles Maß</span>
      <output>{activeMeasurement}</output>
      <label>
        <span className="sr-only">Maß oder Koordinaten in Millimeter eingeben</span>
        <input
          value={value}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          placeholder="1200 · 1200,600 · 100,0,0"
          aria-label="Maß oder Koordinaten in Millimeter"
        />
      </label>
      <button type="submit">Übernehmen</button>
      <small>{status ?? 'mm · Enter übernimmt das Maß für das aktive Werkzeug'}</small>
    </form>
  );
}
