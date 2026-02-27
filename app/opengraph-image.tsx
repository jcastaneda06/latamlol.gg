import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "latamlol.gg - League of Legends stats for LATAM";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0A0E1A 0%, #111827 55%, #0BC4B9 140%)",
          color: "#F0E6D3",
          padding: "64px",
        }}
      >
        <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: -1 }}>
          latamlol.gg
        </div>
        <div style={{ marginTop: 18, fontSize: 36, color: "#C8CDD6" }}>
          League of Legends stats for LATAM
        </div>
      </div>
    ),
    size
  );
}
