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

function LastMatches({ teamId, teamName }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!teamId) return;

    setLoading(true);

    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`
    )
      .then(res => res.json())
      .then(data => {
        // Algunas respuestas pueden usar `results` o `events`,
        // y en ocasiones vienen como objeto en vez de array.
        let arr = [];
        if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.events)) arr = data.events;
        else if (data.results) arr = Array.isArray(data.results) ? data.results : [data.results];
        else if (data.events) arr = Array.isArray(data.events) ? data.events : [data.events];

        // Filtrar solo partidos donde participa el equipo seleccionado.
        // Preferir filtrar por id (más fiable). Si no hay ids, caer a comparar nombres.
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
            let nextArr = [];
            if (Array.isArray(nextData.events)) nextArr = nextData.events;
            else if (Array.isArray(nextData.results)) nextArr = nextData.results;
            else if (nextData.events) nextArr = Array.isArray(nextData.events) ? nextData.events : [nextData.events];
            else if (nextData.results) nextArr = Array.isArray(nextData.results) ? nextData.results : [nextData.results];
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

            const take = nextFiltered.slice(0, needed);
            const combined = filtered.concat(take).slice(0, 5);
            setMatches(combined);
            setLoading(false);
          })
          .catch(() => {
            // Si falla el fetch de próximos, usar los que haya.
            setMatches(arr);
            setLoading(false);
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
        Resultados encontrados: {matches.length}
      </p>

      <div className="matches-list">
        {matches.map((match, idx) => {
          const homeLogo =
            teamLogos[match.strHomeTeam] ||
            teamLogos[normalizeName(match.strHomeTeam)];

          const awayLogo =
            teamLogos[match.strAwayTeam] ||
            teamLogos[normalizeName(match.strAwayTeam)];

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
        })}
      </div>

      
    </div>
  );
}

export default LastMatches;
