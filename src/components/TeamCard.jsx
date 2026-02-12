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

function TeamCard({ team, onClick }) {

  const normalizedName = normalizeName(team.strTeam);

  const logo =
    team.strTeamBadge ||
    teamLogos[team.strTeam] ||
    teamLogos[normalizedName];

  return (
    <div className="card" onClick={onClick}>
      {logo ? (
        <img src={logo} alt={team.strTeam} />
      ) : (
        <div style={{ fontSize: "40px" }}>⚽</div>
      )}

      <h3>{team.strTeam}</h3>
      <p>{team.strCountry}</p>
    </div>
  );
}

export default TeamCard;
