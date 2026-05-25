import React from 'react';
import iconMap from './icons/hermes-cad-icon-map.json';

export type HermesIconId = (typeof iconMap)[number]['id'];
export type HermesIconVariant = 'color' | 'mono';

export type HermesIconProps = {
  id: HermesIconId | string;
  label?: string;
  size?: number;
  variant?: HermesIconVariant;
  className?: string;
};

export function hermesIconPath(id: HermesIconId | string, variant: HermesIconVariant = 'mono'): string {
  const folder = variant === 'color' ? 'color' : 'mono';
  return `/icons/hermes-cad-clear-icons/svg/${folder}/${id}.svg`;
}

export function HermesIcon({ id, label, size = 24, variant = 'mono', className }: HermesIconProps) {
  return (
    <img
      src={hermesIconPath(id, variant)}
      alt=""
      title={label}
      width={size}
      height={size}
      className={className ?? 'hermes-icon'}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function findHermesIconIdByLabel(label: string): string | undefined {
  const normalized = label.trim().toLowerCase();
  return iconMap.find((icon) => icon.label_de.toLowerCase() === normalized || icon.tags.some((tag) => tag.toLowerCase() === normalized))?.id;
}

export default HermesIcon;
