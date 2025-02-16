"use client";

export function GradientWave() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 transform -skew-y-12">
            <div className="h-[200%] w-full bg-gradient-to-r from-transparent via-gray-700/30 to-transparent animate-wave" />
          </div>
        </div>
      </div>
    </div>
  );
}
