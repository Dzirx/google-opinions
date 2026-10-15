'use client';

import Link from 'next/link';
import styles from './print.module.css';

export function PrintToolbar() {
  return (
    <div className={styles.toolbar}>
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Drukuj
      </button>
      <Link
        href="/work-orders"
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
      >
        Wróć do zleceń
      </Link>
    </div>
  );
}
