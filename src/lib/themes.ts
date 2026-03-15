export interface AppTheme {
  id: string;
  name: string;
  preview: string; // hex for swatch
  dark: boolean;
  vars: Record<string, string>;
}

export const THEMES: AppTheme[] = [
  {
    id: "default", name: "Mặc định", preview: "#f9f9fb", dark: false,
    vars: {
      "--background": "240 10% 98%", "--foreground": "240 10% 4%",
      "--card": "0 0% 100%", "--card-foreground": "240 10% 4%",
      "--secondary": "240 5% 94%", "--secondary-foreground": "240 10% 4%",
      "--muted": "240 5% 90%", "--muted-foreground": "240 4% 46%",
      "--border": "240 5% 90%", "--input": "240 5% 90%",
      "--popover": "0 0% 100%", "--popover-foreground": "240 10% 4%",
      "--canvas-bg": "240 10% 98%", "--canvas-dot": "240 5% 85%",
      "--node-bg": "0 0% 100%", "--sidebar-background": "0 0% 100%",
    },
  },
  {
    id: "warm", name: "Vàng cà phê", preview: "#f2e4c4", dark: false,
    vars: {
      "--background": "42 42% 93%", "--foreground": "30 20% 8%",
      "--card": "42 35% 97%", "--card-foreground": "30 20% 8%",
      "--secondary": "42 28% 90%", "--secondary-foreground": "30 20% 8%",
      "--muted": "42 22% 86%", "--muted-foreground": "30 10% 46%",
      "--border": "42 25% 84%", "--input": "42 25% 84%",
      "--popover": "42 35% 97%", "--popover-foreground": "30 20% 8%",
      "--canvas-bg": "42 42% 93%", "--canvas-dot": "42 22% 80%",
      "--node-bg": "42 35% 97%", "--sidebar-background": "42 35% 97%",
    },
  },
  {
    id: "dark", name: "Tối", preview: "#1a1a22", dark: true,
    vars: {
      "--background": "240 10% 8%", "--foreground": "240 5% 94%",
      "--card": "240 10% 12%", "--card-foreground": "240 5% 94%",
      "--secondary": "240 8% 18%", "--secondary-foreground": "240 5% 94%",
      "--muted": "240 6% 22%", "--muted-foreground": "240 4% 58%",
      "--border": "240 6% 20%", "--input": "240 6% 20%",
      "--popover": "240 10% 12%", "--popover-foreground": "240 5% 94%",
      "--canvas-bg": "240 10% 8%", "--canvas-dot": "240 6% 20%",
      "--node-bg": "240 10% 12%", "--sidebar-background": "240 10% 10%",
    },
  },
  {
    id: "midnight", name: "Đêm xanh", preview: "#0d1320", dark: true,
    vars: {
      "--background": "222 32% 7%", "--foreground": "210 25% 92%",
      "--card": "222 28% 11%", "--card-foreground": "210 25% 92%",
      "--secondary": "222 22% 16%", "--secondary-foreground": "210 25% 92%",
      "--muted": "222 18% 20%", "--muted-foreground": "210 12% 56%",
      "--border": "222 18% 18%", "--input": "222 18% 18%",
      "--popover": "222 28% 11%", "--popover-foreground": "210 25% 92%",
      "--canvas-bg": "222 32% 7%", "--canvas-dot": "222 18% 18%",
      "--node-bg": "222 28% 11%", "--sidebar-background": "222 30% 9%",
    },
  },
];

export function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function getCurrentTheme(themeId: string): AppTheme {
  return THEMES.find(t => t.id === themeId) || THEMES[0];
}
