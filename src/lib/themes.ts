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
    id: "warm", name: "Kem ấm", preview: "#f8f3ec", dark: false,
    vars: {
      "--background": "35 35% 97%", "--foreground": "30 20% 8%",
      "--card": "30 25% 99%", "--card-foreground": "30 20% 8%",
      "--secondary": "35 20% 93%", "--secondary-foreground": "30 20% 8%",
      "--muted": "35 15% 89%", "--muted-foreground": "30 10% 48%",
      "--border": "35 18% 88%", "--input": "35 18% 88%",
      "--popover": "30 25% 99%", "--popover-foreground": "30 20% 8%",
      "--canvas-bg": "35 35% 97%", "--canvas-dot": "35 18% 85%",
      "--node-bg": "30 25% 99%", "--sidebar-background": "30 25% 99%",
    },
  },
  {
    id: "sky", name: "Trời xanh", preview: "#eef4fb", dark: false,
    vars: {
      "--background": "210 40% 97%", "--foreground": "215 20% 8%",
      "--card": "210 30% 99%", "--card-foreground": "215 20% 8%",
      "--secondary": "210 25% 93%", "--secondary-foreground": "215 20% 8%",
      "--muted": "210 20% 89%", "--muted-foreground": "210 10% 48%",
      "--border": "210 22% 88%", "--input": "210 22% 88%",
      "--popover": "210 30% 99%", "--popover-foreground": "215 20% 8%",
      "--canvas-bg": "210 40% 97%", "--canvas-dot": "210 20% 84%",
      "--node-bg": "210 30% 99%", "--sidebar-background": "210 30% 99%",
    },
  },
  {
    id: "sage", name: "Xanh lá", preview: "#edf6f0", dark: false,
    vars: {
      "--background": "145 25% 96%", "--foreground": "150 20% 8%",
      "--card": "145 20% 99%", "--card-foreground": "150 20% 8%",
      "--secondary": "145 18% 92%", "--secondary-foreground": "150 20% 8%",
      "--muted": "145 15% 88%", "--muted-foreground": "145 8% 48%",
      "--border": "145 18% 87%", "--input": "145 18% 87%",
      "--popover": "145 20% 99%", "--popover-foreground": "150 20% 8%",
      "--canvas-bg": "145 25% 96%", "--canvas-dot": "145 15% 84%",
      "--node-bg": "145 20% 99%", "--sidebar-background": "145 20% 99%",
    },
  },
  {
    id: "lavender", name: "Tím oải hương", preview: "#f0edf8", dark: false,
    vars: {
      "--background": "265 30% 97%", "--foreground": "265 20% 8%",
      "--card": "265 20% 99%", "--card-foreground": "265 20% 8%",
      "--secondary": "265 18% 93%", "--secondary-foreground": "265 20% 8%",
      "--muted": "265 14% 89%", "--muted-foreground": "265 8% 48%",
      "--border": "265 16% 88%", "--input": "265 16% 88%",
      "--popover": "265 20% 99%", "--popover-foreground": "265 20% 8%",
      "--canvas-bg": "265 30% 97%", "--canvas-dot": "265 16% 85%",
      "--node-bg": "265 20% 99%", "--sidebar-background": "265 20% 99%",
    },
  },
  {
    id: "rose", name: "Hồng nhạt", preview: "#faf0f0", dark: false,
    vars: {
      "--background": "0 30% 97%", "--foreground": "0 20% 8%",
      "--card": "0 20% 99%", "--card-foreground": "0 20% 8%",
      "--secondary": "0 18% 93%", "--secondary-foreground": "0 20% 8%",
      "--muted": "0 14% 89%", "--muted-foreground": "0 8% 48%",
      "--border": "0 16% 88%", "--input": "0 16% 88%",
      "--popover": "0 20% 99%", "--popover-foreground": "0 20% 8%",
      "--canvas-bg": "0 30% 97%", "--canvas-dot": "0 16% 85%",
      "--node-bg": "0 20% 99%", "--sidebar-background": "0 20% 99%",
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
