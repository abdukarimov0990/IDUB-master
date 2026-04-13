import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import SafeImage from "@/app/components/SafeImage";
import { getActor, normalizeImageUrl, type ActorDramaItem } from "@/lib/api";
import Breadcrumb from "@/app/components/BreadCrumb";
import FavoriteButton from "./FavoriteButton";
import { FaStar, FaPlay, FaEye, FaFilm } from "react-icons/fa";

const ROLE_LABEL: Record<string, string> = {
  LEAD: "Bosh rol",
  SUPPORTING: "Yordamchi rol",
  CAMEO: "Kameo",
  GUEST: "Mehmon",
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://idub.uz"
).replace(/\/$/, "");

type ActorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const actor = await getActor(id);
    if (!actor) return { title: "Aktyor topilmadi — IDUB" };

    const title = `${actor.name} — Aktyor, filmografiya | IDUB`;
    const dramaTitles = (actor.dramas || []).slice(0, 5).map((d) => d.title);
    const descRaw =
      actor.bio ||
      `${actor.name} — koreya aktyori. ${dramaTitles.length ? `Asosiy dramalari: ${dramaTitles.join(", ")}.` : ""} IDUB saytida filmografiyasini ko'ring.`;
    const description = descRaw.replace(/\s+/g, " ").trim().slice(0, 160);
    const url = `${SITE_URL}/aktyorlar/${id}`;
    const image = actor.actorImg ? normalizeImageUrl(actor.actorImg) : null;
    const keywords = [
      actor.name,
      "aktyor",
      "koreya aktyori",
      "filmografiya",
      "IDUB",
      ...dramaTitles,
    ];

    return {
      title,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
        type: "profile",
        title,
        description,
        url,
        siteName: "IDUB",
        locale: "uz_UZ",
        images: image
          ? [{ url: image, width: 1200, height: 630, alt: actor.name }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Aktyor topilmadi — IDUB" };
  }
}

export default async function ActorDetailPage({ params }: ActorPageProps) {
  const { id } = await params;

  let actor;
  try {
    actor = await getActor(id);
  } catch {
    notFound();
  }
  if (!actor) notFound();

  const dramas: ActorDramaItem[] = actor.dramas || [];
  const totalViews = dramas.reduce((sum, d) => sum + (d.viewsCount || 0), 0);
  const ratedDramas = dramas.filter((d) => d.imdbRating);
  const avgRating =
    ratedDramas.length > 0
      ? (
          ratedDramas.reduce((sum, d) => sum + (d.imdbRating || 0), 0) /
          ratedDramas.length
        ).toFixed(1)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: actor.name,
    description: actor.bio,
    image: actor.actorImg ? normalizeImageUrl(actor.actorImg) : undefined,
    url: `${SITE_URL}/aktyorlar/${id}`,
    jobTitle: "Actor",
    knownFor: dramas.slice(0, 10).map((d) => ({
      "@type": "CreativeWork",
      name: d.title,
      url: `${SITE_URL}/movie/${d.id}`,
    })),
  };

  return (
    <div className="relative bg-main text-white min-h-screen">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* HERO */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        {actor.actorImg ? (
          <>
            <SafeImage
              src={actor.actorImg}
              alt={actor.name}
              fill
              priority
              className="object-cover blur-xl scale-110 opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-main via-main/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-main/70 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-main via-surface to-black" />
        )}
      </div>

      {/* Breadcrumb overlay on hero */}
      <div className="absolute top-20 sm:top-24 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb lastLabel={actor.name} labels={{ aktyorlar: "Aktyorlar" }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 md:pb-20">
        <div className="relative -mt-28 sm:-mt-40 md:-mt-48 z-20">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8 lg:gap-10">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                {actor.actorImg ? (
                  <SafeImage
                    src={actor.actorImg}
                    alt={actor.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-second/30 to-black flex items-center justify-center text-6xl sm:text-7xl md:text-8xl font-black text-white/50">
                    {actor.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm text-second font-semibold mb-2 uppercase tracking-widest">
                  Aktyor
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight break-words">
                  {actor.name}
                </h1>
              </div>

              {actor.bio && (
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-3xl">
                  {actor.bio}
                </p>
              )}

              {/* Quick stats */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                  <FaFilm className="text-second text-sm" />
                  <span className="text-sm sm:text-base font-bold">{dramas.length}</span>
                  <span className="text-xs text-gray-400">drama</span>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <FaStar className="text-second text-sm" />
                    <span className="text-sm sm:text-base font-bold">{avgRating}</span>
                    <span className="text-xs text-gray-400">o&apos;rtacha</span>
                  </div>
                )}
                {totalViews > 0 && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <FaEye className="text-second text-sm" />
                    <span className="text-sm sm:text-base font-bold">
                      {totalViews.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">ko&apos;rildi</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center md:justify-start">
                <FavoriteButton actorId={id} />
              </div>
            </div>
          </div>
        </div>

        {/* DRAMAS */}
        {dramas.length > 0 && (
          <section className="mt-10 sm:mt-14 md:mt-16">
            <div className="flex items-center gap-2.5 mb-5 sm:mb-7">
              <div className="w-1 h-6 sm:h-7 bg-second rounded-full" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Ishtirok etgan dramalari
              </h2>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                ({dramas.length})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {dramas.map((d) => (
                <Link
                  key={d.id}
                  href={`/movie/${d.id}`}
                  className="group relative flex flex-col rounded-xl sm:rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 transition-all duration-500 hover:scale-[1.03] hover:border-second/30 hover:shadow-[0_20px_60px_rgba(126,84,230,0.15),0_8px_30px_rgba(0,0,0,0.5)]"
                >
                  {/* Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <SafeImage
                      src={normalizeImageUrl(d.posterUrl)}
                      alt={d.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      fallbackText={d.title.charAt(0)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Role badge */}
                    {d.role && (
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-second/85 backdrop-blur-md rounded text-white">
                          {ROLE_LABEL[d.role] || d.role}
                        </span>
                      </div>
                    )}

                    {/* Rating badge */}
                    {d.imdbRating != null && (
                      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/70 backdrop-blur-md rounded border border-white/10">
                        <FaStar className="text-second text-[8px] sm:text-[9px]" />
                        <span className="text-[9px] sm:text-[10px] font-bold">{d.imdbRating}</span>
                      </div>
                    )}

                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] scale-75 group-hover:scale-100 transition-transform duration-400">
                        <FaPlay className="fill-second text-xs sm:text-sm ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-2.5 sm:p-3 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:text-second transition-colors duration-300">
                      {d.title}
                    </h3>

                    {(d.releaseYear || d.totalEpisodes) && (
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                        {d.releaseYear && <span>{d.releaseYear}</span>}
                        {d.releaseYear && d.totalEpisodes && (
                          <span className="text-gray-600">•</span>
                        )}
                        {d.totalEpisodes && <span>{d.totalEpisodes} qism</span>}
                      </div>
                    )}

                    {d.genres && d.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.genres.slice(0, 2).map((g) => (
                          <span
                            key={g.id}
                            className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400"
                          >
                            {g.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {dramas.length === 0 && (
          <div className="mt-10 sm:mt-14 text-center py-10">
            <div className="inline-flex w-20 h-20 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-4">
              <FaFilm className="text-3xl text-gray-600" />
            </div>
            <p className="text-lg font-bold text-gray-400 mb-1">Dramalar mavjud emas</p>
            <p className="text-sm text-gray-600">
              Bu aktyor hali hech qanday dramada ishtirok etmagan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
