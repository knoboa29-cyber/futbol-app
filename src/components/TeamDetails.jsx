import LastMatches from "./LastMatches";
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

function TeamDetails({ team }) {

  const normalized = normalizeName(team.strTeam);

  // 🔥 PRIORIDAD: tu mapeo primero
  const imageUrl =
    teamLogos[normalized] ||
    teamLogos[team.strTeam] ||
    team.strTeamBadge;

  return (
    <div className="details">
      <h2>{team.strTeam}</h2>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={team.strTeam}
          className="team-main-logo"
        />
      )}

      <p><strong>País:</strong> {team.strCountry}</p>
      <p><strong>Estadio:</strong> {team.strStadium}</p>

      <LastMatches teamId={team.idTeam} teamName={team.strTeam} />
    </div>
  );
}

export default TeamDetails;
