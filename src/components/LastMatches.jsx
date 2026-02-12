import { useEffect, useState } from "react";
import teamLogos from "../utils/teamLogos";

function normalizeName(name) {
  return name
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function LastMatches({ teamId, teamName, league }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!teamId) return;

    console.log("LastMatches mounted for:", { teamId, teamName });

    setLoading(true);

    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`
    )
      .then(res => res.json())
      .then(data => {
          // Debug: mostrar información básica de la respuesta
          console.log("LastMatches fetched data (raw):", data);

        // Algunas respuestas pueden usar `results` o `events`,
        // y en ocasiones vienen como objeto en vez de array.
        let arr = [];
        if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.events)) arr = data.events;
        else if (data.results) arr = Array.isArray(data.results) ? data.results : [data.results];
        else if (data.events) arr = Array.isArray(data.events) ? data.events : [data.events];

        // Filtrar solo partidos donde participa el equipo seleccionado.
        // Preferir filtrar por id (más fiable). Si no hay ids, caer a comparar nombres.
        console.log("LastMatches parsed events:", arr.map(m => ({ idEvent: m.idEvent, idHomeTeam: m.idHomeTeam, idAwayTeam: m.idAwayTeam, strHomeTeam: m.strHomeTeam, strAwayTeam: m.strAwayTeam })));

        let filtered = arr;
        if (teamId) {
          filtered = arr.filter(m => {
            // Algunos objetos de evento usan `idHomeTeam`/`idAwayTeam`.
            if (m.idHomeTeam || m.idAwayTeam) {
              return String(m.idHomeTeam) === String(teamId) || String(m.idAwayTeam) === String(teamId);
            }
            // Fallback a nombres normalizados si no hay ids.
            if (teamName) {
              const target = normalizeName(teamName);
              const home = normalizeName(m.strHomeTeam || "");
              const away = normalizeName(m.strAwayTeam || "");
              return home === target || away === target;
            }
            return false;
          });
        } else if (teamName) {
          const target = normalizeName(teamName);
          filtered = arr.filter(m => {
            const home = normalizeName(m.strHomeTeam || "");
            const away = normalizeName(m.strAwayTeam || "");
            return home === target || away === target;
          });
        }

        console.log("LastMatches filtered past events:", filtered.map(m => ({ idEvent: m.idEvent, idHomeTeam: m.idHomeTeam, idAwayTeam: m.idAwayTeam, strHomeTeam: m.strHomeTeam, strAwayTeam: m.strAwayTeam })));

        // Si ya tenemos 5 o más, cortar y listo.
        if (filtered.length >= 5) {
          setMatches(filtered.slice(0, 5));
          setLoading(false);
          return;
        }

        // Si hay menos de 5 resultados, intentar completar con próximos partidos.
        const needed = 5 - filtered.length;
        fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`)
          .then(res => res.json())
          .then(nextData => {
            console.log("LastMatches fetched nextData (raw):", nextData);

            let nextArr = [];
            if (Array.isArray(nextData.events)) nextArr = nextData.events;
            else if (Array.isArray(nextData.results)) nextArr = nextData.results;
            else if (nextData.events) nextArr = Array.isArray(nextData.events) ? nextData.events : [nextData.events];
            else if (nextData.results) nextArr = Array.isArray(nextData.results) ? nextData.results : [nextData.results];

            console.log("LastMatches parsed next events:", nextArr.map(m => ({ idEvent: m.idEvent, idHomeTeam: m.idHomeTeam, idAwayTeam: m.idAwayTeam, strHomeTeam: m.strHomeTeam, strAwayTeam: m.strAwayTeam })));

            // Filtrar próximos por id si es posible, fallback a nombre.
            let nextFiltered = nextArr;
            if (teamId) {
              nextFiltered = nextArr.filter(m => {
                if (m.idHomeTeam || m.idAwayTeam) {
                  return String(m.idHomeTeam) === String(teamId) || String(m.idAwayTeam) === String(teamId);
                }
                if (teamName) {
                  const target = normalizeName(teamName);
                  const home = normalizeName(m.strHomeTeam || "");
                  const away = normalizeName(m.strAwayTeam || "");
                  return home === target || away === target;
                }
                return false;
              });
            } else if (teamName) {
              const target = normalizeName(teamName);
              nextFiltered = nextArr.filter(m => {
                const home = normalizeName(m.strHomeTeam || "");
                const away = normalizeName(m.strAwayTeam || "");
                return home === target || away === target;
              });
            }

            console.log("LastMatches nextFiltered:", nextFiltered.map(m => ({ idEvent: m.idEvent, idHomeTeam: m.idHomeTeam, idAwayTeam: m.idAwayTeam, strHomeTeam: m.strHomeTeam, strAwayTeam: m.strAwayTeam })));

            const take = nextFiltered.slice(0, needed);
            let combined = filtered.concat(take).slice(0, 5);

            if (combined.length < 5 && league && teamName) {
              // Intentar completar con el calendario de la liga
              fetch(
                `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?l=${encodeURIComponent(league)}`
              )
                .then(res => res.json())
                .then(seasonData => {
                  let seasonArr = [];
                  if (Array.isArray(seasonData.events)) seasonArr = seasonData.events;
                  else if (Array.isArray(seasonData.results)) seasonArr = seasonData.results;
                  else if (seasonData.events) seasonArr = Array.isArray(seasonData.events) ? seasonData.events : [seasonData.events];
                  else if (seasonData.results) seasonArr = Array.isArray(seasonData.results) ? seasonData.results : [seasonData.results];

                  const target = normalizeName(teamName);
                  const seasonFiltered = seasonArr.filter(m => {
                    const home = normalizeName(m.strHomeTeam || "");
                    const away = normalizeName(m.strAwayTeam || "");
                    return home === target || away === target;
                  });

                  console.log("LastMatches seasonFiltered:", seasonFiltered.map(m => ({ idEvent: m.idEvent, idHomeTeam: m.idHomeTeam, idAwayTeam: m.idAwayTeam, strHomeTeam: m.strHomeTeam, strAwayTeam: m.strAwayTeam })));

                  // añadir los que falten sin duplicar
                  const ids = new Set(combined.map(e => e && e.idEvent));
                  for (const ev of seasonFiltered) {
                    if (combined.length >= 5) break;
                    if (!ids.has(ev.idEvent)) {
                      combined.push(ev);
                      ids.add(ev.idEvent);
                    }
                  }

                  setMatches(combined.slice(0, 5));
                  setLoading(false);
                })
                .catch(() => {
                  setMatches(combined);
                  setLoading(false);
                });
            } else {
              setMatches(combined);
              setLoading(false);
            }
          })
          .catch(() => {
            // Si falla el fetch de próximos, intentar obtener del calendario de la liga (si se pasó `league`).
            if (league && teamName) {
              fetch(
                `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?l=${encodeURIComponent(league)}`
              )
                .then(res => res.json())
                .then(seasonData => {
                  let seasonArr = [];
                  if (Array.isArray(seasonData.events)) seasonArr = seasonData.events;
                  else if (Array.isArray(seasonData.results)) seasonArr = seasonData.results;
                  else if (seasonData.events) seasonArr = Array.isArray(seasonData.events) ? seasonData.events : [seasonData.events];
                  else if (seasonData.results) seasonArr = Array.isArray(seasonData.results) ? seasonData.results : [seasonData.results];

                  const target = normalizeName(teamName);
                  const seasonFiltered = seasonArr.filter(m => {
                    const home = normalizeName(m.strHomeTeam || "");
                    const away = normalizeName(m.strAwayTeam || "");
                    return home === target || away === target;
                  });

                  const combined2 = filtered.concat(seasonFiltered).slice(0, 5);
                  setMatches(combined2);
                  setLoading(false);
                })
                .catch(() => {
                  setMatches(filtered);
                  setLoading(false);
                });
            } else {
              // Si no hay liga o falla, usar los que haya.
              setMatches(filtered);
              setLoading(false);
            }
          });
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, [teamId]);

  if (loading) return <p>Cargando últimos partidos...</p>;
  if (matches.length === 0)
    return <p>No hay partidos disponibles.</p>;

  return (
    <div className="matches-container">
      <h3>Últimos partidos</h3>

      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Resultados encontrados: {matches.length} — Mostrando {Math.min(matches.length,5)} / 5
      </p>

      <div className="matches-list">
        {(() => {
          const displayList = [...matches.slice(0, 5)];
          while (displayList.length < 5) displayList.push(null);

          return displayList.map((match, idx) => {
            const homeLogo = match
              ? teamLogos[match.strHomeTeam] || teamLogos[normalizeName(match.strHomeTeam)]
              : null;

            const awayLogo = match
              ? teamLogos[match.strAwayTeam] || teamLogos[normalizeName(match.strAwayTeam)]
              : null;

            if (!match) {
              return (
                <div className="match-card" key={`empty-${idx}`}>
                  <div className="match-date">-</div>
                  <div className="match-row">
                    <div className="team-block">
                      <span style={{ opacity: 0.6 }}>Sin más datos</span>
                    </div>
                    <div className="score-block">- : -</div>
                    <div className="team-block">
                      <span style={{ opacity: 0.6 }}>Sin más datos</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="match-card" key={match.idEvent || idx}>
                <div className="match-date">{match.dateEvent}</div>

                <div className="match-row">

                  <div className="team-block">
                    {homeLogo && <img src={homeLogo} alt="" />}
                    <span>{match.strHomeTeam}</span>
                  </div>

                  <div className="score-block">
                    {match.intHomeScore ?? "-"} : {match.intAwayScore ?? "-"}
                  </div>

                  <div className="team-block">
                    {awayLogo && <img src={awayLogo} alt="" />}
                    <span>{match.strAwayTeam}</span>
                  </div>

                </div>
              </div>
            );
          });
        })()}
      </div>

      
    </div>
  );
}

export default LastMatches;
