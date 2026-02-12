import { useEffect, useState } from "react";
import TeamCard from "./TeamCard";

function TeamList({ league, onSelectTeam }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Liga actual:", league);

    if (!league) return;

    setLoading(true);
    setError(null);

    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`
    )
      .then(res => res.json())
      .then(data => {
        console.log("Equipos recibidos:", data.teams);
        setTeams(data.teams || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error cargando equipos");
        setLoading(false);
      });

  }, [league]);

  if (loading) return <p>Cargando equipos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="grid">
      {teams.map((team) => (
        <TeamCard
          key={team.idTeam}
          team={team}
          onClick={() => onSelectTeam(team)}
        />
      ))}
    </div>
  );
}

export default TeamList;
