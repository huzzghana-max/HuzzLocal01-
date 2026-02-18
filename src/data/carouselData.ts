/**
 * Carousel Content Management
 * This file contains all the event carousel data
 * Edit this file to easily add, remove, or modify carousel images and text
 */

export interface CarouselImage {
  id: number
  title: string
  location: string
  image: string
  description?: string
}

export const carouselImages: CarouselImage[] = [
  {
    id: 1,
    title: 'Wedding Celebration',
    location: 'New York, NY',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=500&fit=crop',
    description: 'Beautiful wedding ceremony with elegant decorations and perfect lighting',
  },
  {
    id: 2,
    title: 'Corporate Gala',
    location: 'Los Angeles, CA',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop',
    description: 'Professional corporate event with sophisticated ambiance',
  },
  {
    id: 3,
    title: 'Birthday Bash',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=500&fit=crop',
    description: 'Vibrant birthday celebration with fun entertainment',
  },
  {
    id: 4,
    title: 'Graduation Party',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=500&fit=crop',
    description: 'Memorable graduation celebration with friends and family',
  },
  {
    id: 5,
    title: 'Concert Event',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop',
    description: 'Live music concert with amazing atmosphere and energy',
  },
  {
    id: 6,
    title: 'Festival Celebration',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=500&fit=crop',
    description: 'Outdoor festival with entertainment and celebrations',
  },
]

/**
 * HOW TO ADD NEW CAROUSEL IMAGES:
 *
 * 1. Add a new object to the carouselImages array:
 *    {
 *      id: 7,
 *      title: 'Your Event Title',
 *      location: 'City, State',
 *      image: 'https://your-image-url.com/image.jpg',
 *      description: 'Optional description of your event'
 *    }
 *
 * 2. Make sure to:
 *    - Give each entry a unique id number
 *    - Use valid image URLs (Unsplash, Pexels, or your own CDN)
 *    - Keep location format consistent (City, State)
 *    - Add descriptive titles
 *
 * 3. The carousel will automatically update without changing the component code
 *
 * RECOMMENDED IMAGE SOURCES:
 * - Unsplash: https://unsplash.com
 * - Pexels: https://www.pexels.com
 * - Your own server/CDN
 */
