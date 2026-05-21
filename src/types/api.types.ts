export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  avatar: { url: string; localPath: string };
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

export interface ApiRandomUser {
  id: string;
  name: { title: string; first: string; last: string };
  email: string;
  gender: string;
  picture: { large: string; medium: string; thumbnail: string };
  location: { country: string; city: string };
  login: { username: string; uuid: string };
  phone: string;
}
