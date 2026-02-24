"use client";

import Link from "next/link";
import Lottie from "lottie-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/book-animation.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data));
  }, []);

  return (
    <main className="min-h-screen gradient-soft">
      <div className="container mx-auto px-4 py-16">
        <div className="text-left mb-40">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-2">
            Curio
          </h1>
          <p className="text-xl md:text-2xl text-pine-700 font-medium">
            A space to curate your reading
          </p>
        </div>

        {/* Intro Text - Centered with Inline Links */}
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-5xl md:text-6xl text-pine-800 leading-tight mb-8">
            Fall in love, release an ancient entity, jump to a parallel
            universe, or solve a cold case. Curate your journeys here.{" "}
          </p>
          <p className="text-center text-5xl md:text-6xl text-pine-800 leading-tight mb-16">
            <Link
              href="/search"
              className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4 transition-colors"
            >
              Start exploring
            </Link>{" "}
            or{" "}
            <Link
              href="/lists"
              className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4 transition-colors"
            >
              go to your curations
            </Link>
            .
          </p>

          {/* Lottie Animation - Centered Below Text */}
          <div className="flex justify-center">
            <div className="w-40 h-40 md:w-48 md:h-48">
              {animationData && (
                <Lottie animationData={animationData} loop={true} />
              )}
            </div>
          </div>

          {/* About Link */}
          <p className="text-center text-lg text-pine-800 mt-8">
            <Link
              href="/about"
              className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4 transition-colors"
            >
              About the developer
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}