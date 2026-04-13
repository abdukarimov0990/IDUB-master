import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import SafeImage from "@/app/components/SafeImage";
import { FaPlay, FaStar } from "react-icons/fa";
import { LuEye, LuFilm, LuThumbsUp } from "react-icons/lu";
import {
  getDrama,
  getSimilarDramas,
  getDramaEpisodes,
  normalizeImageUrl,
  type ApiEpisode,
} from "@/lib/api";
import EpisodePlayer from "./EpisodePlayer";
import Description from "./Description";
import SaveButton from "./SaveButton";
import ViewTracker from "./ViewTracker";
import SimilarSwiper from "./SimilarSwiper";
import ShareButton from "./ShareButton";

type MoviePageProps = {
  params: Promise<{ id: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://idub.uz";

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const { drama } = await getDrama(id);
    if (!drama) return { title: "Drama topilmadi — IDUB" };

    const title = drama.title;
    const pageTitle = `${title}${drama.year ? ` (${drama.year})` : ""} — IDUB`;
    const descRaw =
      drama.description ||
      `${title}${drama.year ? ` (${drama.year})` : ""} — IDUB saytida o'zbek tilida onlayn tomosha qiling.`;
    const description = descRaw.replace(/\s+/g, " ").trim().slice(0, 160);
    const url = `${SITE_URL}/movie/${id}`;
    const image = normalizeImageUrl(drama.bannerUrl || drama.posterUrl);
    const keywords = [
      title,
      drama.year ? `${title} ${drama.year}` : null,
      "koreya dramasi",
      "o'zbek tilida",
      "online tomosha",
      "IDUB",
      ...(drama.genres || []).map((g) =>
        typeof g === "string" ? g : (g as { title?: string }).title || ""
      ),
      ...(drama.tags || []),
      drama.director,
      drama.country,
    ].filter(Boolean) as string[];

    return {
      title: pageTitle,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
        type: "video.tv_show",
        title: pageTitle,
        description,
        url,
        siteName: "IDUB",
        locale: "uz_UZ",
        images: image
          ? [{ url: image, width: 1200, height: 630, alt: title }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description,
        images: image ? [image] : undefined,
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Drama topilmadi — IDUB" };
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;

  let drama;
  try {
    const data = await getDrama(id);
    drama = data.drama;
  } catch {
    notFound();
  }

  if (!drama) notFound();

  // Fetch similar and episodes in parallel
  const [similarData, episodesData] = await Promise.all([
    getSimilarDramas(id).catch(() => ({ items: [] })),
    getDramaEpisodes(id).catch(() => ({ items: [] as ApiEpisode[], pagination: {} as any })),
  ]);

  // Group episodes by seasonNumber
  const episodeItems = episodesData.items || [];
  const seasonsMap = new Map<number, typeof episodeItems>();
  for (const ep of episodeItems) {
    const sn = ep.seasonNumber || 1;
    if (!seasonsMap.has(sn)) seasonsMap.set(sn, []);
    seasonsMap.get(sn)!.push(ep);
  }

  const playerSeasons = Array.from(seasonsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNum, eps]) => ({
      season: seasonNum,
      episodes: eps.map((ep) => ({
        id: ep.id,
        episode: ep.episodeNumber,
        title: ep.title,
        video: ep.videoUrl || "",
        videoProvider: ep.videoProvider,
        isOpen: ep.isOpen,
        reason: ep.reason,
        unlockPrice: ep.unlockPricePerEpisode,
      })),
    }));

  const similar = similarData.items.map((d) => ({
    id: d.id,
    title: d.title,
    poster: d.posterUrl,
    seasonNumber: d.seasonNumber,
    seriesNumber: d.seriesNumber,
  }));

  const canonicalUrl = `${SITE_URL}/movie/${id}`;
  const ogImage = normalizeImageUrl(drama.bannerUrl || drama.posterUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": drama.totalEpisodes && drama.totalEpisodes > 1 ? "TVSeries" : "Movie",
    name: drama.title,
    description: drama.description,
    image: ogImage || undefined,
    url: canonicalUrl,
    inLanguage: drama.language || "uz",
    countryOfOrigin: drama.country,
    datePublished: drama.year ? `${drama.year}` : undefined,
    numberOfEpisodes: drama.totalEpisodes,
    genre: (drama.genres || []).map((g) =>
      typeof g === "string" ? g : (g as { title?: string }).title
    ),
    director: drama.director
      ? { "@type": "Person", name: drama.director }
      : undefined,
    actor: (drama.actors || []).map((a) => ({
      "@type": "Person",
      name: a.name,
      url: `${SITE_URL}/aktyorlar/${a.id}`,
    })),
    aggregateRating:
      drama.imdbRating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: drama.imdbRating,
            bestRating: 10,
            ratingCount: Math.max(drama.viewsCount || 1, 1),
          }
        : undefined,
  };

  return (
    <div className="bg-main text-white min-h-screen">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker dramaId={id} />

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[40vh] sm:h-[55vh] md:h-[75vh] overflow-hidden">
        {drama.trailer ? (
          <video autoPlay muted loop playsInline className="absolute w-full h-full object-cover">
            <source src={drama.trailer} type="video/mp4" />
          </video>
        ) : (
          <SafeImage
            src={drama.bannerUrl || drama.posterUrl}
            alt="Banner"
            fill
            priority
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-main via-main/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-main/70 via-transparent to-transparent" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 sm:-mt-40 md:-mt-56 z-20">
          <div className="flex flex-col md:flex-row gap-5 md:gap-8 lg:gap-10">

            {/* Poster */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="relative w-36 sm:w-48 md:w-56 lg:w-64 aspect-[2/3]">
                <SafeImage
                  src={drama.posterUrl}
                  alt={drama.title}
                  fill
                  className="object-cover rounded-xl md:rounded-2xl"
                />
                <div className="absolute inset-0 rounded-xl md:rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/10" />
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4 sm:space-y-5 text-center md:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-3">
                  {drama.title}
                </h1>

            <div className="flex items-center justify-center gap-3">
                  <div className="flex gap-2 text-gray-400 text-xs sm:text-sm justify-center justify-start flex-wrap">
                  {(drama.imdbRating || drama.imdbRating === 0) && (
                    <>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span className="text-white font-bold">{drama.imdbRating}</span>
                      </div>
                      <span className="text-gray-600">|</span>
                    </>
                  )}
                  {drama.year && <><span>{drama.year}</span><span className="text-gray-600">|</span></>}
                  {drama.country && <><span>{drama.country}</span><span className="text-gray-600">|</span></>}
                  {drama.duration && <><span>{drama.duration} min</span><span className="text-gray-600">|</span></>}
                  {drama.ageRating && (
                    <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] sm:text-xs font-bold text-white/90">
                      {drama.ageRating}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {drama.genres?.map((g: any, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-white/8 rounded-md text-[11px] sm:text-xs text-white/70 border border-white/5">
                      {typeof g === "string" ? g : g.title || g.slug}
                    </span>
                  ))}
                </div>
            </div>
              </div>

              {drama.description && <Description text={drama.description} />}

              {/* Additional metadata */}
              {(drama.director || drama.network || drama.language || (drama.tags && drama.tags.length > 0)) && (
                <div className="space-y-1.5 text-sm text-left">
                  {drama.director && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Rejissyor: </span>
                      <span className="text-white/80">{drama.director}</span>
                    </p>
                  )}
                  {drama.network && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Tarmoq: </span>
                      <span className="text-white/80">{drama.network}</span>
                    </p>
                  )}
                  {drama.language && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Til: </span>
                      <span className="text-white/80">{drama.language}</span>
                    </p>
                  )}
                  {drama.tags && drama.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {drama.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[11px] text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Buttons + Quick Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap  justify-start">
                <a
                  href="#movie"
                  className="px-5 sm:px-7 py-2.5 sm:py-3 bg-second text-white rounded-lg font-bold flex items-center gap-2 hover:bg-second/85 transition-all duration-200 active:scale-95 text-sm sm:text-base"
                >
                  <FaPlay className="text-xs" /> Ko&apos;rish
                </a>
                <SaveButton dramaId={id} />
                <div className="flex items-center gap-1 ml-1">
                  <ShareButton dramaId={id} title={drama.title} />
                </div>
              </div>

              {/* Actors */}
              {drama.actors && drama.actors.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 justify-start text-gray-300">
                    <span className="w-0.5 h-4 bg-second rounded-full" /> Aktyorlar
                  </h3>
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
                    {drama.actors.map((actor) => (
                      <Link
                        key={actor.id}
                        href={`/aktyorlar/${actor.id}`}
                        className="group text-center active:scale-95 transition-transform duration-200"
                      >
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-1">
                          {actor.actorImg ? (
                            <SafeImage
                              src={actor.actorImg}
                              alt={actor.name}
                              fill
                              fallbackText={actor.name.charAt(0)}
                              className="object-cover rounded-full border-2 border-white/10 group-hover:border-second/50 transition-colors duration-200"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white/50 border-2 border-white/10 group-hover:border-second/50 transition-colors duration-200">
                              {actor.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 group-hover:text-second transition-colors duration-200 max-w-[70px] sm:max-w-[80px] truncate">{actor.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- STATS --- */}
        {(() => {
          const stats: {
            label: string;
            val: string | number;
            icon: any;
            suffix?: string;
          }[] = [
            {
              label: "Ko'rildi",
              val: drama.viewsCount?.toLocaleString() || "—",
              icon: LuEye,
            },
            {
              label: "Reyting",
              val: drama.imdbRating ?? "—",
              icon: FaStar,
              suffix: drama.imdbRating ? "/10" : undefined,
            },
            {
              label: "Status",
              val: drama.status === "ongoing" ? "Davom etmoqda" : "Tugagan",
              icon: LuFilm,
            },
          ];
          if (drama.likesCount !== undefined) {
            stats.push({
              label: "Yoqdi",
              val: drama.likesCount.toLocaleString(),
              icon: LuThumbsUp,
            });
          }
          if (drama.totalEpisodes) {
            stats.push({
              label: "Qismlar",
              val: String(drama.totalEpisodes),
              icon: LuFilm,
              suffix: drama.freeEpisodesCount
                ? ` · ${drama.freeEpisodesCount} bepul`
                : undefined,
            });
          }

          const count = stats.length;
          const mdCols =
            count === 3
              ? "md:grid-cols-3"
              : count === 4
                ? "md:grid-cols-4"
                : "md:grid-cols-5";
          const smCols =
            count <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

          return (
            <section className="mt-10 sm:mt-14 md:mt-20">
              <div
                className={`grid grid-cols-2 ${smCols} ${mdCols} gap-2.5 sm:gap-3 md:gap-4`}
              >
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="group relative bg-white/[0.02] border border-white/5 hover:border-second/25 hover:bg-white/[0.04] rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-second/10 border border-second/20 flex items-center justify-center shrink-0 group-hover:bg-second/15 group-hover:border-second/30 transition-colors duration-300">
                        <stat.icon className="text-second text-sm sm:text-base" />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
                        {stat.label}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg sm:text-xl md:text-2xl font-black tracking-tight truncate">
                        {stat.val}
                      </p>
                      {stat.suffix && (
                        <span className="text-[11px] sm:text-xs text-gray-500 font-semibold shrink-0">
                          {stat.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* --- PLAYER --- */}
        {playerSeasons.length > 0 && (
          <section id="movie" className="mt-10 sm:mt-14 md:mt-20">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-5 md:mb-6">
              <div className="w-1 h-5 bg-second rounded-full" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Tomosha qilish</h2>
            </div>
            <EpisodePlayer seasons={playerSeasons} dramaId={id} />
          </section>
        )}

        {/* --- SCREENSHOTS --- */}
        {drama.screenshots && drama.screenshots.length > 0 && (
          <section className="mt-10 sm:mt-14 md:mt-20">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-5 md:mb-6">
              <div className="w-1 h-5 bg-second rounded-full" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Kadrlardan namunalar</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {drama.screenshots.map((img, i) => (
                <div key={i} className="group relative aspect-video overflow-hidden rounded-lg sm:rounded-xl cursor-pointer border border-white/5 hover:border-white/15 transition-colors duration-200">
                  <SafeImage src={img} fill className="object-cover group-hover:scale-105 transition-transform duration-500" alt="Screenshot" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="p-2.5 sm:p-3 bg-white/15 backdrop-blur-sm rounded-full">
                      <LuEye className="size-4 sm:size-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SIMILAR --- */}
        {similar.length > 0 && (
          <section className="mt-10 sm:mt-14 md:mt-20 pb-10 sm:pb-14 md:pb-20">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-5 md:mb-6">
              <div className="w-1 h-5 bg-second rounded-full" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Sizga yoqishi mumkin</h2>
            </div>
            <SimilarSwiper items={similar} />
          </section>
        )}
      </div>
    </div>
  );
}
