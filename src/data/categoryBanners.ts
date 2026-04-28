/**
 * Category banners configuration
 * Maps service types to banner images and descriptions
 */

export interface CategoryBanner {
  title: string
  description: string
  image: string
  color: string
  icon?: string
}

export const categoryBanners: Record<string, CategoryBanner> = {
  Photography: {
    title: 'Photography Services',
    description: 'Capture your special moments with professional photography. From events to portraits, our vendors offer stunning visual storytelling.',
    image: 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8ZW58MHx8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    color: '#F19B7D',
  },
  Catering: {
    title: 'Catering Services',
    description: 'Delight your guests with exceptional culinary experiences. Professional caterers offering diverse menus and exceptional service.',
    image: 'https://i.pinimg.com/736x/30/67/39/30673928d62f1b4d49fe5636e6629bfc.jpg',
    color: '#F19B7D',
  },
  'Event Planning': {
    title: 'Event Planning Services',
    description: 'Turn your vision into reality. Expert event planners ready to coordinate every detail of your perfect event.',
    image: 'https://i.pinimg.com/1200x/55/0e/87/550e87ca968682c3060156585cc07e7a.jpg',
    color: '#F19B7D',
  },
  Entertainment: {
    title: 'Entertainment Services',
    description: 'Keep your guests entertained with talented performers and entertainment professionals for unforgettable events.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8ZW58MHx8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    color: '#F19B7D',
  },
  'Flowers & Decor': {
    title: 'Flowers & Decor Services',
    description: 'Transform your venue with beautiful floral arrangements and stunning decorations that bring your event to life.',
    image: 'https://images.unsplash.com/photo-1550555750-4fa01e1a65e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8ZW58MHx8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    color: '#F19B7D',
  },
  Venue: {
    title: 'Venue Services',
    description: 'Find the perfect venue for your event. Explore a variety of beautiful locations to host your special occasion.',
    image: 'https://images.unsplash.com/photo-1519167758993-c5e4b4892644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8ZW58MHx8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    color: '#F19B7D',
  },
}

export const getCategoryBanner = (serviceType: string): CategoryBanner | null => {
  return categoryBanners[serviceType] || null
}
