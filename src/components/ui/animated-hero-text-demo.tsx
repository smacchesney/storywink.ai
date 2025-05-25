"use client";

import { AnimatedHeroText } from "@/components/ui/animated-hero-text";

function AnimatedHeroTextDemo() {
  return (
    <div className="space-y-12 p-8">
      {/* Default Usage */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Default Usage</h2>
        <AnimatedHeroText />
      </div>

      {/* Custom Words */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Custom Words</h2>
        <AnimatedHeroText 
          staticTextBefore="Every Child Becomes a"
          rotatingWords={["Superhero", "Champion", "Star", "Legend"]}
        />
      </div>

      {/* Faster Animation */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Faster Animation (1.5s)</h2>
        <AnimatedHeroText 
          staticTextBefore="Watch Your Kid Become a"
          rotatingWords={["Dreamer", "Creator", "Leader", "Innovator"]}
          interval={1500}
        />
      </div>
    </div>
  );
}

export { AnimatedHeroTextDemo }; 