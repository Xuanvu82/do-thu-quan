declare module '*.css';

export interface Story {
  _id: string;
  title: string;
  author: string;
  genres: string[];
  description?: string;
  coverImage?: string;
  chapters?: { id: string; title: string; content: string }[];
  status?: 'completed' | 'ongoing';
  featured?: boolean;
  hot?: boolean;
  createdAt?: string; // Or Date
  updatedAt?: string; // Or Date
}

export {}; // Add this line to make it a module