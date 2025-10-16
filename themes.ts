export interface Theme {
  name: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryHover: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    headerText: string;
  };
}

export const themes: { [key: string]: Theme } = {
  default: {
    name: 'Default Orange',
    colors: {
      primary: '#EF7722',
      primaryDark: '#D46A1F',
      primaryHover: '#F28D3D',
      secondary: '#FAA533',
      background: '#E4E4E4',
      card: '#FFFFFF',
      text: '#000000',
      textSecondary: '#5A5A5A',
      headerText: '#FFFFFF',
    },
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#007BFF',
      primaryDark: '#0056b3',
      primaryHover: '#3395FF',
      secondary: '#66B2FF',
      background: '#F0F8FF',
      card: '#FFFFFF',
      text: '#000000',
      textSecondary: '#5A5A5A',
      headerText: '#FFFFFF',
    },
  },
  forest: {
    name: 'Forest Green',
    colors: {
      primary: '#28A745',
      primaryDark: '#1e7e34',
      primaryHover: '#40B65C',
      secondary: '#58C472',
      background: '#F0FFF0',
      card: '#FFFFFF',
      text: '#000000',
      textSecondary: '#5A5A5A',
      headerText: '#FFFFFF',
    },
  },
  crimson: {
    name: 'Crimson Red',
    colors: {
      primary: '#DC3545',
      primaryDark: '#b02a37',
      primaryHover: '#E25260',
      secondary: '#E96A76',
      background: '#FFF0F1',
      card: '#FFFFFF',
      text: '#000000',
      textSecondary: '#5A5A5A',
      headerText: '#FFFFFF',
    },
  },
};