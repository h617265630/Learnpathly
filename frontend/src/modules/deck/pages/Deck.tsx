import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const sampleCards = [
  {
    front: "What is a list comprehension in Python?",
    back: "A concise way to create lists using [expr for item in iterable]",
  },
  {
    front: "What is the time complexity of dict lookup?",
    back: "O(1) on average, O(n) worst case",
  },
  {
    front: "What is the difference between a stack and a queue?",
    back: "Stack: LIFO, Queue: FIFO",
  },
];

export default function Deck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = sampleCards[currentIndex];

  function next() {
    setFlipped(false);
    setCurrentIndex((i) => Math.min(i + 1, sampleCards.length - 1));
  }

  function prev() {
    setFlipped(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Deck
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Flashcard
                <br />
                <span className="text-amber-500">Study.</span>
              </h1>
            </div>
            <span className="text-sm text-stone-400">
              {currentIndex + 1} / {sampleCards.length}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div
          className="rounded-md bg-white border border-stone-100 p-8 min-h-48 cursor-pointer flex items-center justify-center text-center"
          onClick={() => setFlipped(!flipped)}
        >
          <p className="text-lg font-semibold text-stone-900">
            {flipped ? current.back : current.front}
          </p>
        </div>

        <p className="text-center text-sm text-stone-400 mt-3">
          Click card to {flipped ? "see question" : "reveal answer"}
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            className="rounded-none"
            onClick={prev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            className="rounded-none bg-amber-500 text-white hover:bg-amber-600"
            onClick={next}
            disabled={currentIndex === sampleCards.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
