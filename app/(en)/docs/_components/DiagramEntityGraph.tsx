"use client";

import DiagramFigure from "./DiagramFigure";

/**
 * What sameAs actually does.
 *
 * THE CLAIM THIS EXISTS TO MAKE VISIBLE. The article's opening sentence says JSON-LD is how you
 * tell a machine that your brand name, your domain and your product are one thing rather than three
 * coincidences - and the mechanism behind that sentence is one property, `sameAs`, which is easy to
 * read as decoration on an Organization node. It is the join. The picture shows the three strings a
 * model is holding, the node that names them, and the profile links that resolve them to one entity.
 *
 * WHY THE ORPHANED PROFILE IS ITS OWN STEP. Copying an Organization snippet means copying its
 * `sameAs` list, and the failure is specific rather than general: a handle that was changed and
 * never updated is a link from your entity to somebody else's, or to nothing. The FAQ already says
 * it is worse than no link at all, so it is drawn as the last thing that arrives rather than mixed
 * in with the two that work.
 *
 * WHY THE WEBSITE NODE POINTS AT THE ORGANIZATION INSTEAD OF REPEATING IT. That is what `@id`
 * buys, and it is the part of the article's example readers skip: the reference is the mechanism,
 * and a second copy of the same data is what it replaces.
 *
 * THE DELAYS MARK THE READING ORDER: the ambiguous string, the graph it lives in, the anchor node,
 * the node that references it, the working profiles, the abandoned one, the outcome. Seven steps
 * rather than six, because the caution is not part of the list.
 *
 * `"use client"` IS NOT REDUNDANT WITH THE ONE IN DiagramFigure, and DiagramFigure's note has the
 * measurement: without it the markup moves into the RSC payload and this page grows by 6.5 kB.
 */
export default function DiagramEntityGraph() {
  const node = "var(--surface-2)";
  const line = "var(--line)";
  const inkStrong = "var(--ink-1)";
  const inkSoft = "var(--ink-2)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <DiagramFigure
      viewBox="0 0 720 430"
      titleId="entity-graph-title"
      descId="entity-graph-desc"
      title="How a sameAs list resolves one name to one entity"
      desc="A model meets the string Northwind and cannot tell whether it means a film studio or a software product. One JSON-LD graph answers that by giving every node a stable id. The Organization node names the brand and lists its external profiles under sameAs, and the WebSite node points at the Organization by id instead of repeating its data. The profiles are the join that turns the name into a resolvable entity; a profile that was abandoned points at nothing and is worse than leaving it out."
      caption="The @id is how the nodes find each other; the sameAs list is how a model finds you."
    >
      {/* 1. The string, which is all a model has to start with. */}
      <g style={{ animationDelay: "0ms" }}>
        <rect x="180" y="6" width="360" height="44" rx="12" fill={node} stroke={line} />
        <text x="360" y="26" textAnchor="middle" fontSize="13" fill={inkStrong}>
          A model meets the string: Northwind
        </text>
        <text x="360" y="43" textAnchor="middle" fontSize="11.5" fill={inkSoft}>
          a film studio, or a software product?
        </text>
      </g>

      {/* 2. The graph the answer lives in, drawn first so the nodes land inside it. */}
      <g style={{ animationDelay: "240ms" }}>
        <rect x="12" y="66" width="696" height="214" rx="14" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="26" y="86" fontSize="11.5" fill={inkSoft} fontFamily={mono}>
          one @graph - every node carries an @id
        </text>
      </g>

      {/* 3. The anchor node: the brand itself. */}
      <g style={{ animationDelay: "480ms" }}>
        <rect x="280" y="118" width="160" height="74" rx="12" fill={node} stroke={line} />
        <text x="360" y="142" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={inkStrong}>
          Organization
        </text>
        <text x="360" y="162" textAnchor="middle" fontSize="11" fill={inkSoft} fontFamily={mono}>
          @id: #organization
        </text>
        <text x="360" y="179" textAnchor="middle" fontSize="10.5" fill={inkSoft}>
          name, url, sameAs
        </text>
      </g>

      {/* 4. The node that references it by id rather than repeating it. */}
      <g style={{ animationDelay: "720ms" }}>
        <line x1="184" y1="155" x2="280" y2="155" stroke={line} strokeWidth="1.5" />
        <text x="232" y="148" textAnchor="middle" fontSize="10.5" fill={inkSoft} fontFamily={mono}>
          publisher
        </text>
        <path d="M280 155 l-9 -5 v10 z" fill={inkSoft} />
        <rect x="24" y="124" width="160" height="62" rx="12" fill={node} stroke={line} />
        <text x="104" y="148" textAnchor="middle" fontSize="13" fontWeight="600" fill={inkStrong}>
          WebSite
        </text>
        <text x="104" y="168" textAnchor="middle" fontSize="11" fill={inkSoft} fontFamily={mono}>
          @id: #website
        </text>
      </g>

      {/* 5. The two profiles that exist, which are the joins that work. */}
      <g style={{ animationDelay: "960ms" }}>
        <text x="490" y="152" textAnchor="middle" fontSize="10.5" fill={inkSoft} fontFamily={mono}>
          sameAs
        </text>

        <line x1="440" y1="155" x2="540" y2="106" stroke={line} strokeWidth="1.5" />
        <path d="M540 106 l-9 -5 v10 z" fill={inkSoft} />
        <rect x="540" y="84" width="156" height="44" rx="12" fill={node} stroke={line} />
        <text x="552" y="111" fontSize="11" fill={inkStrong} fontFamily={mono}>
          x.com/yourhandle
        </text>

        <line x1="440" y1="155" x2="540" y2="168" stroke={line} strokeWidth="1.5" />
        <path d="M540 168 l-9 -5 v10 z" fill={inkSoft} />
        <rect x="540" y="146" width="156" height="44" rx="12" fill={node} stroke={line} />
        <text x="552" y="173" fontSize="11" fill={inkStrong} fontFamily={mono}>
          github.com/you/repo
        </text>
      </g>

      {/* 6. The third one, which is the caution: an abandoned profile is not a weak join, it is none. */}
      <g style={{ animationDelay: "1200ms" }}>
        <line x1="440" y1="155" x2="540" y2="230" stroke={line} strokeWidth="1.5" />
        <path d="M540 230 l-9 -5 v10 z" fill="var(--warn)" />
        <rect x="540" y="208" width="156" height="48" rx="12" fill="var(--warn-bg)" stroke="var(--warn)" />
        <text x="552" y="226" fontSize="11" fill={inkStrong} fontFamily={mono}>
          x.com/your-old-handle
        </text>
        <text x="552" y="243" fontSize="10" fill="var(--warn)">
          worse than no link at all
        </text>
      </g>

      {/* 7. What the three joins together buy. */}
      <g style={{ animationDelay: "1440ms" }}>
        <rect x="40" y="326" width="640" height="98" rx="12" fill="none" stroke={line} />
        <text x="360" y="350" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={inkStrong}>
          The joins are the point: name, domain and profiles become one entity.
        </text>
        <text x="360" y="372" textAnchor="middle" fontSize="12" fill={inkSoft}>
          That is what lets a model tell your Northwind from the film studio, and cite the right one.
        </text>
        <text x="360" y="392" textAnchor="middle" fontSize="12" fill={inkSoft}>
          Every node needs a stable @id, and every sameAs needs a profile somebody still updates.
        </text>
      </g>
    </DiagramFigure>
  );
}
