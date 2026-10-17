import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Zenith Esports";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#050505",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* We can load our custom fonts here in the future if needed, but standard sans-serif works for fallback OG images */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(circle at 50% 50%, #B8993830 0%, transparent 70%)",
        }} />
        
        <h1
          style={{
            fontSize: 100,
            color: "#FFFFFF",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "-0.05em",
            marginBottom: 20,
            display: "flex",
          }}
        >
          ZENITH ESPORTS
        </h1>
        
        <p
          style={{
            fontSize: 40,
            color: "#B89938",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Forged in Obsidian
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
