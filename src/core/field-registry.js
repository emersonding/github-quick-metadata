/**
 * Field Registry - Metadata field definitions and formatters
 * Defines all available fields from GitHub /repos API response
 */

import { formatDate, formatRelativeDate } from '../utils/date.js';

/**
 * Field registry with all available metadata fields
 * Each field defines: key, label, category, type, and optional nested path
 */
export const FIELD_REGISTRY = {
  // Date fields
  created_at: {
    key: 'created_at',
    label: 'Created',
    category: 'dates',
    type: 'date',
    defaultEnabled: true
  },
  updated_at: {
    key: 'updated_at',
    label: 'Updated',
    category: 'dates',
    type: 'date',
    defaultEnabled: true
  },
  pushed_at: {
    key: 'pushed_at',
    label: 'Last Push',
    category: 'dates',
    type: 'date',
    defaultEnabled: false
  },

  // Numeric metrics
  stargazers_count: {
    key: 'stargazers_count',
    label: 'Stars',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },
  forks_count: {
    key: 'forks_count',
    label: 'Forks',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },
  open_issues_count: {
    key: 'open_issues_count',
    label: 'Open Issues',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },
  watchers_count: {
    key: 'watchers_count',
    label: 'Watchers',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },
  subscribers_count: {
    key: 'subscribers_count',
    label: 'Subscribers',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },
  size: {
    key: 'size',
    label: 'Size',
    category: 'metrics',
    type: 'size',
    defaultEnabled: false
  },
  network_count: {
    key: 'network_count',
    label: 'Network',
    category: 'metrics',
    type: 'number',
    defaultEnabled: false
  },

  // Info fields
  language: {
    key: 'language',
    label: 'Language',
    category: 'info',
    type: 'text',
    defaultEnabled: false
  },
  default_branch: {
    key: 'default_branch',
    label: 'Default Branch',
    category: 'info',
    type: 'text',
    defaultEnabled: false
  },
  license: {
    key: 'license',
    label: 'License',
    category: 'info',
    type: 'nested',
    path: ['license', 'spdx_id'],
    defaultEnabled: false
  },
  description: {
    key: 'description',
    label: 'Description',
    category: 'info',
    type: 'text',
    defaultEnabled: false
  },
  homepage: {
    key: 'homepage',
    label: 'Homepage',
    category: 'info',
    type: 'url',
    defaultEnabled: false
  },

  // Boolean flags
  fork: {
    key: 'fork',
    label: 'Is Fork',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  archived: {
    key: 'archived',
    label: 'Archived',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  disabled: {
    key: 'disabled',
    label: 'Disabled',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  has_issues: {
    key: 'has_issues',
    label: 'Issues',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  has_wiki: {
    key: 'has_wiki',
    label: 'Wiki',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  has_pages: {
    key: 'has_pages',
    label: 'Pages',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  has_discussions: {
    key: 'has_discussions',
    label: 'Discussions',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  is_template: {
    key: 'is_template',
    label: 'Template',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  },
  allow_forking: {
    key: 'allow_forking',
    label: 'Forking Allowed',
    category: 'flags',
    type: 'boolean',
    defaultEnabled: false
  }
};

/**
 * Get default enabled fields
 * @returns {string[]} Array of field keys
 */
export function getDefaultEnabledFields() {
  return Object.values(FIELD_REGISTRY)
    .filter(field => field.defaultEnabled)
    .map(field => field.key);
}

/**
 * Get fields grouped by category
 * @returns {Object} Categories with their fields
 */
export function getFieldsByCategory() {
  const categories = {
    dates: [],
    metrics: [],
    info: [],
    flags: []
  };

  Object.values(FIELD_REGISTRY).forEach(field => {
    if (categories[field.category]) {
      categories[field.category].push(field);
    }
  });

  return categories;
}

/**
 * Format a field value for display
 * @param {string} fieldKey - Field key from registry
 * @param {object} metadata - Full metadata object from /repos API
 * @returns {{ primary: string, secondary?: string, isLink?: boolean } | null}
 */
export function formatFieldValue(fieldKey, metadata) {
  const field = FIELD_REGISTRY[fieldKey];
  if (!field) return null;

  let value;

  // Extract value (handle nested paths)
  if (field.type === 'nested' && field.path) {
    value = field.path.reduce((obj, key) => obj?.[key], metadata);
  } else {
    value = metadata[fieldKey];
  }

  // Format based on type
  switch (field.type) {
    case 'date':
      if (!value) return { primary: 'N/A' };
      return {
        primary: formatDate(value),
        secondary: formatRelativeDate(value)
      };

    case 'number':
      if (value === null || value === undefined) return { primary: '0' };
      return { primary: value.toLocaleString() };

    case 'size':
      if (!value) return { primary: '0 MB' };
      const sizeMB = (value / 1024).toFixed(2);
      return { primary: `${sizeMB} MB` };

    case 'boolean':
      return { primary: value ? 'Yes' : 'No' };

    case 'url':
      if (!value) return { primary: 'None' };
      return { primary: value, isLink: true };

    case 'text':
    case 'nested':
      if (!value) return { primary: 'N/A' };
      return { primary: String(value) };

    default:
      if (!value) return { primary: 'N/A' };
      return { primary: String(value) };
  }
}
