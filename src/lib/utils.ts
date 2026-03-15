import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock API layer - setup for easy migration to Firebase Serverless later
export const db = {
  async login(email: string) {
    localStorage.setItem("sw_user", JSON.stringify({ email }));
  },
  async logout() {
    localStorage.removeItem("sw_user");
  },
  async getUser() {
    const user = localStorage.getItem("sw_user");
    return user ? JSON.parse(user) : null;
  },
  async getFeed() {
    const feed = localStorage.getItem("sw_feed");
    return feed ? JSON.parse(feed) : null;
  },
  async saveFeed(data: any) {
    localStorage.setItem("sw_feed", JSON.stringify(data));
  },
  async getMyStories() {
    const stories = localStorage.getItem("sw_my_stories");
    return stories ? JSON.parse(stories) : null;
  },
  async saveMyStories(data: any) {
    localStorage.setItem("sw_my_stories", JSON.stringify(data));
  },
  async getStoryNodes(storyId: string) {
    const nodes = localStorage.getItem(`sw_nodes_${storyId}`);
    return nodes ? JSON.parse(nodes) : null;
  },
  async saveStoryNodes(storyId: string, nodes: any) {
    localStorage.setItem(`sw_nodes_${storyId}`, JSON.stringify(nodes));
  }
};
