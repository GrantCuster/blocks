import { RefUpdater } from "./RefUpdater";
import { Toolbar } from "./Toolbar";
import { Zoom } from "./Zoom";

export function App() {
  return (
    <div className="w-full relative h-[100dvh]">
      <Zoom />
      <Toolbar />
      <RefUpdater />
    </div>
  );
}


export default App;
