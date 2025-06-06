"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  title,
  size = 200,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [value, size]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center">
        {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
        <div className="bg-white p-2 rounded-md">
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  );
}
