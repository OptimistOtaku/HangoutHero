export interface CityCard {
  name: string;
  image: string;
  tagline: string;
}

export const CITY_CARDS: CityCard[] = [
  {
    name: "Delhi",
    image:
      "https://rdmypruvhkqvfdjfohpk.supabase.co/storage/v1/render/image/public/carousel-images/delhi.jpg?width=800&quality=85",
    tagline: "Heritage courtyards and late-night food trails",
  },
  {
    name: "Noida",
    image:
      "https://rdmypruvhkqvfdjfohpk.supabase.co/storage/v1/render/image/public/carousel-images/noida.jpg?width=800&quality=85",
    tagline: "Sleek cafes, creative corners, and quick escapes",
  },
  {
    name: "Jaipur",
    image:
      "https://rdmypruvhkqvfdjfohpk.supabase.co/storage/v1/render/image/public/carousel-images/jaipur.jpg?width=800&quality=85",
    tagline: "Palace pink mornings and bazaars worth wandering",
  },
  {
    name: "Mussoorie",
    image:
      "https://rdmypruvhkqvfdjfohpk.supabase.co/storage/v1/render/image/public/carousel-images/mussoorie.jpg?width=800&quality=85",
    tagline: "Misty hills, postcard views, and slow walks",
  },
  {
    name: "Goa",
    image:
      "https://rdmypruvhkqvfdjfohpk.supabase.co/storage/v1/render/image/public/carousel-images/goa.jpg?width=800&quality=85",
    tagline: "Sun-faded beaches, shacks, and golden hour rides",
  },
];

