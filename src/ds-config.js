/**
 * DS 2026 — component keys, collection IDs, mode IDs
 *
 * Update this file if the design system library is updated.
 * Do NOT hardcode these values elsewhere in the codebase.
 */

// ── Variable collections ──────────────────────────────────────────────────────

export const DS_COLLECTIONS = {

  /** Controls color/appearance by semantic intent (Primary, Negative, etc.) */
  intent: {
    id: 'VariableCollectionId:0ce37a59cd310eed8b8df53a3ed5cc812040b9f8/1777:0',
    modes: {
      Primary:   '78:5',
      Secondary: '574:1',
      Accent:    '78:4',
      Info:      '749:0',
      Positive:  '749:1',
      Negative:  '749:2',
      Warning:   '749:3',
    },
  },

  /** Controls component size (xs → xl) */
  dimension: {
    id: 'VariableCollectionId:5a4931ead4cda523d6809f3631775f64aa023a18/1740:254',
    modes: {
      xs: '171:6',
      sm: '1111:3',
      md: '1107:0',
      lg: '1107:1',
      xl: '1107:2',
    },
  },

  /** Controls palette index color (Index-1 → Index-10) */
  color: {
    id: 'VariableCollectionId:44d2cbd21e8eaf5aa3e1b10c77f02b4b390eff81/1814:127',
    modes: {
      'Index-1':  '1814:0',
      'Index-2':  '1814:1',
      'Index-3':  '1814:2',
      'Index-4':  '1814:3',
      'Index-5':  '1814:4',
      'Index-6':  '1814:5',
      'Index-7':  '1814:6',
      'Index-8':  '1814:7',
      'Index-9':  '1814:8',
      'Index-10': '1814:9',
    },
  },
};

// ── Component keys & exposed props ────────────────────────────────────────────

export const DS_COMPONENTS = {

  button: {
    /** Component set key (Style=Full-radius base, swap Style after import) */
    key: '4fec8b890726ad26baee56861e80c7065f6a37b6',
    /** Variant props — set via setProperties() */
    variants: {
      Style:    ['Standard', 'Full-radius', 'Ghost'],
      Status:   ['Default', 'Hover', 'Active'],
      IconOnly: ['False', 'True'],
    },
    /** Component props (boolean / text) — exact Figma names including #nodeId */
    props: {
      leadingIcon:  'Leading icon#1116:28',
      trailingIcon: 'Trailing icon#1116:32',
      text:         'Text#1116:16',
    },
    /** Collections applied to this component */
    collections: ['intent', 'dimension'],
  },

  input: {
    key: 'c924e7da19ee6aaba7e8a0ce4fd771b5fda9b458',
    variants: {
      Interaction: ['Default', 'Active', 'Hover', 'Read only'],
      Type: ['Default', 'Icon Left', 'Icon Right', 'Currency', 'Percent', 'Clear', 'Select', 'Date Picker'],
    },
    props: {
      showHelpText:  'Show help text#1736:60',
      labelText:     'Label text#1736:57',
      required:      'Required#1581:0',
      optional:      'Optional#1583:12',
      helpText:      'Help text#1736:58',
      helpTextValue: 'Help text value#1736:59',
    },
    collections: ['intent', 'dimension'],
  },

  badge: {
    /** One key per Usage+Style combination */
    keys: {
      'Intent-Default': '33df28e594678334043f2c174a54877661955341',
      'Intent-Dot':     '9a30075da453510ce9ce798d71982eccc783302e',
      'Index-Default':  'f8a00eda79ba38a9d9677ced584b20810bdcb56f',
      'Index-Dot':      '19729f441178d1a4610aed6721bf5201b326757b',
    },
    variants: {
      Usage:  ['Intent', 'Index'],
      Style:  ['Default', 'Dot'],
    },
    props: {
      text:        'Text#1874:5',
      leadingIcon: 'Leading icon#1874:0',
    },
    /** Collection depends on Usage: Intent → intent, Index → color */
    collections: ['intent', 'color'],
  },

  tag: {
    /** One key per Usage */
    keys: {
      'Intent': 'c31ac239edb479cd0a5bcf3c005679afab4f03ba',
      'Index':  '737dec4ccb84f4cc9de955b415f2312e5d1b78b0',
    },
    variants: {
      Usage: ['Intent', 'Index'],
    },
    props: {
      text:      'Text#1873:1',
      xIcon:     'X icon#2004:0',
    },
    /** Intent tag → intent + dimension, Index tag → color + dimension */
    collections: ['intent', 'color', 'dimension'],
  },

  checkbox: {
    /** Base variant key (Selection=OFF, Interaction=Default) */
    key: 'ca752d34d407e4555b7f354667414fda11b2de86',
    variants: {
      Selection:   ['ON', 'Mixed', 'OFF'],
      Interaction: ['Default', 'Hover', 'Read-only'],
    },
    props: {},       // No boolean/text props — label is outside the component
    collections: [], // Uses "Component no-modes" only — no mode-switching
  },

  radio: {
    /** Base variant key (Selection=OFF, Interaction=Default) */
    key: '1574f5e2e00a27fb65f85a6cea267098688f1e2d',
    variants: {
      Selection:   ['ON', 'OFF'],
      Interaction: ['Default', 'Hover', 'Read-only'],
    },
    props: {},       // No boolean/text props — label is outside the component
    collections: [], // Uses "Component no-modes" only — no mode-switching
  },

  toggle: {
    /** DS 2026 component name: "Switch" */
    /** Base variant key (Selection=OFF, Interaction=Default) */
    key: 'e15034ad1155e858fe8fc2c8a7026b06b99456bc',
    variants: {
      Selection:   ['ON', 'OFF', 'Middle'],
      Interaction: ['Default', 'Hover', 'Read-only'],
    },
    props: {},       // No boolean/text props — label is outside the component
    collections: [], // Uses "Component no-modes" only — no mode-switching
  },

};
