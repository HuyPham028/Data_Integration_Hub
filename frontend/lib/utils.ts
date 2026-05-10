import React from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate (value?: string | null) {
  if (!value) return '-';

  return new Date(value).toLocaleString('vi-VN');
};

export function getS3StatusBadge (status?: string) {
  switch (status) {
    case 'synced':
      return React.createElement(
        'span',
        { className: 'inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700' },
        'Synced'
      );

    case 'out_of_date':
      return React.createElement(
        'span',
        { className: 'inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700' },
        'Out of Date'
      );

    case 'not_synced':
    default:
      return React.createElement(
        'span',
        { className: 'inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700' },
        'Unsynced'
      );
  }
};