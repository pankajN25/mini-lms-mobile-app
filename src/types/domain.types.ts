export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  country: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  category: string;
  thumbnailUrl: string;
  images: string[];
  instructor: Instructor;
}

export interface Bookmark {
  courseId: string;
  savedAt: number;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CoursesCache {
  courses: Course[];
  fetchedAt: number;
}
