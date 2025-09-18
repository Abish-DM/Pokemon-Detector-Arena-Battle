// src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css"; // make sure to include your CSS file

/* -------------------- Helpers -------------------- */

// Fetch Pokémon by name
async function fetchPokemonByName(name) {
  const clean = (name || "").trim().toLowerCase();
  if (!clean) throw new Error("Empty name");
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${clean}`);
  if (!res.ok) throw new Error(`Pokémon not found: ${name}`);
  return res.json();
}

// Fetch species info (flavor text)
async function fetchPokemonSpecies(id) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseStats(statsArray = []) {
  const out = {};
  statsArray.forEach((s) => {
    out[s.stat.name] = s.base_stat;
  });
  return {
    hp: out.hp || 0,
    attack: out.attack || 0,
    defense: out.defense || 0,
    specialAttack: out["special-attack"] || 0,
    specialDefense: out["special-defense"] || 0,
    speed: out.speed || 0,
  };
}

function computeMetrics(parsedStats) {
  const { hp, attack, defense, specialAttack, specialDefense, speed } =
    parsedStats;
  const totalBase =
    hp + attack + defense + specialAttack + specialDefense + speed;
  const offenseScore = attack + specialAttack;
  const defenseScore = defense + specialDefense;
  const bulkScore = Math.round(hp * ((defense + specialDefense) / 2));

  // Battle effectiveness scoring
  const physicalEffectiveness = Math.round(attack * 0.7 + speed * 0.3);
  const specialEffectiveness = Math.round(specialAttack * 0.7 + speed * 0.3);
  const tankiness = Math.round(hp * 0.4 + defense * 0.3 + specialDefense * 0.3);

  return {
    totalBase,
    offenseScore,
    defenseScore,
    bulkScore,
    speed,
    physicalEffectiveness,
    specialEffectiveness,
    tankiness,
  };
}

function getTypeColor(type) {
  const colors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return colors[type] || "#68A090";
}

/* -------------------- UI bits -------------------- */

function StatBar({ label, value, maxValue = 255, color = "#3b82f6" }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="stat-bar-container">
      <div className="stat-labels">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="stat-bar-bg">
        <div
          className="stat-bar-fill"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          }}
        />
      </div>
    </div>
  );
}

/* -------------------- Random suggestions -------------------- */

function RandomPokemonSuggestions({ onSelect }) {
  const popularPokemon = [
    "pikachu",
    "charizard",
    "blastoise",
    "venusaur",
    "mewtwo",
    "mew",
    "lugia",
    "ho-oh",
    "rayquaza",
    "dialga",
    "arceus",
    "reshiram",
    "kyurem",
    "xerneas",
    "necrozma",
    "zacian",
    "koraidon",
    "miraidon",
  ];

  const [suggestions] = useState(() =>
    popularPokemon.sort(() => 0.5 - Math.random()).slice(0, 8)
  );

  return (
    <div className="suggestions-container">
      <h3>🎲 Quick Select Legendary Pokémon</h3>
      <div className="suggestions-grid">
        {suggestions.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="suggestion-btn"
          >
            ✨ {name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Battle Simulation -------------------- */

function BattleSimulation({ pokemon1, pokemon2 }) {
  const [battleResult, setBattleResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  function generateBattleNarrative(winner, loser) {
    const narratives = [
      `${winner.name}'s superior speed allows it to strike first, overwhelming ${loser.name}!`,
      `${winner.name}'s balanced stats prove too much for ${loser.name} to handle!`,
      `Despite ${loser.name}'s best efforts, ${winner.name}'s power shines through!`,
      `${winner.name} uses its type advantage and raw stats to dominate the battle!`,
    ];
    return narratives[Math.floor(Math.random() * narratives.length)];
  }

  const simulateBattle = async () => {
    if (!pokemon1 || !pokemon2) return;

    setIsSimulating(true);
    setBattleResult(null);

    await new Promise((r) => setTimeout(r, 1200));

    const p1Stats = computeMetrics(parseStats(pokemon1.stats));
    const p2Stats = computeMetrics(parseStats(pokemon2.stats));

    const p1Score =
      p1Stats.physicalEffectiveness * 0.3 +
      p1Stats.specialEffectiveness * 0.3 +
      p1Stats.tankiness * 0.25 +
      p1Stats.speed * 0.15;

    const p2Score =
      p2Stats.physicalEffectiveness * 0.3 +
      p2Stats.specialEffectiveness * 0.3 +
      p2Stats.tankiness * 0.25 +
      p2Stats.speed * 0.15;

    const maxScore = Math.max(p1Score, p2Score, 1);
    const difference = Math.abs(p1Score - p2Score);
    const winProbability = Math.min(50 + (difference / maxScore) * 50, 95);

    const p1Wins = p1Score > p2Score;
    const winner = p1Wins ? pokemon1 : pokemon2;
    const loser = p1Wins ? pokemon2 : pokemon1;

    setBattleResult({
      winner,
      loser,
      winProbability: p1Wins ? winProbability : 100 - winProbability,
      scoreDifference: Math.round(difference),
      battleNarrative: generateBattleNarrative(winner, loser),
    });

    setIsSimulating(false);
  };

  if (!pokemon1 || !pokemon2) {
    return (
      <div className="battle-placeholder">
        <h3>⚔️ Battle Arena</h3>
        <p>Load two Pokémon to simulate an epic battle!</p>
      </div>
    );
  }

  return (
    <div className="battle-container">
      <h3>⚔️ Battle Simulation</h3>
      <div className="battle-pokemons">
        <div className="battle-side">
          <img
            src={
              pokemon1.sprites?.other?.["official-artwork"]?.front_default ||
              pokemon1.sprites?.front_default
            }
            alt={pokemon1.name}
          />
          <p>{pokemon1.name}</p>
        </div>
        <div className="battle-vs">⚡VS⚡</div>
        <div className="battle-side">
          <img
            src={
              pokemon2.sprites?.other?.["official-artwork"]?.front_default ||
              pokemon2.sprites?.front_default
            }
            alt={pokemon2.name}
          />
          <p>{pokemon2.name}</p>
        </div>
      </div>

      <button onClick={simulateBattle} disabled={isSimulating}>
        {isSimulating ? "⚡ BATTLING... ⚡" : "🔥 SIMULATE BATTLE 🔥"}
      </button>

      {battleResult && !isSimulating && (
        <div className="battle-result">
          <h4>🏆 WINNER: {battleResult.winner.name.toUpperCase()}!</h4>
          <p>Win Probability: {battleResult.winProbability.toFixed(1)}%</p>
          <p className="narrative">{battleResult.battleNarrative}</p>
        </div>
      )}
    </div>
  );
}

/* -------------------- Pokémon Card -------------------- */

function PokemonCard({ pokemon, isLoading, onRemove }) {
  const [species, setSpecies] = useState(null);

  useEffect(() => {
    if (pokemon?.id) {
      fetchPokemonSpecies(pokemon.id).then(setSpecies);
    } else {
      setSpecies(null);
    }
  }, [pokemon?.id]);

  if (isLoading) {
    return <div className="loading-card"></div>;
  }

  if (!pokemon) return null;

  const sprites = pokemon.sprites || {};
  const image =
    sprites.other?.["official-artwork"]?.front_default ||
    sprites.other?.dream_world?.front_default ||
    sprites.front_default ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

  const parsed = parseStats(pokemon.stats || []);
  const metrics = computeMetrics(parsed);

  const flavorText =
    species?.flavor_text_entries
      ?.find((entry) => entry.language.name === "en")
      ?.flavor_text?.replace(/[\n\f]/g, " ") || "A mysterious Pokémon.";

  return (
    <div className="pokemon-card">
      {onRemove && (
        <button onClick={onRemove} className="remove-btn">
          ×
        </button>
      )}

      <div className="card-header">
        <img src={image} alt={pokemon.name} />
        <h2>{pokemon.name}</h2>
        <p>#{pokemon.id.toString().padStart(3, "0")}</p>
        <div className="types">
          {pokemon.types?.map((typeObj) => (
            <span
              key={typeObj.slot}
              style={{ backgroundColor: getTypeColor(typeObj.type.name) }}
            >
              {typeObj.type.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flavor-box">
        <p>{flavorText}</p>
      </div>

      <div className="stats-section">
        <h4>Base Stats</h4>
        <StatBar label="HP" value={parsed.hp} color="#ef4444" />
        <StatBar label="Attack" value={parsed.attack} color="#f97316" />
        <StatBar label="Defense" value={parsed.defense} color="#eab308" />
        <StatBar label="Sp. Attack" value={parsed.specialAttack} color="#3b82f6" />
        <StatBar label="Sp. Defense" value={parsed.specialDefense} color="#8b5cf6" />
        <StatBar label="Speed" value={parsed.speed} color="#10b981" />
      </div>

      <div className="combat-box">
        <h4>⚔️ Combat Analysis ⚔️</h4>
        <div className="combat-grid">
          <div><span>Total BST:</span> <strong>{metrics.totalBase}</strong></div>
          <div><span>Physical:</span> <strong>{metrics.physicalEffectiveness}</strong></div>
          <div><span>Special:</span> <strong>{metrics.specialEffectiveness}</strong></div>
          <div><span>Tankiness:</span> <strong>{metrics.tankiness}</strong></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main App -------------------- */

export default function App() {
  const [query, setQuery] = useState("");
  const [p1, setP1] = useState(null);
  const [p2Query, setP2Query] = useState("");
  const [p2, setP2] = useState(null);
  const [error, setError] = useState("");
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);

  const searchPokemon = async (name, setterFn, setLoadingFn) => {
    if (!name || !name.trim()) {
      setError("Please enter a Pokémon name.");
      setterFn(null);
      return;
    }
    setError("");
    setLoadingFn(true);

    try {
      const data = await fetchPokemonByName(name);
      setterFn(data);
    } catch (e) {
      setError(e.message);
      setterFn(null);
    } finally {
      setLoadingFn(false);
    }
  };

  const searchOne = () => searchPokemon(query, setP1, setIsLoading1);
  const searchTwo = () => searchPokemon(p2Query, setP2, setIsLoading2);

  const handleQuickSelect = async (name) => {
    if (!p1) {
      setQuery(name);
      await searchPokemon(name, setP1, setIsLoading1);
    } else if (!p2) {
      setP2Query(name);
      await searchPokemon(name, setP2, setIsLoading2);
    }
  };

  const handleKeyPress = (e, searchFn) => {
    if (e.key === "Enter") {
      searchFn();
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>⚡ POKÉMON BATTLE ARENA ⚡</h1>
        <p>🌟 Discover, Compare & Simulate Epic Battles! 🌟</p>
      </header>

      <RandomPokemonSuggestions onSelect={handleQuickSelect} />

      <div className="arena-grid">
        <div>
          <div className="search-box">
            <input
              placeholder="Search first Pokémon..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, searchOne)}
            />
            <button onClick={searchOne} disabled={isLoading1}>
              {isLoading1 ? "..." : "Search"}
            </button>
          </div>
          <PokemonCard pokemon={p1} isLoading={isLoading1} onRemove={() => setP1(null)} />
        </div>

        <BattleSimulation pokemon1={p1} pokemon2={p2} />

        <div>
          <div className="search-box">
            <input
              placeholder="Search second Pokémon..."
              value={p2Query}
              onChange={(e) => setP2Query(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, searchTwo)}
            />
            <button onClick={searchTwo} disabled={isLoading2}>
              {isLoading2 ? "..." : "Search"}
            </button>
          </div>
          <PokemonCard pokemon={p2} isLoading={isLoading2} onRemove={() => setP2(null)} />
        </div>
      </div>

      {error && <div className="error-box">Error: {error}</div>}
    </div>
  );
}
