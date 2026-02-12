import { useState } from "react";
import TeamList from "./components/TeamList";
import TeamDetails from "./components/TeamDetails";

function App() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [league, setLeague] = useState("English Premier League");

  return (
    <div className="container">
      <h1>🏆 UEFA CHAMPIONS LEAGUE UCSG 🏆</h1>

      <div className="league-buttons">
        {[
          "English Premier League",
          "Spanish La Liga",
          "Italian Serie A",
          "German Bundesliga"
        ].map((lg) => (
          <button
            key={lg}
            className={league === lg ? "active" : ""}
            onClick={() => {
              setLeague(lg);
              setSelectedTeam(null);
            }}
          >
            {lg
              .replace("English ", "")
              .replace("Spanish ", "")
              .replace("Italian ", "")
              .replace("German ", "")}
          </button>
        ))}
      </div>

      <TeamList
        league={league}
        onSelectTeam={setSelectedTeam}
      />

      {selectedTeam && <TeamDetails team={selectedTeam} />}
    </div>
  );
}

export default App;
