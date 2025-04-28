import { useEffect, useRef, useState } from "react";
import { useDevices } from "./useDevices";
import { mediaStreamAtom } from "./atoms";
import { useAtom } from "jotai";
import { PersonGeneration } from "@google/genai";

const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

export function App() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const { devices, selectedDeviceIndex, setSelectedDeviceIndex } = useDevices();
  const [file, setFile] = useState<File | null>(null);
  const [stream] = useAtom(mediaStreamAtom);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function generateVideo(value: string): Promise<string> {
    // get image bytes from preview canvas
    const previewCanvas = filePreviewCanvasRef.current;

    const modelName = "veo-2.0-generate-001";
    let body = {
      instances: [
        {
          prompt: value,
        },
      ],
      parameters: {
        sampleCount: 1,
        durationSeconds: 6,
        personGeneration: PersonGeneration.ALLOW_ADULT
      },
    };

    if (previewCanvas) {
      const dataUrl = previewCanvas.toDataURL("image/jpeg");
      const base64 = dataUrl.split(",")[1];
      const mimeType = dataUrl.split(";")[0].split(":")[1];
      // @ts-ignore
      body.instances[0].image = {
        bytesBase64Encoded: base64,
        mimeType: mimeType,
      };
    }

    try {
      const response = await fetch(
        `${baseUrl}/models/${modelName}:predictLongRunning`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${await response.text()}`,
        );
      }

      const operationJson = await response.json();

      if (!operationJson.name) {
        throw new Error("Operation name not found in initial response.");
      }

      let operationName = operationJson.name;

      while (true) {
        console.log(`Waiting for completion`);
        await new Promise((resolve) => setTimeout(resolve, 20000));

        try {
          const updatedOperation = await getOperation(operationName);

          if (updatedOperation.done) {
            console.log("Operation completed:", updatedOperation);

            if (updatedOperation.error) {
              throw new Error(
                `Operation failed: ${updatedOperation.error.message}`,
              );
            }

            if (
              !updatedOperation.response ||
              !updatedOperation.response.generateVideoResponse ||
              !updatedOperation.response.generateVideoResponse
                .generatedSamples ||
              updatedOperation.response.generateVideoResponse.generatedSamples
                .length === 0
            ) {
              throw new Error(
                "Video URL not found in the completed operation response.",
              );
            }
            return updatedOperation.response.generateVideoResponse
              .generatedSamples[0].video.uri;
          } else {
            console.log("Operation still in progress.");
          }
        } catch (error) {
          console.error("Error getting operation status:", error);
        }
      }
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  async function getOperation(name: string) {
    try {
      const response = await fetch(`${baseUrl}/${name}`);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${await response.text()}`,
        );
      }

      const operationJson = await response.json();
      return operationJson;
    } catch (error) {
      console.error(`Error getting operation ${name}:`, error);
      throw error;
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

  const filePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (file && filePreviewCanvasRef.current) {
      const canvas = filePreviewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        if (img.width > img.height) {
          console.log("landscape");
          // size to 16x9
          canvas.width = 960;
          canvas.height = 540;
          const imageAspect = img.width / img.height;
          const canvasAspect = canvas.width / canvas.height;
          const scale =
            canvasAspect > imageAspect
              ? canvas.width / img.width
              : canvas.height / img.height;
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
        } else {
          // size to 9x16
          canvas.width = 540;
          canvas.height = 960;
          const imageAspect = img.width / img.height;
          const canvasAspect = canvas.width / canvas.height;
          const scale =
            canvasAspect > imageAspect
              ? canvas.width / img.width
              : canvas.height / img.height;
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
      };
      img.src = URL.createObjectURL(file);
    }
  }, [file]);

  console.log(videoUrl);

  return (
    <div className="w-full relative h-[100dvh]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="opacity-0 absolute top-0 left-0 pointer-events-none"
      />
      <div>File upload</div>
      <div>
        <canvas ref={filePreviewCanvasRef} />
        <input
          type="file"
          accept="png, jpg, jpeg"
          onChange={(e) => {
            const fileList = e.target.files;
            if (fileList && fileList.length > 0) {
              setFile(fileList[0]);
            }
          }}
        />
      </div>
      <input
        className="w-full px-2 py-1 bg-neutral-700 text-neutral-200"
        placeholder="Your prompt here"
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setStatus("Generating video...");
            generateVideo(prompt)
              .then((videoUrl) => {
                setVideoUrl(videoUrl);
                setStatus(`Video generated: ${videoUrl}`);
              })
              .catch((error) => {
                setStatus(`Error: ${error.message}`);
              });
          }
        }}
      />
      <div>{status}</div>

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

      <div className="mt-8">Webcam test</div>
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
    </div>
  );
}

export default App;
