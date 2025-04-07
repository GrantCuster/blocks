import { Keyboard } from "./Keyboard";
import { RefUpdater } from "./RefUpdater";
import { Toolbar } from "./Toolbar";
import { Zoom } from "./Zoom";

export function App() {
  return (
    <div className="w-full relative h-[100dvh]">
      <Zoom />
      <Toolbar />
      <Keyboard />
      <RefUpdater />
    </div>
  );
}


export default App;
