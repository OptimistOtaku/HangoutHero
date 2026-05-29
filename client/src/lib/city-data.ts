export interface CityCard {
  name: string;
  image: string;
  tagline: string;
}

export const CITY_CARDS: CityCard[] = [
  {
    name: "Delhi",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    tagline: "Heritage courtyards and late-night food trails",
  },
  {
    name: "Noida",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    tagline: "Sleek cafes, creative corners, and quick escapes",
  },
  {
    name: "Jaipur",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    tagline: "Palace pink mornings and bazaars worth wandering",
  },
  {
    name: "Mussoorie",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    tagline: "Misty hills, postcard views, and slow walks",
  },
  {
    name: "Goa",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    tagline: "Sun-faded beaches, shacks, and golden hour rides",
  },
];
