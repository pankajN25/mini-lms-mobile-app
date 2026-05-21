import client from './client';
import type { ApiResponse, PaginatedData, ApiProduct, ApiRandomUser } from '@/types/api.types';
import type { Course, Instructor } from '@/types/domain.types';
import { COURSES_PAGE_LIMIT } from '@/utils/constants';

function mapRandomUserToInstructor(u: ApiRandomUser): Instructor {
  return {
    id: u.login?.uuid ?? u.id,
    name: `${u.name.first} ${u.name.last}`,
    email: u.email,
    avatarUrl: u.picture.large,
    country: u.location.country,
  };
}

function mapProductToCourse(product: ApiProduct, instructor: Instructor): Course {
  const discounted = product.price * (1 - product.discountPercentage / 100);
  return {
    id: String(product.id),
    title: product.title,
    description: product.description,
    price: parseFloat(discounted.toFixed(2)),
    originalPrice: product.price,
    discountPercentage: product.discountPercentage,
    rating: product.rating,
    category: product.category,
    thumbnailUrl: product.thumbnail,
    images: product.images,
    instructor,
  };
}

export interface FetchCoursesResult {
  courses: Course[];
  hasMore: boolean;
  totalPages: number;
}

export async function fetchCourses(page = 1): Promise<FetchCoursesResult> {
  const [productsRes, usersRes] = await Promise.all([
    client.get<ApiResponse<PaginatedData<ApiProduct>>>(
      `/api/v1/public/randomproducts?page=${page}&limit=${COURSES_PAGE_LIMIT}`
    ),
    client.get<ApiResponse<PaginatedData<ApiRandomUser>>>(
      `/api/v1/public/randomusers?page=${page}&limit=${COURSES_PAGE_LIMIT}`
    ),
  ]);

  const products = productsRes.data.data.data;
  const users = usersRes.data.data.data;
  const { hasNextPage, totalPages } = productsRes.data.data;

  const courses = products.map((product, index) => {
    const instructor = mapRandomUserToInstructor(users[index % users.length]!);
    return mapProductToCourse(product, instructor);
  });

  return { courses, hasMore: hasNextPage, totalPages };
}
