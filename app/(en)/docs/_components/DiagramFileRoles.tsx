"use client";

import DiagramFigure from "./DiagramFigure";

/**
 * Which of the three files does what.
 *
 * THE CONFUSION THIS EXISTS TO SETTLE. robots.txt, sitemap.xml and llms.txt all sit at a site root,
 * all address crawlers, and are routinely treated as three ways of saying the same thing - so
 * people add one and assume they have covered the other two, or write an llms.txt listing pages and
 * wonder why a crawler never fetched them. They answer three different questions and none of them
 * substitutes for another.
 *
 * The columns are ordered by when a crawler meets them: permission first, then discovery, then
 * comprehension. That order is the explanation.
 *
 * WHAT IS HERE AND WHAT IS NOT. The frame - the figure, the inline SVG, the caption, the
 * IntersectionObserver that assembles it, and the measured reasoning behind all three - is
 * DiagramFigure, which is the component this file's note said the third diagram would justify.
 * What stays below is the content: the three questions, in the order a crawler meets them.
 *
 * `"use client"` IS NOT REDUNDANT WITH THE ONE IN DiagramFigure, and DiagramFigure's note has the
 * measurement: without it the markup moves into the RSC payload and this page grows by 6.5 kB.
 */
export default function DiagramFileRoles() {
  const node = "var(--surface-2)";
  const line = "var(--line)";
  const inkStrong = "var(--ink-1)";
  const inkSoft = "var(--ink-2)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <DiagramFigure
      viewBox="0 0 720 400"
      titleId="file-roles-title"
      descId="file-roles-desc"
      title="What robots.txt, sitemap.xml and llms.txt each decide"
      desc="A crawler arrives and meets three files in order. robots.txt decides whether it may fetch at all. sitemap.xml tells it which pages exist. llms.txt tells it what the site is about once it is reading. Each answers a different question and none replaces another."
      caption="Read left to right in the order a crawler meets them: permission, then discovery, then comprehension."
    >

      {/* 1. The crawler arrives. */}
      <g style={{ animationDelay: "0ms" }}>
        <rect x="230" y="6" width="260" height="42" rx="12" fill={node} stroke={line} />
        <text x="360" y="32" textAnchor="middle" fontSize="14" fill={inkStrong}>
          A crawler arrives
        </text>
      </g>

      {/* 2. The three-way split, drawn in the order the crawler meets them. */}
      <g style={{ animationDelay: "260ms" }}>
        <line x1="360" y1="48" x2="360" y2="74" stroke={line} strokeWidth="1.5" />
        <line x1="110" y1="74" x2="610" y2="74" stroke={line} strokeWidth="1.5" />
        <line x1="110" y1="74" x2="110" y2="104" stroke={line} strokeWidth="1.5" />
        <line x1="360" y1="74" x2="360" y2="104" stroke={line} strokeWidth="1.5" />
        <line x1="610" y1="74" x2="610" y2="104" stroke={line} strokeWidth="1.5" />
        <path d="M110 112 l-5 -9 h10 z" fill={inkSoft} />
        <path d="M360 112 l-5 -9 h10 z" fill={inkSoft} />
        <path d="M610 112 l-5 -9 h10 z" fill={inkSoft} />
      </g>

      {/* 3. The files themselves. */}
      <g style={{ animationDelay: "520ms" }}>
        <rect x="20" y="112" width="180" height="44" rx="12" fill={node} stroke={line} />
        <text x="110" y="139" textAnchor="middle" fontSize="13.5" fill={inkStrong} fontFamily={mono}>
          robots.txt
        </text>

        <rect x="270" y="112" width="180" height="44" rx="12" fill={node} stroke={line} />
        <text x="360" y="139" textAnchor="middle" fontSize="13.5" fill={inkStrong} fontFamily={mono}>
          sitemap.xml
        </text>

        <rect x="520" y="112" width="180" height="44" rx="12" fill={node} stroke={line} />
        <text x="610" y="139" textAnchor="middle" fontSize="13.5" fill={inkStrong} fontFamily={mono}>
          llms.txt
        </text>
      </g>

      {/* 4. The question each one answers. This is the whole diagram. */}
      <g style={{ animationDelay: "780ms" }}>
        <line x1="110" y1="156" x2="110" y2="180" stroke={line} strokeWidth="1.5" />
        <line x1="360" y1="156" x2="360" y2="180" stroke={line} strokeWidth="1.5" />
        <line x1="610" y1="156" x2="610" y2="180" stroke={line} strokeWidth="1.5" />

        <rect x="20" y="180" width="180" height="86" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="110" y="206" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={inkStrong}>
          May it fetch?
        </text>
        <text x="110" y="228" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Permission.
        </text>
        <text x="110" y="246" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Empty file = allowed.
        </text>

        <rect x="270" y="180" width="180" height="86" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="360" y="206" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={inkStrong}>
          What exists?
        </text>
        <text x="360" y="228" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Discovery.
        </text>
        <text x="360" y="246" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Missing = still crawled.
        </text>

        <rect x="520" y="180" width="180" height="86" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="610" y="206" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={inkStrong}>
          What is it?
        </text>
        <text x="610" y="228" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Comprehension.
        </text>
        <text x="610" y="246" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Missing = inferred.
        </text>
      </g>

      {/* 5. The consequence, which is why the confusion costs anything. */}
      <g style={{ animationDelay: "1040ms" }}>
        <rect x="60" y="300" width="600" height="82" rx="12" fill="none" stroke={line} />
        <text x="360" y="326" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={inkStrong}>
          None of the three substitutes for another.
        </text>
        <text x="360" y="350" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          An llms.txt listing pages does not make them discoverable, because discovery is
          sitemap.xml.
        </text>
        <text x="360" y="368" textAnchor="middle" fontSize="12.5" fill={inkSoft}>
          A sitemap submitted does not grant permission, because permission is robots.txt.
        </text>
      </g>
    </DiagramFigure>
  );
}
