import Image from "next/image";

const networkPromos = [
  {
    name: "Please Rewind",
    largeImage: "/network/please-rewind.png",
    smallImage: "/network/please-rewind-small.png",
    href: "https://pleaserewindmovies.com/?utm_source=informantwire&utm_medium=house_ad&utm_campaign=network_promo",
  },
  {
    name: "The Movie Trailer",
    largeImage: "/network/the-movie-trailer.png",
    smallImage: "/network/the-movie-trailer-small.png",
    href: "https://the-movie-trailer.com/?utm_source=informantwire&utm_medium=house_ad&utm_campaign=network_promo",
  },
  {
    name: "Fighter Movie",
    largeImage: "/network/fighter-movie.png",
    smallImage: "/network/fighter-movie-small.png",
    href: "https://fighter-movie.com/?utm_source=informantwire&utm_medium=house_ad&utm_campaign=network_promo",
  },
];

export default function NetworkPromo() {
  const dayNumber = Math.floor(
    Date.now() / 86_400_000,
  );

  const centreIndex =
    dayNumber %
    networkPromos.length;

  const centre =
    networkPromos[centreIndex];

  const sides =
    networkPromos.filter(
      (_, index) =>
        index !== centreIndex,
    );

  return (
    <section
      className="border-t border-black/10 py-6"
      aria-label="From our network"
    >
      <div className="grid gap-2 lg:grid-cols-[1fr_2.5fr_1fr]">
        <a
          href={sides[0].href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${sides[0].name}`}
          className="group block overflow-hidden bg-black"
        >
          <div className="relative aspect-square h-full min-h-[220px] w-full">
            <Image
              src={sides[0].smallImage}
              alt={`${sides[0].name} — from our network`}
              fill
              sizes="(max-width: 1024px) 100vw, 22vw"
              className="object-cover transition duration-300 group-hover:opacity-90"
            />
          </div>
        </a>

        <a
          href={centre.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${centre.name}`}
          className="group block overflow-hidden bg-black"
        >
          <div className="relative h-full min-h-[220px] w-full">
            <Image
              src={centre.largeImage}
              alt={`${centre.name} — from our network`}
              fill
              priority={false}
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="object-cover transition duration-300 group-hover:opacity-90"
            />
          </div>
        </a>

        <a
          href={sides[1].href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${sides[1].name}`}
          className="group block overflow-hidden bg-black"
        >
          <div className="relative aspect-square h-full min-h-[220px] w-full">
            <Image
              src={sides[1].smallImage}
              alt={`${sides[1].name} — from our network`}
              fill
              sizes="(max-width: 1024px) 100vw, 22vw"
              className="object-cover transition duration-300 group-hover:opacity-90"
            />
          </div>
        </a>
      </div>
    </section>
  );
}
