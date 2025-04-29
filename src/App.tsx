import { useEffect, useRef, useState } from "react";
import { useDevices } from "./useDevices";
import { mediaStreamAtom } from "./atoms";
import { GenerateVideosParameters, GoogleGenAI } from "@google/genai";
import { useAtom } from "jotai";

const apiKey = localStorage.getItem("GEMINI_API_KEY") || process.env.API_KEY;
const ai = new GoogleGenAI({
  apiKey,
});

export function App() {
  const [prompt, setPrompt] = useState("Monkey climbing on shoulder");
  const [status, setStatus] = useState("");
  const { devices, selectedDeviceIndex, setSelectedDeviceIndex } = useDevices();
  const [stream] = useAtom(mediaStreamAtom);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sendImage, setSendImage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateVideo(value: string): Promise<void> {
    try {
    let request: GenerateVideosParameters = {
      model: "veo-2.0-generate-001",
      prompt: value,
      config: {
        personGeneration: "allow_adult",
        aspectRatio: "16:9",
        numberOfVideos: 1,
      },
    };

    if (sendImage) {
      request.image = {
        imageBytes: canvasRef.current?.toDataURL("image/jpeg").split(",")[1],
        mimeType: "image/jpeg",
      };
    }

    let operation = await ai.models.generateVideos(request);

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      console.log("Operation status:", operation);
    }

    if (operation.response) {
      if (operation.response.generatedVideos) {
        operation.response.generatedVideos.forEach(async (generatedVideo) => {
          const resp = await fetch(
            `${generatedVideo.video?.uri}&key=${apiKey}`,
          );
          const blob = await resp.blob();
          const reader = new FileReader();
          reader.onload = () => {
            const base64data = reader.result as string;
            setVideoUrl(base64data.split(",")[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        setStatus(`Error: ${JSON.stringify(operation.response)}`);
      }
    }
    } catch (error) {
      console.error("Error generating video:", error);
      setStatus(`Error: ${error}`);
    }
  }

  const animationFrameRef = useRef<number | null>(null);
  useEffect(() => {
    if (videoRef.current && canvasRef.current && stream) {
      videoRef.current.onloadedmetadata = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        function draw() {
          ctx!.drawImage(
            videoRef.current!,
            0,
            0,
            canvas!.width,
            canvas!.height,
          );
          animationFrameRef.current = requestAnimationFrame(draw);
        }
        draw();
      };
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  return (
    <div className="w-full relative h-[100dvh] overflow-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="opacity-0 absolute top-0 left-0 pointer-events-none"
      />
      {videoUrl && (
        <div className="mt-4">
          <video
            controls
            autoPlay
            playsInline
            muted
            loop
            width={960}
            height={540}
            src={`data:video/mp4;base64,${videoUrl}`}
          />
        </div>
      )}

      <div className="grow">
        {devices.length > 0 ? (
          devices.length > 1 ? (
            <select
              value={selectedDeviceIndex || ""}
              onChange={(e) => setSelectedDeviceIndex(Number(e.target.value))}
              className="px-3 pointer-events-auto py-2 bg-neutral-800 focus:outline-none"
            >
              {devices.map((device, index) => (
                <option
                  value={index}
                  key={device.deviceId}
                  className="px-3 py-2 bg-neutral-800"
                >
                  {device.label || `Camera $ {device.deviceId}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2">
              {devices[0].label || `Camera ${devices[0].deviceId}`}
            </div>
          )
        ) : null}
      </div>
      <canvas
        width={960}
        height={540}
        className="display-none"
        ref={canvasRef}
      />
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={sendImage}
          onChange={() => setSendImage(!sendImage)}
        />{" "}
        Send image
      </label>
      <input
        className="w-full px-2 py-1 bg-neutral-700 text-neutral-200"
        placeholder="Your prompt here"
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            setStatus("Generating video...");
            await generateVideo(prompt);
          }
        }}
      />
      {isGenerating ? (
        <div className="text-white">Generating...</div>
      ) : (
        <button
          className="px-4 py-2 bg-blue-500 text-white"
          onClick={async () => {
            setIsGenerating(true);
            setStatus("Generating video...");
            await generateVideo(prompt);
            setIsGenerating(false);
          }}
        >
          Generate Video
        </button>
      )}
      <div>{status}</div>
    </div>
  );
}

export default App;
