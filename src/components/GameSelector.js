/**
 * GameSelector Component
 *
 * PURPOSE: Displays a list of available games in the sidebar.
 * Users can click on a game to select it, and the selected game
 * will be highlighted and shown in the top bar.
 *
 * PROPS:
 * - games: Array of game objects with 'id' and 'name' properties
 * - selectedGame: The currently selected game object
 * - onSelectGame: Function to call when user clicks a game
 */

// We don't need to import useState here because this component
// doesn't manage its own state - it receives everything from App.js

function GameSelector({ games, selectedGame, onSelectGame }) {
  // Debug log to help track what's being passed to this component
  console.log('GameSelector rendered with', games.length, 'games');

  return (
    <div className="game-selector">
      {/* Header for the sidebar */}
      <h2 className="game-selector-title">Select a Game</h2>

      {/* List of games - we use map() to create a button for each game */}
      <ul className="game-list">
        {games.map((game) => (
          <li key={game.id}>
            {/*
              Each game is a button that:
              1. Shows the game name
              2. Has a special class if it's selected (for styling)
              3. Calls onSelectGame when clicked
            */}
            <button
              className={`game-button ${selectedGame.id === game.id ? 'selected' : ''}`}
              onClick={() => {
                console.log('Game selected:', game.name); // Debug log
                onSelectGame(game);
              }}
            >
              {game.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Export the component so other files can import it
export default GameSelector;
